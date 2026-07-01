import { Body, Controller, Get, Param, Post, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { Response } from 'express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CandidatesService } from './candidates.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';

const candidateResumeStorage = diskStorage({
  destination: (_req, _file, cb) => {
    const dir = join(process.cwd(), 'uploads', 'resumes');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `resume-${uniqueSuffix}${extname(file.originalname)}`);
  },
});

@ApiTags('Candidates')
@ApiBearerAuth()
@Controller('candidates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CandidatesController {
  constructor(private candidates: CandidatesService) {}

  @Get()
  @Roles('admin', 'hr_manager', 'employee', 'project_manager', 'reporting_manager')
  @ApiOperation({ summary: 'Get recruitment pipeline (filtered by role)' })
  findAll(@Req() req: any) {
    return this.candidates.findAll(req.user.employeeId, req.user.role);
  }

  @Post()
  @Roles('admin', 'hr_manager', 'employee', 'project_manager', 'reporting_manager')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: candidateResumeStorage }))
  @ApiOperation({ summary: 'Add candidate to pipeline / Submit Referral' })
  create(@Body() body: any, @UploadedFile() file: Express.Multer.File) {
    return this.candidates.create(body, file);
  }

  @Get(':id/resume')
  @Roles('admin', 'hr_manager', 'employee', 'project_manager', 'reporting_manager')
  @ApiOperation({ summary: 'Download candidate resume' })
  downloadResume(@Param('id') id: string, @Res() res: Response) {
    return this.candidates.downloadResume(id, res);
  }
}
