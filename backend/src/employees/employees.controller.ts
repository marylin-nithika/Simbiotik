import {
  Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Res,
  UploadedFiles, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { EmployeesService } from './employees.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';

const pdfOnly = (_req: Express.Request, file: Express.Multer.File, cb: (e: Error | null, ok?: boolean) => void) => {
  const ext = extname(file.originalname).toLowerCase();
  if (ext !== '.pdf' && file.mimetype !== 'application/pdf') {
    return cb(new Error('Only PDF files are allowed'), false);
  }
  cb(null, true);
};

const employeeDocStorage = diskStorage({
  destination: (_req, file, cb) => {
    const subdir = file.fieldname === 'educationDocuments' ? 'education' : 'id';
    const dir = join(process.cwd(), 'uploads', 'employee-documents', subdir);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => cb(null, `doc-${Date.now()}-${Math.round(Math.random() * 1e4)}${extname(file.originalname)}`),
});

@ApiTags('Employees')
@ApiBearerAuth()
@Controller('employees')
@UseGuards(JwtAuthGuard)
export class EmployeesController {
  constructor(private employees: EmployeesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all employees' })
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr_manager', 'ca')
  findAll() {
    return this.employees.findAll();
  }

  @Get(':id/documents/:type/:index')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr_manager', 'ca')
  @ApiOperation({ summary: 'Download employee onboarding document (HR/Admin)' })
  downloadDocument(
    @Param('id') id: string,
    @Param('type') type: 'id' | 'education',
    @Param('index', ParseIntPipe) index: number,
    @Res() res: Response,
  ) {
    return this.employees.downloadDocument(id, type, index, res);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr_manager', 'ca')
  @ApiOperation({ summary: 'Get employee full details (HR/Admin)' })
  findOne(@Param('id') id: string) {
    return this.employees.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr_manager')
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'idDocuments', maxCount: 5 },
    { name: 'educationDocuments', maxCount: 10 },
  ], {
    storage: employeeDocStorage,
    fileFilter: pdfOnly,
  }))
  @ApiOperation({ summary: 'Onboard new employee with documents (HR only)' })
  create(
    @Body() body: Record<string, unknown>,
    @UploadedFiles() files?: { idDocuments?: Express.Multer.File[]; educationDocuments?: Express.Multer.File[] },
  ) {
    return this.employees.create(body, files?.idDocuments, files?.educationDocuments);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr_manager')
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'idDocuments', maxCount: 5 },
    { name: 'educationDocuments', maxCount: 10 },
  ], {
    storage: employeeDocStorage,
    fileFilter: pdfOnly,
  }))
  @ApiOperation({ summary: 'Update employee details and optionally upload new documents (HR/Admin)' })
  update(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @UploadedFiles() files?: { idDocuments?: Express.Multer.File[]; educationDocuments?: Express.Multer.File[] },
  ) {
    return this.employees.update(id, body, files?.idDocuments, files?.educationDocuments);
  }
}
