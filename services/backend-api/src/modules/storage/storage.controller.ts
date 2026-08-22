import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CommandBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GeneratePresignedUploadUrlCommand } from './commands/generate-presigned-url.command';
import { PresignedUploadUrlResult } from '@smartfeed/shared';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class PresignedUrlDto {
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  contentType: string;

  @IsString()
  @IsOptional()
  folder?: string;
}

@ApiTags('Storage')
@Controller('storage')
export class StorageController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('presigned-url')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate S3/MinIO presigned upload URL for direct client upload' })
  @ApiResponse({ status: 201, description: 'Presigned URL generated successfully' })
  async getPresignedUrl(
    @CurrentUser('id') userId: string,
    @Body() dto: PresignedUrlDto,
  ): Promise<PresignedUploadUrlResult> {
    return this.commandBus.execute(
      new GeneratePresignedUploadUrlCommand(
        userId,
        dto.fileName,
        dto.contentType,
        dto.folder || 'images',
      ),
    );
  }
}
