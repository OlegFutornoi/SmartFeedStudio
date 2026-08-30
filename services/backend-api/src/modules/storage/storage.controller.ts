import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequireActiveLicenseGuard } from '../licenses/guards/require-active-license.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GeneratePresignedUploadUrlCommand } from './commands/generate-presigned-url.command';
import {
  PresignedUploadUrlResult,
  WorkspaceInfoDto,
  StorageStatsDto,
  DatabaseMaintenanceResultDto,
  CreateLocalBackupResultDto,
  ClearStorageCacheResultDto,
} from '@smartfeed/shared';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { GetDefaultWorkspacePathQuery } from './queries/get-default-workspace-path.query';
import { GetWorkspaceInfoQuery } from './queries/get-workspace-info.query';
import { GetStorageStatsQuery } from './queries/get-storage-stats.query';
import { InitWorkspaceCommand } from './commands/init-workspace.command';
import { OpenWorkspaceFolderCommand } from './commands/open-workspace-folder.command';
import { CreateLocalBackupCommand } from './commands/create-local-backup.command';
import { RunDatabaseMaintenanceCommand } from './commands/run-database-maintenance.command';
import { ClearStorageCacheCommand } from './commands/clear-storage-cache.command';
import { MigrateWorkspaceCommand } from './commands/migrate-workspace.command';

export class PresignedUrlDto {
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  contentType: string;

  @IsString()
  @IsOptional()
  folder?: string;
}

export class InitWorkspaceRequestDto {
  @IsString()
  @IsNotEmpty()
  workspacePath: string;

  @IsBoolean()
  @IsOptional()
  enableEncryption?: boolean;
}

export class OpenFolderRequestDto {
  @IsString()
  @IsNotEmpty()
  path: string;
}

export class WorkspaceActionRequestDto {
  @IsString()
  @IsNotEmpty()
  workspacePath: string;
}

export class MigrateWorkspaceRequestDto {
  @IsString()
  @IsNotEmpty()
  currentPath: string;

  @IsString()
  @IsNotEmpty()
  newPath: string;

  @IsBoolean()
  @IsOptional()
  moveExistingData?: boolean;
}

@ApiTags('Storage')
@Controller('storage')
export class StorageController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('presigned-url')
  @UseGuards(JwtAuthGuard, RequireActiveLicenseGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate S3/MinIO presigned upload URL for direct client upload' })
  @ApiResponse({ status: 201, description: 'Presigned URL generated successfully' })
  async getPresignedUrl(
    @CurrentUser('id') userId: string,
    @Body() dto: PresignedUrlDto,
  ): Promise<PresignedUploadUrlResult> {
    return this.commandBus.execute(
      new GeneratePresignedUploadUrlCommand(
        userId,
        dto.fileName,
        dto.contentType,
        dto.folder || 'images',
      ),
    );
  }

  @Get('workspace/default-path')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get default OS workspace path for the local machine' })
  async getDefaultWorkspacePath(): Promise<{ defaultPath: string }> {
    return this.queryBus.execute(new GetDefaultWorkspacePathQuery());
  }

  @Get('workspace/info')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get workspace initialization status and metadata' })
  async getWorkspaceInfo(@Query('path') workspacePath?: string): Promise<WorkspaceInfoDto | null> {
    return this.queryBus.execute(new GetWorkspaceInfoQuery(workspacePath));
  }

  @Post('workspace/init')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Initialize real workspace directory structure and local database file',
  })
  async initWorkspace(@Body() dto: InitWorkspaceRequestDto): Promise<WorkspaceInfoDto> {
    return this.commandBus.execute(
      new InitWorkspaceCommand(dto.workspacePath, dto.enableEncryption ?? true),
    );
  }

  @Get('workspace/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get real storage statistics, disk sizes and live database entity counts',
  })
  async getStorageStats(
    @CurrentUser('id') userId: string,
    @Query('path') workspacePath?: string,
  ): Promise<StorageStatsDto> {
    return this.queryBus.execute(new GetStorageStatsQuery(userId, workspacePath));
  }

  @Post('workspace/open')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Open workspace folder in native OS file manager (Finder / Explorer)' })
  async openFolder(@Body() dto: OpenFolderRequestDto): Promise<{ success: boolean }> {
    return this.commandBus.execute(new OpenWorkspaceFolderCommand(dto.path));
  }

  @Post('workspace/backup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create physical backup snapshot file in backups directory' })
  async createBackup(@Body() dto: WorkspaceActionRequestDto): Promise<CreateLocalBackupResultDto> {
    return this.commandBus.execute(new CreateLocalBackupCommand(dto.workspacePath));
  }

  @Post('workspace/maintenance')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Run database integrity check and optimization' })
  async runMaintenance(
    @Body() dto: WorkspaceActionRequestDto,
  ): Promise<DatabaseMaintenanceResultDto> {
    return this.commandBus.execute(new RunDatabaseMaintenanceCommand(dto.workspacePath));
  }

  @Post('workspace/clear-cache')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Clear cached feed downloads and temp files on disk' })
  async clearCache(@Body() dto: WorkspaceActionRequestDto): Promise<ClearStorageCacheResultDto> {
    return this.commandBus.execute(new ClearStorageCacheCommand(dto.workspacePath));
  }

  @Post('workspace/migrate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Migrate workspace to a new folder on disk' })
  async migrateWorkspace(@Body() dto: MigrateWorkspaceRequestDto): Promise<WorkspaceInfoDto> {
    return this.commandBus.execute(
      new MigrateWorkspaceCommand(dto.currentPath, dto.newPath, dto.moveExistingData ?? true),
    );
  }
}
