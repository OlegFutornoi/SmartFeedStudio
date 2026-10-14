import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TargetApp } from '@smartfeed/shared';

export class GetNavigationQueryDto {
  @ApiPropertyOptional({
    enum: TargetApp,
    description: 'Target application platform (DESKTOP or WEB)',
  })
  @IsOptional()
  @IsEnum(TargetApp)
  app?: TargetApp;
}
