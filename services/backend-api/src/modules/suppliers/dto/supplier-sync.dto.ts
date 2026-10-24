// @golden - Reference pattern for controller DTOs with 100% class-validator coverage and shared enums (BE-01)
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import {
  ImageSyncMode,
  DescriptionSyncMode,
  AttributesSyncMode,
  TitleSyncMode,
  CategorySyncMode,
  BarcodeSyncMode,
  SyncPriceSource,
  SyncZeroPriceAction,
  SyncMissingProductsAction,
  SyncNewProductsAction,
} from '@smartfeed/shared';

export class UpdateSupplierSyncSettingDto {
  @IsOptional()
  @IsBoolean()
  protectEditedProducts?: boolean;

  @IsOptional()
  @IsBoolean()
  syncPrices?: boolean;

  @IsOptional()
  @IsBoolean()
  syncStocks?: boolean;

  @IsOptional()
  @IsEnum(ImageSyncMode)
  imageSyncMode?: ImageSyncMode;

  @IsOptional()
  @IsEnum(DescriptionSyncMode)
  descriptionSyncMode?: DescriptionSyncMode;

  @IsOptional()
  @IsEnum(AttributesSyncMode)
  attributesSyncMode?: AttributesSyncMode;

  @IsOptional()
  @IsEnum(TitleSyncMode)
  titleSyncMode?: TitleSyncMode;

  @IsOptional()
  @IsEnum(CategorySyncMode)
  categorySyncMode?: CategorySyncMode;

  @IsOptional()
  @IsEnum(BarcodeSyncMode)
  barcodeSyncMode?: BarcodeSyncMode;

  @IsOptional()
  @IsEnum(SyncPriceSource)
  priceSource?: SyncPriceSource;

  @IsOptional()
  @IsEnum(SyncZeroPriceAction)
  zeroPriceAction?: SyncZeroPriceAction;

  @IsOptional()
  @IsEnum(SyncMissingProductsAction)
  missingProductsAction?: SyncMissingProductsAction;

  @IsOptional()
  @IsEnum(SyncNewProductsAction)
  newProductsAction?: SyncNewProductsAction;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(168)
  syncIntervalHours?: number;
}

export class TriggerSupplierSyncDto {
  @IsOptional()
  @IsString()
  feedSourceId?: string;

  @IsOptional()
  @IsBoolean()
  forceFull?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  totalProducts?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  createdCount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  updatedCount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  outOfStockCount?: number;
}

export class GetSupplierSyncLogsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}
