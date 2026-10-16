// @golden - Reference pattern for query DTO with optional enum validation (BE-01)
import { IsEnum, IsOptional } from 'class-validator';
import { TargetApp } from '@smartfeed/shared';

export class BootstrapQueryDto {
  @IsOptional()
  @IsEnum(TargetApp)
  app?: TargetApp;
}
