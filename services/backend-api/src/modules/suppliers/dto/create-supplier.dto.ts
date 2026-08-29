import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MinLength,
  IsOptional,
  IsEmail,
  IsUrl,
  IsNumber,
  Min,
  IsBoolean,
  Matches,
} from 'class-validator';

export class CreateSupplierDto {
  @ApiProperty({ example: 'Одяг-Опт' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'SUP-01' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @Matches(/^[A-Za-z0-9_-]+$/, {
    message: 'Code can only contain letters, numbers, dashes and underscores',
  })
  code: string;

  @ApiPropertyOptional({ example: '+380501234567' })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional({ example: 'supplier@example.com' })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional({ example: 'https://supplier.example.com' })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({ example: 'Прямий імпортер текстилю' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 20, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  defaultMarginPercent?: number;

  @ApiPropertyOptional({ example: 50, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  defaultFixedMarkup?: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
