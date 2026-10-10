import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLegalDocumentDto {
  @ApiProperty({ description: 'URL slug for the legal document (e.g. terms-of-service)' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({ description: 'Document title in Ukrainian' })
  @IsString()
  @IsNotEmpty()
  titleUk: string;

  @ApiProperty({ description: 'Document title in English' })
  @IsString()
  @IsNotEmpty()
  titleEn: string;

  @ApiProperty({ description: 'Document content in Ukrainian' })
  @IsString()
  @IsNotEmpty()
  contentUk: string;

  @ApiProperty({ description: 'Document content in English' })
  @IsString()
  @IsNotEmpty()
  contentEn: string;

  @ApiProperty({ required: false, default: true, description: 'Whether the document is published' })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  @ApiProperty({ required: false, default: '2.0', description: 'Document version tag' })
  @IsString()
  @IsOptional()
  version?: string;
}
