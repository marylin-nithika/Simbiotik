import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { CreateGrievanceDto } from './dto/create-grievance.dto';
import { UpdateGrievanceNotesDto } from './dto/update-grievance-notes.dto';
import { UpdateGrievanceStatusDto } from './dto/update-grievance-status.dto';
import { GrievancesService } from './grievances.service';

@ApiTags('Grievances')
@ApiBearerAuth()
@Controller('grievances')
@UseGuards(JwtAuthGuard)
export class GrievancesController {
  constructor(private grievances: GrievancesService) {}

  @Post()
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FileInterceptor('attachment', {
    storage: diskStorage({
      destination: (_req, _file, cb) => {
        const dir = join(process.cwd(), 'uploads', 'grievance-attachments');
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: (_req, file, cb) => cb(null, `grievance-${Date.now()}${extname(file.originalname)}`),
    }),
  }))
  @ApiOperation({ summary: 'Create grievance for the logged-in employee' })
  create(@Body() dto: CreateGrievanceDto, @Req() req: any, @UploadedFile() file?: Express.Multer.File) {
    const attachmentPath = file ? `/uploads/grievance-attachments/${file.filename}` : undefined;
    return this.grievances.create(dto, req.user?.employeeId, req.user?.name, attachmentPath);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('hr_manager', 'admin', 'hr')
  @ApiOperation({ summary: 'Get all grievances for HR/Admin' })
  findAll() {
    return this.grievances.findAll();
  }

  @Get('mine')
  @ApiOperation({ summary: 'Get grievances for the logged-in employee' })
  findForEmployee(@Req() req: any) {
    return this.grievances.findForEmployee(req.user?.employeeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get grievance by id' })
  findOne(@Param('id') id: string) {
    return this.grievances.findOne(id);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('hr_manager', 'admin', 'hr')
  @ApiOperation({ summary: 'Update grievance status by HR' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateGrievanceStatusDto) {
    return this.grievances.updateStatus(id, dto);
  }

  @Patch(':id/notes')
  @UseGuards(RolesGuard)
  @Roles('hr_manager', 'admin', 'hr')
  @ApiOperation({ summary: 'Update HR notes for grievance' })
  updateNotes(@Param('id') id: string, @Body() dto: UpdateGrievanceNotesDto) {
    return this.grievances.updateNotes(id, dto);
  }
}
