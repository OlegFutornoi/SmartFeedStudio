import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PresignedUrlDto {
  @ApiProperty({ description: 'File name to upload' })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({ description: 'MIME content type of file' })
  @IsString()
  @IsNotEmpty()
  contentType: string;

  @ApiPropertyOptional({ description: 'Target folder in bucket', default: 'images' })
  @IsString()
  @IsOptional()
  folder?: string;

  @ApiPropertyOptional({ description: 'Expected file size in bytes', example: 1048576 })
  @IsInt()
  @Min(1)
  @Max(524288000)
  @IsOptional()
  fileSize?: number;
}
