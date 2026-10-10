import {
  Injectable,
  NotFoundException,
  ConflictException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateLegalDocumentDto } from '@/modules/legal/dto/create-legal-document.dto';
import { UpdateLegalDocumentDto } from '@/modules/legal/dto/update-legal-document.dto';

@Injectable()
export class LegalService implements OnModuleInit {
  private readonly logger = new Logger(LegalService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedDefaultLegalDocuments();
  }

  private async seedDefaultLegalDocuments() {
    try {
      const termsCount = await this.prisma.legalDocument.count({
        where: { slug: 'terms-of-service' },
      });

      if (termsCount === 0) {
        await this.prisma.legalDocument.create({
          data: {
            slug: 'terms-of-service',
            titleUk: 'Умови використання SmartFeed Studio',
            titleEn: 'Terms of Service — SmartFeed Studio',
            contentUk:
              '1. Загальні положення\nВикористовуючи наш десктопний додаток або хмарні сервіси, ви погоджуєтеся дотримуватися цих Умов використання.\n\n2. Обліковий запис та безпека\nВи несете повну відповідальність за безпеку ваших облікових даних та збереження паролю.\n\n3. Ліцензії та квоти\nВикористання додатку регулюється ліцензійним ключем. Тариф Free надає базові ліміти до 1 000 SKU.\n\n4. Конфіденційність та дані каталогів\nВаші бази даних постачальників, собівартість та націнки зберігаються локально у зашифрованому сховищі SQLite (SQLCipher).',
            contentEn:
              '1. General Provisions\nBy accessing or using our desktop application and associated cloud services, you agree to be bound by these Terms of Service.\n\n2. User Accounts & Security\nYou are responsible for maintaining the confidentiality of your account credentials.\n\n3. Licenses & Quotas\nSoftware usage is controlled via license keys. The Free tier provides base quotas up to 1,000 SKUs.\n\n4. Catalog Data Confidentiality\nSupplier databases and margins remain stored locally inside an encrypted SQLCipher SQLite database.',
            isPublished: true,
            version: '2.0',
          },
        });
        this.logger.log('Seeded default terms-of-service legal document');
      }

      const privacyCount = await this.prisma.legalDocument.count({
        where: { slug: 'privacy-policy' },
      });

      if (privacyCount === 0) {
        await this.prisma.legalDocument.create({
          data: {
            slug: 'privacy-policy',
            titleUk: 'Політика конфіденційності SmartFeed Studio',
            titleEn: 'Privacy Policy — SmartFeed Studio',
            contentUk:
              '1. Які дані ми збираємо\nОблікові дані: адреса електронної пошти, ім’я, назва компанії для активації ліцензії.\n\n2. Локальне шифрування на вашому пристрої\nВсі товари, прайси постачальників (XML/CSV) та правила ціноутворення зберігаються локально на вашому комп’ютері.\n\n3. Використання інформації\nЗібрані облікові дані використовуються виключно для автентифікації та перевірки підписки.\n\n4. Ваші права\nВи маєте право в будь-який момент експортувати свої локальні дані або подати запит на видалення акаунту.',
            contentEn:
              '1. Information We Collect\nAccount details: email address, user name, and store/company name used for license activation.\n\n2. Device-Level Local Encryption\nAll product items, supplier files (XML/CSV), and pricing formulas are stored locally on your desktop.\n\n3. How We Use Data\nAccount credentials are used strictly for authentication and license provisioning.\n\n4. User Rights\nYou have the right to export your local catalogs at any time or request account deletion.',
            isPublished: true,
            version: '2.0',
          },
        });
        this.logger.log('Seeded default privacy-policy legal document');
      }
    } catch (error) {
      this.logger.warn('Failed to seed default legal documents:', error);
    }
  }

  async findAll(publishedOnly = false) {
    return this.prisma.legalDocument.findMany({
      where: publishedOnly ? { isPublished: true } : undefined,
      orderBy: { createdAt: 'asc' },
    });
  }

  async findBySlug(slug: string) {
    const doc = await this.prisma.legalDocument.findUnique({
      where: { slug },
    });

    if (!doc || !doc.isPublished) {
      throw new NotFoundException(`Legal document with slug "${slug}" not found`);
    }

    return doc;
  }

  async findById(id: string) {
    const doc = await this.prisma.legalDocument.findUnique({
      where: { id },
    });

    if (!doc) {
      throw new NotFoundException(`Legal document with id "${id}" not found`);
    }

    return doc;
  }

  async create(dto: CreateLegalDocumentDto) {
    const existing = await this.prisma.legalDocument.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException(`Document with slug "${dto.slug}" already exists`);
    }

    return this.prisma.legalDocument.create({
      data: {
        slug: dto.slug,
        titleUk: dto.titleUk,
        titleEn: dto.titleEn,
        contentUk: dto.contentUk,
        contentEn: dto.contentEn,
        isPublished: dto.isPublished ?? true,
        version: dto.version ?? '2.0',
      },
    });
  }

  async update(id: string, dto: UpdateLegalDocumentDto) {
    await this.findById(id);

    if (dto.slug) {
      const existing = await this.prisma.legalDocument.findUnique({
        where: { slug: dto.slug },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Document with slug "${dto.slug}" already exists`);
      }
    }

    return this.prisma.legalDocument.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findById(id);
    return this.prisma.legalDocument.delete({
      where: { id },
    });
  }
}
