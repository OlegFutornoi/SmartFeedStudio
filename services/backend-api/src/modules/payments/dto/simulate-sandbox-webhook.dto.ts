import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SimulateSandboxWebhookDto {
  @ApiProperty({ description: 'Order reference of the payment transaction' })
  @IsString()
  orderReference: string;

  @ApiPropertyOptional({ enum: ['Approved', 'Declined'], description: 'Desired webhook status' })
  @IsOptional()
  @IsIn(['Approved', 'Declined'])
  status?: 'Approved' | 'Declined';

  @ApiPropertyOptional({ description: 'Decline reason text' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Card PAN mask or full number for simulation' })
  @IsOptional()
  @IsString()
  cardPan?: string;

  @ApiPropertyOptional({ description: 'Card Type (e.g. Visa, MasterCard)' })
  @IsOptional()
  @IsString()
  cardType?: string;

  @ApiPropertyOptional({ description: 'Issuer bank name' })
  @IsOptional()
  @IsString()
  issuerBank?: string;
}
