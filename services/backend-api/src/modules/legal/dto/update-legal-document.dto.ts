import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateLegalDocumentDto {
  @ApiProperty({ required: false, description: 'URL slug for the legal document' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({ required: false, description: 'Document title in Ukrainian' })
  @IsString()
  @IsOptional()
  titleUk?: string;

  @ApiProperty({ required: false, description: 'Document title in English' })
  @IsString()
  @IsOptional()
  titleEn?: string;

  @ApiProperty({ required: false, description: 'Document content in Ukrainian' })
  @IsString()
  @IsOptional()
  contentUk?: string;

  @ApiProperty({ required: false, description: 'Document content in English' })
  @IsString()
  @IsOptional()
  contentEn?: string;

  @ApiProperty({ required: false, description: 'Whether the document is published' })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  @ApiProperty({ required: false, description: 'Document version tag' })
  @IsString()
  @IsOptional()
  version?: string;
}
