import { Body, Controller, Delete, Get, Param, Patch, Post, Res, UploadedFile, UseGuards, UseInterceptors, NotFoundException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { JobsService } from './jobs.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';

const pdfOnly = (_req: Express.Request, file: Express.Multer.File, cb: (e: Error | null, ok?: boolean) => void) => {
  const ext = extname(file.originalname).toLowerCase();
  if (ext !== '.pdf' && !file.mimetype.includes('pdf')) {
    return cb(new Error('Only PDF files are allowed'), false);
  }
  cb(null, true);
};

@ApiTags('Jobs')
// @ApiBearerAuth() // Removed from class level, added to specific authenticated routes
@Controller('jobs')
export class JobsController {
  constructor(private jobs: JobsService) {}

  @Get()
  @UseGuards(JwtAuthGuard) // Apply JwtAuthGuard specifically to this route
  @ApiBearerAuth() // Document that this route requires a bearer token
  @ApiOperation({ summary: 'List all job postings' })
  findAll() {
    return this.jobs.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'hr_manager', 'project_manager')
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FileInterceptor('pdf', {
    storage: diskStorage({
      destination: (_req, _file, cb) => {
        const dir = join(process.cwd(), 'uploads', 'job-pdfs');
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: (_req, file, cb) => cb(null, `job-${Date.now()}${extname(file.originalname)}`),
    }),
    fileFilter: pdfOnly,
  }))
  @ApiBearerAuth() // Document that this route requires a bearer token
  @ApiOperation({ summary: 'Post a new job with PDF document' })
  create(@Body() body: any, @UploadedFile() file?: Express.Multer.File) {
    return this.jobs.create(body, file);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Download job details PDF' })
  // No @UseGuards here, making this endpoint publicly accessible
  pdf(@Param('id') id: string, @Res() res: Response) {
    return this.jobs.downloadPdf(id, res);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'hr_manager')
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FileInterceptor('pdf', {
    storage: diskStorage({
      destination: (_req, _file, cb) => {
        const dir = join(process.cwd(), 'uploads', 'job-pdfs');
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: (_req, file, cb) => cb(null, `job-${Date.now()}${extname(file.originalname)}`),
    }),
    fileFilter: pdfOnly,
  }))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a job posting' })
  async update(@Param('id') id: string, @Body() body: any, @UploadedFile() file?: Express.Multer.File) {
    console.log(`[JobsController] PATCH request for ID: ${id}`);
    const result = await this.jobs.update(id, body, file);
    if (!result) throw new NotFoundException('Job posting not found');
    return result;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'hr_manager')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a job posting' })
  async remove(@Param('id') id: string) {
    console.log(`[JobsController] DELETE request for ID: ${id}`);
    const result = await this.jobs.remove(id);
    if (!result) throw new NotFoundException('Job posting not found');
    return result;
  }
}
