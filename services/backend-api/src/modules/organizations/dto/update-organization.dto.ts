import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class UpdateOrganizationDto {
  @ApiProperty({ example: 'Acme Super Feeds', description: 'Updated company name' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'Organization name must be at least 2 characters long' })
  name: string;
}
