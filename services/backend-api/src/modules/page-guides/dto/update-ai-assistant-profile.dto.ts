import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UpdateAiAssistantProfileDto } from '@smartfeed/shared';
import { IsValidAvatar } from '@/modules/auth/validators/is-valid-avatar.decorator';

export class UpdateAiAssistantProfileRequestDto implements UpdateAiAssistantProfileDto {
  @ApiPropertyOptional({
    example: 'SmartFeed AI Copilot',
    description: 'AI Assistant display name',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: 'https://r2.smartfeed.studio/avatars/custom-ai.png',
    description: 'Custom avatar URL for AI Assistant',
  })
  @IsOptional()
  @IsString()
  @IsValidAvatar()
  avatarUrl?: string;

  @ApiPropertyOptional({
    example: 'Персональний AI-асистент з товарних каталогів та фідів',
    description: 'Role description in Ukrainian',
  })
  @IsOptional()
  @IsString()
  roleUk?: string;

  @ApiPropertyOptional({
    example: 'Personal AI Catalog & Feed Copilot',
    description: 'Role description in English',
  })
  @IsOptional()
  @IsString()
  roleEn?: string;

  @ApiPropertyOptional({ example: 'AI Автопілот 24/7', description: 'Badge title in Ukrainian' })
  @IsOptional()
  @IsString()
  badgeUk?: string;

  @ApiPropertyOptional({ example: '24/7 AI Autopilot', description: 'Badge title in English' })
  @IsOptional()
  @IsString()
  badgeEn?: string;
}
