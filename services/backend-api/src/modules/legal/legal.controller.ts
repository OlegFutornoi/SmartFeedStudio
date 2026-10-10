import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@smartfeed/shared';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { LegalService } from '@/modules/legal/legal.service';
import { CreateLegalDocumentDto } from '@/modules/legal/dto/create-legal-document.dto';
import { UpdateLegalDocumentDto } from '@/modules/legal/dto/update-legal-document.dto';

@ApiTags('Legal')
@Controller('legal')
export class LegalController {
  constructor(private readonly legalService: LegalService) {}

  @Get()
  @ApiOperation({ summary: 'Get all published legal documents' })
  @ApiResponse({ status: 200, description: 'List of published legal documents' })
  async getPublishedDocuments() {
    return this.legalService.findAll(true);
  }

  @Get('document/:slug')
  @ApiOperation({ summary: 'Get published legal document by slug' })
  @ApiResponse({ status: 200, description: 'Legal document data' })
  async getDocumentBySlug(@Param('slug') slug: string) {
    return this.legalService.findBySlug(slug);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all legal documents for administration (published and drafts)' })
  @ApiResponse({ status: 200, description: 'List of all legal documents' })
  async getAllDocumentsAdmin() {
    return this.legalService.findAll(false);
  }

  @Post('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new legal document' })
  @ApiResponse({ status: 201, description: 'Legal document created' })
  async createDocumentAdmin(@Body() dto: CreateLegalDocumentDto) {
    return this.legalService.create(dto);
  }

  @Put('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an existing legal document' })
  @ApiResponse({ status: 200, description: 'Legal document updated' })
  async updateDocumentAdmin(@Param('id') id: string, @Body() dto: UpdateLegalDocumentDto) {
    return this.legalService.update(id, dto);
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a legal document' })
  @ApiResponse({ status: 200, description: 'Legal document deleted' })
  async deleteDocumentAdmin(@Param('id') id: string) {
    return this.legalService.remove(id);
  }
}
