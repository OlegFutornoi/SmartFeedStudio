import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PageGuideDto, AiAssistantProfileDto } from '@smartfeed/shared';

export class AiAssistantProfileResponseDto implements AiAssistantProfileDto {
  @ApiProperty({ example: 'SmartFeed AI Copilot' })
  name!: string;

  @ApiPropertyOptional({ example: 'https://cdn.smartfeed.studio/avatars/copilot.webp' })
  avatarUrl?: string;

  @ApiProperty({ example: 'Персональний AI-асистент з товарних каталогів та фідів' })
  roleUk!: string;

  @ApiProperty({ example: 'Personal AI Catalog & Feed Copilot' })
  roleEn!: string;

  @ApiProperty({ example: 'AI Автопілот 24/7' })
  badgeUk!: string;

  @ApiProperty({ example: '24/7 AI Autopilot' })
  badgeEn!: string;
}

export class PageGuideResponseDto implements PageGuideDto {
  @ApiPropertyOptional({ example: 'cmv...guide' })
  id?: string;

  @ApiProperty({ example: '/cloud-sync' })
  route!: string;

  @ApiProperty({ example: 'Хмарне сховище & Медіа' })
  titleUk!: string;

  @ApiProperty({ example: 'Cloud Storage & Media' })
  titleEn!: string;

  @ApiProperty({ example: 'Cloud' })
  icon!: string;

  @ApiProperty({ example: 'Хмарне сховище' })
  badgeUk!: string;

  @ApiProperty({ example: 'Cloud Storage' })
  badgeEn!: string;

  @ApiProperty({ example: 'Збереження медіафайлів у Cloudflare R2.' })
  summaryUk!: string;

  @ApiProperty({ example: 'Media files storage in Cloudflare R2.' })
  summaryEn!: string;

  @ApiProperty({ example: 'Детальний опис можливостей сторінки...' })
  descriptionUk!: string;

  @ApiProperty({ example: 'Detailed description of page capabilities...' })
  descriptionEn!: string;

  @ApiProperty({ example: ['Можливість 1', 'Можливість 2'], type: [String] })
  featuresUk!: string[];

  @ApiProperty({ example: ['Feature 1', 'Feature 2'], type: [String] })
  featuresEn!: string[];

  @ApiPropertyOptional({ example: 'Корисна порада ШІ...' })
  proTipUk?: string;

  @ApiPropertyOptional({ example: 'Helpful AI tip...' })
  proTipEn?: string;

  @ApiPropertyOptional({ type: () => AiAssistantProfileResponseDto })
  assistant?: AiAssistantProfileResponseDto;
}
