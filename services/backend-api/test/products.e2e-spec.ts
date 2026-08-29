import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { Role, ProductStatus } from '@smartfeed/shared';
import { cleanDatabase } from './utils/teardown.helper';

describe('Products CRUD & Filters (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const timestamp = Date.now();
  let userToken: string;
  let supplierId: string;
  let createdProductId: string;

  const createdEmails: string[] = [];

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
      emailPrefixes: ['products.test+'],
    });

    // 1. Register test user
    const userEmail = `products.test+${timestamp}@smartfeed.local`;
    createdEmails.push(userEmail);
    const userRes = await request(app.getHttpServer()).post('/api/auth/register').send({
      email: userEmail,
      password: 'UserPassword123!',
      fullName: 'Products Test User',
      role: Role.USER,
    });
    userToken = userRes.body.tokens.accessToken;

    // 2. Create a supplier
    const supRes = await request(app.getHttpServer())
      .post('/api/suppliers')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Постачальник Електроніка',
        code: 'SUP-ELEC-01',
      });
    supplierId = supRes.body.id;
  });

  afterAll(async () => {
    await cleanDatabase(prisma, {
      userEmails: createdEmails,
      emailPrefixes: ['products.test+'],
    });
    await app.close();
  });

  describe('POST /api/products', () => {
    it('should create product manually with images and attributes', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          supplierId,
          sku: 'PHONE-PRO-128',
          barcode: '4820000009999',
          titleUk: 'Смартфон Smart Pro 128GB Midnight',
          titleEn: 'Smartphone Smart Pro 128GB Midnight',
          descriptionUk: 'Флагманський смартфон з AMOLED екраном.',
          vendor: 'TechBrand',
          costPrice: 8000,
          price: 10999,
          oldPrice: 12499,
          currency: 'UAH',
          stockQuantity: 15,
          inStock: true,
          status: ProductStatus.ACTIVE,
          images: [
            { originalUrl: 'https://cdn.example.com/phone1.jpg', isMain: true, order: 0 },
            { originalUrl: 'https://cdn.example.com/phone2.jpg', isMain: false, order: 1 },
          ],
          attributes: [
            { nameUk: 'Вбудована памʼять', valueUk: '128', unit: 'GB', order: 0 },
            { nameUk: 'Оперативна памʼять', valueUk: '8', unit: 'GB', order: 1 },
            { nameUk: 'Колір', valueUk: 'Midnight Blue', order: 2 },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.sku).toBe('PHONE-PRO-128');
      expect(res.body.titleUk).toBe('Смартфон Smart Pro 128GB Midnight');
      expect(res.body.price).toBe(10999);
      expect(res.body.costPrice).toBe(8000);
      expect(res.body.images.length).toBe(2);
      expect(res.body.attributes.length).toBe(3);
      expect(res.body.supplierName).toBe('Постачальник Електроніка');

      createdProductId = res.body.id;
    });

    it('should reject duplicate SKU for the same supplier with 409 Conflict', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          supplierId,
          sku: 'PHONE-PRO-128',
          titleUk: 'Дублікат товару',
          price: 9999,
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('already exists');
    });
  });

  describe('GET /api/products', () => {
    it('should return paginated list of products', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/products?page=1&limit=10')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('items');
      expect(res.body).toHaveProperty('total');
      expect(res.body.total).toBe(1);
      expect(res.body.items[0].id).toBe(createdProductId);
    });

    it('should filter products by price range', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/products?minPrice=5000&maxPrice=15000')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.items.length).toBe(1);

      const emptyRes = await request(app.getHttpServer())
        .get('/api/products?minPrice=20000')
        .set('Authorization', `Bearer ${userToken}`);

      expect(emptyRes.status).toBe(200);
      expect(emptyRes.body.items.length).toBe(0);
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return full product details by ID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/products/${createdProductId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(createdProductId);
      expect(res.body.sku).toBe('PHONE-PRO-128');
    });
  });

  describe('PATCH /api/products/:id', () => {
    it('should update product price and title', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/products/${createdProductId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          titleUk: 'Смартфон Smart Pro 128GB Midnight (Оновлена версія)',
          price: 9999,
          stockQuantity: 20,
        });

      expect(res.status).toBe(200);
      expect(res.body.titleUk).toContain('(Оновлена версія)');
      expect(res.body.price).toBe(9999);
      expect(res.body.stockQuantity).toBe(20);
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('should delete product successfully', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/products/${createdProductId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true });

      const verifyRes = await request(app.getHttpServer())
        .get(`/api/products/${createdProductId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(verifyRes.status).toBe(404);
    });
  });

  describe('GET /api/products/categories-summary & POST /api/products/bulk-delete', () => {
    let p1Id: string;
    let p2Id: string;

    beforeAll(async () => {
      const r1 = await request(app.getHttpServer())
        .post('/api/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          supplierId,
          sku: 'BULK-ITEM-01',
          titleUk: 'Товар для масового видалення 1',
          price: 150,
          stockQuantity: 10,
        });
      p1Id = r1.body.id;

      const r2 = await request(app.getHttpServer())
        .post('/api/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          supplierId,
          sku: 'BULK-ITEM-02',
          titleUk: 'Товар для масового видалення 2',
          price: 250,
          stockQuantity: 5,
        });
      p2Id = r2.body.id;
    });

    it('should return categories summary including uncategorized items', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/products/categories-summary')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      const uncategorized = res.body.find((c: any) => c.id === 'uncategorized');
      expect(uncategorized).toBeDefined();
      expect(uncategorized.productCount).toBeGreaterThanOrEqual(2);
    });

    it('should bulk delete products by productIds', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/products/bulk-delete')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productIds: [p1Id, p2Id],
        });

      expect(res.status).toBe(200);
      expect(res.body.deletedCount).toBe(2);

      const check = await request(app.getHttpServer())
        .get(`/api/products/${p1Id}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(check.status).toBe(404);
    });
  });
});
