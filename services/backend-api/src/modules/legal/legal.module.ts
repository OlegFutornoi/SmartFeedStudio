import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { LegalController } from '@/modules/legal/legal.controller';
import { LegalService } from '@/modules/legal/legal.service';

@Module({
  imports: [PrismaModule],
  controllers: [LegalController],
  providers: [LegalService],
  exports: [LegalService],
})
export class LegalModule {}
