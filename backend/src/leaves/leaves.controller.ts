import {
  Body, Controller, Delete, Get, Param, Patch, Post, Req, Res,
  UploadedFiles, UseGuards, UseInterceptors, ParseIntPipe
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { LeavesService } from './leaves.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';

@ApiTags('Leaves')
@ApiBearerAuth()
@Controller('leaves')
@UseGuards(JwtAuthGuard)
export class LeavesController {
  constructor(private leaves: LeavesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all leave requests' })
  findAll() {
    return this.leaves.findAll();
  }

  @Get(':id/documents/:index')
  @ApiOperation({ summary: 'Download leave medical document' })
  downloadDocument(
    @Param('id') id: string,
    @Param('index', ParseIntPipe) index: number,
    @Res() res: Response,
  ) {
    return this.leaves.downloadDocument(id, index, res);
  }

  @Post()
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FilesInterceptor('documents', 10, {
    storage: diskStorage({
      destination: (_req, _file, cb) => {
        const dir = join(process.cwd(), 'uploads', 'leave-documents');
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: (_req, file, cb) => cb(null, `doc-${Date.now()}${extname(file.originalname)}`),
    }),
  }))
  @ApiOperation({ summary: 'Apply for leave (supports medical document upload)' })
  create(@Body() body: any, @Req() req: any, @UploadedFiles() files?: Express.Multer.File[]) {
    return this.leaves.create({
      ...body,
      employeeId: req.user?.employeeId,
      employeeName: req.user?.name,
      applicantEmail: req.user?.email,
    }, files, req.user?.role);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr_manager', 'project_manager', 'reporting_manager')
  @ApiOperation({ summary: 'Approve or reject leave (sets all approval steps)' })
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.leaves.updateStatus(id, status);
  }

  @Patch(':id/approve')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr_manager', 'project_manager', 'reporting_manager')
  @ApiOperation({ summary: 'Role-based sequential leave approval' })
  approveStep(@Param('id') id: string, @Body() body: { status: string }, @Req() req: any) {
    return this.leaves.approveStep(id, req.user?.role, body.status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a pending leave request (marks as Deleted)' })
  remove(@Param('id') id: string) {
    return this.leaves.remove(id);
  }
}
