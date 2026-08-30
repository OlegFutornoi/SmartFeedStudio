import { IsString, IsNotEmpty, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCheckoutDto {
  @ApiProperty({ example: 'GROWTH', description: 'Plan code to purchase' })
  @IsString()
  @IsNotEmpty()
  planCode: string;

  @ApiProperty({ enum: ['monthly', 'yearly'], example: 'monthly', description: 'Billing interval' })
  @IsString()
  @IsIn(['monthly', 'yearly'])
  billingInterval: 'monthly' | 'yearly';
}
