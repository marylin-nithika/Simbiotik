import { Body, Controller, Get, Param, Post, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { PayrollService } from './payroll.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';

const payrollStorage = diskStorage({
  destination: (_req, _file, cb) => {
    const dir = join(process.cwd(), 'uploads', 'payrolls');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `payslip-${uniqueSuffix}${extname(file.originalname)}`);
  },
});

@ApiTags('Payroll')
@ApiBearerAuth()
@Controller('payroll')
@UseGuards(JwtAuthGuard)
export class PayrollController {
  constructor(private payroll: PayrollService) {}

  @Get()
  @ApiOperation({ summary: 'Get payrolls (filtered by role)' })
  findAll(@Req() req: any) {
    return this.payroll.findForUser(req.user.employeeId, req.user.role);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr_manager', 'ca')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: payrollStorage }))
  @ApiOperation({ summary: 'Process payroll (HR/Admin)' })
  create(@Body() body: any, @UploadedFile() file: Express.Multer.File) {
    return this.payroll.create(body, file);
  }

  @Get(':id/payslip')
  @ApiOperation({ summary: 'Download payslip' })
  payslip(@Param('id') id: string, @Res() res: Response) {
    return this.payroll.downloadPayslip(id, res);
  }

  @Get('tax-forms')
  @ApiOperation({ summary: 'Get tax documents' })
  findTaxForms(@Req() req: any) {
    return this.payroll.findTaxForms(req.user.employeeId, req.user.role);
  }

  @Post('tax-forms')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr_manager', 'ca')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: payrollStorage }))
  uploadTaxForm(@Body() body: any, @UploadedFile() file: Express.Multer.File) {
    return this.payroll.createTaxForm(body, file);
  }

  @Get('tax-forms/:id/download')
  downloadTaxForm(@Param('id') id: string, @Res() res: Response) {
    return this.payroll.downloadTaxForm(id, res);
  }
}
