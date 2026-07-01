import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Response } from 'express';
import { join, isAbsolute } from 'path';
import * as fs from 'fs';
import { Employee } from './schemas/employee.schema';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { mapDoc, mapDocs } from '../common/map-id';

function parseEmployeeBody(body: Record<string, unknown>): CreateEmployeeDto {
  const parsed: Record<string, unknown> = { ...body };
  for (const field of ['address', 'education', 'experience', 'passport']) {
    const val = parsed[field];
    if (typeof val === 'string') {
      try { parsed[field] = JSON.parse(val); } catch { /* keep as-is */ }
    }
  }
  if (parsed.bgv !== undefined) {
    parsed.bgv = parsed.bgv === 'true' || parsed.bgv === true;
  }
  if (parsed.insurance !== undefined) {
    parsed.insurance = parsed.insurance === 'true' || parsed.insurance === true;
  }
  return parsed as unknown as CreateEmployeeDto;
}

@Injectable()
export class EmployeesService {
  constructor(@InjectModel(Employee.name) private model: Model<Employee>) {}

  async findAll() {
    return mapDocs(await this.model.find().sort({ createdAt: -1 }).exec());
  }

  async findOne(id: string) {
    const emp = await this.model.findById(id).exec();
    if (!emp) throw new NotFoundException('Employee not found');
    return mapDoc(emp);
  }

  async create(
    body: Record<string, unknown>,
    idFiles?: Express.Multer.File[],
    educationFiles?: Express.Multer.File[],
  ) {
    const dto = parseEmployeeBody(body);

    if (!idFiles?.length) {
      throw new BadRequestException('Aadhaar and PAN documents (PDF) are required');
    }
    if (!educationFiles?.length) {
      throw new BadRequestException('Education document(s) (PDF) are required');
    }

    const exists = await this.model.findOne({
      $or: [{ employeeId: dto.employeeId }, { email: dto.email }, { officeMail: dto.officeMail }],
    });
    if (exists) throw new ConflictException('Employee ID or email already exists');

    const idDocuments = idFiles.map((f) => ({
      path: `uploads/employee-documents/id/${f.filename}`,
      name: f.originalname,
    }));
    const educationDocuments = educationFiles.map((f) => ({
      path: `uploads/employee-documents/education/${f.filename}`,
      name: f.originalname,
    }));

    const emp = await this.model.create({
      ...dto,
      employeeId: dto.employeeId.toUpperCase(),
      pan: dto.pan?.toUpperCase(),
      idDocuments,
      educationDocuments,
      status: 'Active',
    });
    return mapDoc(emp);
  }

  async update(
    id: string,
    body: Record<string, unknown>,
    idFiles?: Express.Multer.File[],
    educationFiles?: Express.Multer.File[],
  ) {
    const emp = await this.model.findById(id).exec();
    if (!emp) throw new NotFoundException('Employee not found');

    const dto = parseEmployeeBody(body);
    delete (dto as unknown as Record<string, unknown>).employeeId;

    const orConditions: Record<string, string>[] = [];
    if (dto.email) orConditions.push({ email: dto.email });
    if (dto.officeMail) orConditions.push({ officeMail: dto.officeMail });
    if (orConditions.length) {
      const conflict = await this.model.findOne({ _id: { $ne: id }, $or: orConditions }).exec();
      if (conflict) throw new ConflictException('Email already in use by another employee');
    }

    const update: Record<string, unknown> = { ...dto };
    if (dto.pan) update.pan = dto.pan.toUpperCase();

    if (idFiles?.length) {
      const newDocs = idFiles.map((f) => ({
        path: `uploads/employee-documents/id/${f.filename}`,
        name: f.originalname,
      }));
      update.idDocuments = [...(emp.idDocuments || []), ...newDocs];
    }
    if (educationFiles?.length) {
      const newDocs = educationFiles.map((f) => ({
        path: `uploads/employee-documents/education/${f.filename}`,
        name: f.originalname,
      }));
      update.educationDocuments = [...(emp.educationDocuments || []), ...newDocs];
    }

    const updated = await this.model.findByIdAndUpdate(id, update, { new: true }).exec();
    return mapDoc(updated!);
  }

  async downloadDocument(id: string, type: 'id' | 'education', index: number, res: Response) {
    const emp: any = await this.model.findById(id).lean();
    if (!emp) throw new NotFoundException('Employee not found');

    const docs = type === 'id' ? emp.idDocuments : emp.educationDocuments;
    const doc = docs?.[index];
    if (!doc?.path) throw new NotFoundException('Document not found');

    const filePath = isAbsolute(doc.path) ? doc.path : join(process.cwd(), doc.path);
    if (!fs.existsSync(filePath)) {
      console.error(`[EmployeesService] File not found at: ${filePath} (Started from: ${process.cwd()})`);
      throw new NotFoundException('File not found on server');
    }

    return res.download(filePath, doc.name || 'document.pdf');
  }
}
