import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { FeedSourceType, Role } from '@smartfeed/shared';
import { cleanDatabase } from './utils/teardown.helper';

describe('Feeds Parsing & Ingestion (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const timestamp = Date.now();
  let userToken: string;
  let supplierId: string;

  const createdEmails: string[] = [];

  const sampleRozetkaXml = `<?xml version="1.0" encoding="UTF-8"?>
<yml_catalog date="2026-08-29 12:00">
  <shop>
    <name>Test Rozetka Feed</name>
    <company>Supplier Co</company>
    <currencies>
      <currency id="UAH" rate="1"/>
    </currencies>
    <categories>
      <category id="101">Чоловічий одяг</category>
      <category id="102" parentId="101">Футболки</category>
      <category id="103">Аксесуари</category>
    </categories>
    <offers>
      <offer id="OFFER-001" available="true">
        <name_ua>Футболка бавовняна біла Розмір L</name_ua>
        <price>200.00</price>
        <price_cost>150.00</price_cost>
        <currencyId>UAH</currencyId>
        <categoryId>102</categoryId>
        <picture>https://images.example.com/tshirt1.jpg</picture>
        <picture>https://images.example.com/tshirt2.jpg</picture>
        <vendor>Nike</vendor>
        <vendorCode>TSHIRT-01-L</vendorCode>
        <barcode>4820000000001</barcode>
        <description_ua>Стильна та зручна футболка з 100% бавовни.</description_ua>
        <param name="Розмір">L</param>
        <param name="Колір">Білий</param>
      </offer>
      <offer id="OFFER-002" available="false">
        <name_ua>Кросівки бігові чорні 43</name_ua>
        <price>1000.00</price>
        <currencyId>UAH</currencyId>
        <categoryId>101</categoryId>
        <vendor>Adidas</vendor>
        <vendorCode>SHOE-02-43</vendorCode>
        <description_ua>Легкі кросівки для тренувань.</description_ua>
        <param name="Розмір взуття">43</param>
      </offer>
    </offers>
  </shop>
</yml_catalog>`;

  const sampleCsvContent = `sku,title,price,costPrice,stockQuantity,vendor,images
CSV-ITEM-101,Кепка літня бежева,150.00,100.00,25,Puma,https://images.example.com/cap1.jpg
CSV-ITEM-102,Рюкзак міський чорний,800.00,600.00,5,Puma,https://images.example.com/bag1.jpg`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    await app.init();

    await cleanDatabase(prisma, {
      emailPrefixes: ['feeds.test+'],
    });

    // 1. Register test user
    const userEmail = `feeds.test+${timestamp}@smartfeed.local`;
    createdEmails.push(userEmail);
    const userRes = await request(app.getHttpServer()).post('/api/auth/register').send({
      email: userEmail,
      password: 'UserPassword123!',
      fullName: 'Feeds Test User',
      role: Role.USER,
    });
    userToken = userRes.body.tokens.accessToken;

    // 2. Create a supplier with +20% margin and +50 UAH markup
    const supRes = await request(app.getHttpServer())
      .post('/api/suppliers')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Постачальник Rozetka Feed',
        code: 'SUP-ROZETKA-01',
        defaultMarginPercent: 20,
        defaultFixedMarkup: 50,
      });
    supplierId = supRes.body.id;
  });

  afterAll(async () => {
    await cleanDatabase(prisma, {
      userEmails: createdEmails,
      emailPrefixes: ['feeds.test+'],
    });
    await app.close();
  });

  describe('POST /api/feeds/analyze', () => {
    it('should analyze XML feed and detect structure, full categories with SKU counts, and sample products', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/feeds/analyze')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          content: sampleRozetkaXml,
        });

      expect(res.status).toBe(200);
      expect(res.body.totalDetected).toBe(2);
      expect(res.body.categoriesCount).toBe(3);
      expect(res.body.categories.length).toBe(3);
      const cat102 = res.body.categories.find((c: any) => c.id === '102');
      expect(cat102).toBeDefined();
      expect(cat102.name).toBe('Футболки');
      expect(cat102.productCount).toBe(1);
      expect(res.body.sampleProducts[0].titleUk).toContain('Футболка бавовняна');
    });
  });

  describe('POST /api/feeds/import-async & BullMQ queue', () => {
    it('should queue background import job and return 202 Accepted with jobId', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/feeds/import-async')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          supplierId,
          sourceType: FeedSourceType.FILE,
          fileContent: sampleRozetkaXml,
          fileName: 'rozetka.xml',
          selectedCategoryIds: ['102'], // Import only category 102 (Футболки)
        });

      expect(res.status).toBe(202);
      expect(res.body.success).toBe(true);
      expect(res.body.jobId).toBeDefined();
      expect(res.body.feedSourceId).toBeDefined();

      const jobId = res.body.jobId;

      // Query job status via GET /api/feeds/jobs/:jobId
      const statusRes = await request(app.getHttpServer())
        .get(`/api/feeds/jobs/${jobId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(statusRes.status).toBe(200);
      expect(statusRes.body.id).toBe(jobId);
      expect(statusRes.body.feedSource).toBeDefined();
    });
  });

  describe('Supplier Feed Sources Management', () => {
    it('should get list of connected feed sources for a supplier', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/feeds/suppliers/${supplierId}/sources`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].supplierId).toBe(supplierId);
    });
  });

  describe('POST /api/feeds/import-content (Synchronous fallback)', () => {
    beforeAll(async () => {
      await prisma.product.deleteMany({ where: { supplierId } });
      await prisma.feedSource.deleteMany({ where: { supplierId } });
    });

    it('should import XML feed, create categories, calculate price markup and store attributes/images', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/feeds/import-content')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          supplierId,
          content: sampleRozetkaXml,
        });

      expect(res.status).toBe(200);
      expect(res.body.totalItems).toBe(2);
      expect(res.body.createdItems + (res.body.updatedItems || 0)).toBe(2);
      expect(res.body.categoriesCreated).toBeGreaterThanOrEqual(1);

      // Verify products created in database via GET /api/products
      const prodRes = await request(app.getHttpServer())
        .get(`/api/products?supplierId=${supplierId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(prodRes.status).toBe(200);
      expect(prodRes.body.items.length).toBe(2);

      const tshirt = prodRes.body.items.find((i: any) => i.sku === 'TSHIRT-01-L');
      expect(tshirt).toBeDefined();
      expect(tshirt.titleUk).toContain('Футболка');
      expect(tshirt.costPrice).toBe(150);
      // Expected price = 150 + 20% (30) + 50 = 230
      expect(tshirt.price).toBe(230);
      expect(tshirt.inStock).toBe(true);
      expect(tshirt.images.length).toBe(2);
      expect(tshirt.attributes.length).toBe(2);
      expect(tshirt.supplierName).toBe('Постачальник Rozetka Feed');
    });

    it('should import CSV feed and add products to catalog', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/feeds/import-content')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          supplierId,
          content: sampleCsvContent,
        });

      expect(res.status).toBe(200);
      expect(res.body.totalItems).toBe(2);
      expect(res.body.createdItems).toBe(2);

      const prodRes = await request(app.getHttpServer())
        .get(`/api/products?search=Кепка`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(prodRes.status).toBe(200);
      expect(prodRes.body.items.length).toBe(1);
      // Expected price for cap: 100 + 20% (20) + 50 = 170
      expect(prodRes.body.items[0].price).toBe(170);

      // Verify FeedSource record is created
      const feedSources = await prisma.feedSource.findMany({
        where: { supplierId },
      });
      expect(feedSources.length).toBeGreaterThan(0);
    });

    it('DELETE /api/feeds/suppliers/:id/sources/:sourceId?deleteProducts=true should ONLY delete products of that specific feed source, keeping other feeds intact', async () => {
      // Find the feed sources
      const sources = await prisma.feedSource.findMany({
        where: { supplierId },
        orderBy: { createdAt: 'desc' },
      });
      expect(sources.length).toBeGreaterThanOrEqual(2);

      const xmlSource = sources.find(
        (s) => s.fileFormat === 'XML_ROZETKA' || s.fileFormat !== 'CSV',
      )!;
      const csvSource = sources.find((s) => s.id !== xmlSource.id)!;

      // Verify before delete
      const beforeProducts = await prisma.product.findMany({
        where: { supplierId },
      });
      expect(beforeProducts.length).toBe(4);

      // Delete CSV feed source with product cascade
      const delRes = await request(app.getHttpServer())
        .delete(`/api/feeds/suppliers/${supplierId}/sources/${csvSource.id}?deleteProducts=true`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.deletedProductsCount).toBe(2);

      // Verify remaining products in database: ONLY XML products remain
      const remainingProducts = await prisma.product.findMany({
        where: { supplierId },
      });
      expect(remainingProducts.length).toBe(2);

      // CSV product should NOT exist
      const deletedCsvProduct = remainingProducts.find((p) => p.sku === 'CSV-ITEM-101');
      expect(deletedCsvProduct).toBeUndefined();

      // XML product MUST still exist!
      const existingXmlProduct = remainingProducts.find((p) => p.sku === 'TSHIRT-01-L');
      expect(existingXmlProduct).toBeDefined();
      expect(existingXmlProduct?.feedSourceId).toBe(xmlSource?.id);
    });
  });

  describe('URL Feed Validation & Analysis', () => {
    it('POST /api/feeds/analyze-url throws 400 for empty or invalid URL', async () => {
      await request(app.getHttpServer())
        .post('/api/feeds/analyze-url')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ url: 'invalid-not-http-url' })
        .expect(400);
    });

    it('POST /api/feeds/import-url throws 400 for unreachable URL', async () => {
      await request(app.getHttpServer())
        .post('/api/feeds/import-url')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          supplierId,
          url: 'https://unreachable-domain-12345.test/feed.xml',
        })
        .expect(400);
    });
  });
});
