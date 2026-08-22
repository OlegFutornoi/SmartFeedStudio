import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigModule } from '@nestjs/config';
import { GeneratePresignedUploadUrlHandler } from './commands/generate-presigned-url.handler';
import { StorageController } from './storage.controller';

export const CommandHandlers = [GeneratePresignedUploadUrlHandler];

@Module({
  imports: [CqrsModule, ConfigModule],
  controllers: [StorageController],
  providers: [...CommandHandlers],
  exports: [...CommandHandlers],
})
export class StorageModule {}
