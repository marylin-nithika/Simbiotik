import { Body, Controller, Get, Param, Patch, Post, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';
import * as fs from 'fs';
import { PerformanceService } from './performance.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Response } from 'express';

@ApiTags('Performance')
@ApiBearerAuth()
@Controller('performance')
@UseGuards(JwtAuthGuard)
export class PerformanceController {
  constructor(private performance: PerformanceService) {}

  @Get('feedback')
  @ApiOperation({ summary: 'Get team leader feedback (HR sees all)' })
  getFeedbacks(@Req() req: any) {
    return this.performance.getFeedbacks(req.user.role, req.user.employeeId);
  }

  @Get('template')
  @ApiOperation({ summary: 'Get performance templates' })
  getTemplates() {
    return this.performance.getTemplates();
  }

  @Get('template/:id/download')
  @ApiOperation({ summary: 'Download a performance template PDF' })
  downloadTemplate(@Param('id') id: string, @Res() res: Response) {
    return this.performance.downloadTemplate(id, res);
  }

  @Post('template')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr_manager')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const dir = join(process.cwd(), 'uploads', 'performance-templates');
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}-${file.originalname}`);
      },
    }),
  }))
  @ApiOperation({ summary: 'Create a performance template' })
  createTemplate(@Body() body: any, @Req() req: any, @UploadedFile() file: Express.Multer.File) {
    return this.performance.createTemplate({
      ...body,
      name: body.name || file?.originalname || 'Performance Template',
      filePath: file ? `uploads/performance-templates/${file.filename}` : undefined,
      createdBy: req.user.name,
    });
  }

  @Post('feedback')
  @UseGuards(RolesGuard)
  @Roles('reporting_manager')
  @ApiOperation({ summary: 'Add feedback (Reporting Manager → visible to HR)' })
  addFeedback(@Body() body: any, @Req() req: any) {
    return this.performance.addFeedback({
      ...body,
      addedBy: req.user.name,
      addedByRole: req.user.role,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get performance goals' })
  findAll(@Req() req: any) {
    return this.performance.findForUser(req.user.employeeId, req.user.role);
  }

  @Get(':id/review/download')
  @ApiOperation({ summary: 'Download a performance review PDF' })
  downloadReview(@Param('id') id: string, @Res() res: Response) {
    return this.performance.downloadReview(id, res);
  }

  @Patch(':id/review')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr_manager', 'reporting_manager')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const dir = join(process.cwd(), 'uploads', 'performance-docs');
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}-${file.originalname}`);
      },
    }),
  }))
  @ApiOperation({ summary: 'Upload a completed performance review' })
  uploadReview(@Param('id') id: string, @Body() body: any, @UploadedFile() file: Express.Multer.File) {
    const path = file ? `uploads/performance-docs/${file.filename}` : undefined;
    return this.performance.update(id, {
      ...body,
      reviewPath: path,
      reviewFilePath: path,
    });
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr_manager', 'reporting_manager')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const dir = join(process.cwd(), 'uploads', 'performance-docs');
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}-${file.originalname}`);
      },
    }),
  }))
  @ApiOperation({ summary: 'Set performance goal' })
  create(@Body() body: any, @Req() req: any, @UploadedFile() file?: Express.Multer.File) {
    const path = file ? `uploads/performance-docs/${file.filename}` : undefined;
    return this.performance.create({
      ...body,
      reviewer: body.reviewer || req.user.name,
      reviewPath: path,
      reviewFilePath: path, // Added for frontend compatibility
    });
  }
}
