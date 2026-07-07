import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Response } from 'express';
import { join, isAbsolute } from 'path';
import * as fs from 'fs';
import { Employee } from './schemas/employee.schema';
import { User } from '../auth/schemas/user.schema';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { mapDoc, mapDocs } from '../common/map-id';

function parseEmployeeBody(body: Record<string, unknown> | CreateEmployeeDto): CreateEmployeeDto {
  const parsed: Record<string, unknown> = { ...body };
  for (const field of ['address', 'education', 'experience', 'passport', 'bankDetails']) {
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

function validateDobIsAdult(dob?: unknown) {
  if (!dob || typeof dob !== 'string') return;
  const date = new Date(dob);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException('Date of Birth must be a valid date');
  }
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }
  if (age < 18) {
    throw new BadRequestException('Employee must be at least 18 years old to be onboarded.');
  }
}

@Injectable()
export class EmployeesService {
  constructor(
    @InjectModel(Employee.name) private model: Model<Employee>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async findAll() {
    return mapDocs(await this.model.find().sort({ createdAt: -1 }).exec());
  }

  async findOne(id: string) {
    const emp = await this.model.findById(id).exec();
    if (!emp) throw new NotFoundException('Employee not found');
    return mapDoc(emp);
  }

  private async assertUniqueEmployeeFields(dto: CreateEmployeeDto, excludeId?: string) {
    const employeeId = dto.employeeId?.trim().toUpperCase?.();
    const email = dto.email?.toLowerCase?.()?.trim();
    const officeMail = dto.officeMail?.toLowerCase?.()?.trim();
    const mobile = dto.mobile?.trim();
    const aadhaar = dto.aadhaar?.trim();
    const pan = dto.pan?.trim().toUpperCase?.();
    const passportNumber = dto.passport?.number?.trim();
    const bankAccount = dto.bankDetails?.accountNumber?.trim();

    if (officeMail) {
      const officeConflict = await this.model.findOne({
        officeMail,
        status: { $ne: 'Inactive' },
        ...(excludeId ? { _id: { $ne: excludeId } } : {}),
      }).lean().exec();
      if (officeConflict) {
        throw new ConflictException('Office mail already exists');
      }
    }

    const orConditions: Record<string, unknown>[] = [];
    if (employeeId) orConditions.push({ employeeId });
    if (email) orConditions.push({ email });
    if (mobile) orConditions.push({ mobile });
    if (aadhaar) orConditions.push({ aadhaar });
    if (pan) orConditions.push({ pan });
    if (passportNumber) orConditions.push({ 'passport.number': passportNumber });
    if (bankAccount) orConditions.push({ 'bankDetails.accountNumber': bankAccount });

    if (!orConditions.length) return;

    const query: Record<string, unknown> = { $or: orConditions };
    if (excludeId) query._id = { $ne: excludeId };

    const existing = await this.model.findOne(query).lean().exec();
    if (!existing) return;

    if (employeeId && existing.employeeId?.toUpperCase?.().trim() === employeeId) {
      throw new ConflictException('Employee ID already exists');
    }
    if (email && existing.email?.toLowerCase?.()?.trim() === email) {
      throw new ConflictException('Email address already exists');
    }
    if (mobile && existing.mobile === mobile) {
      throw new ConflictException('Contact number already exists');
    }
    if (aadhaar && existing.aadhaar === aadhaar) {
      throw new ConflictException('Aadhaar number already exists');
    }
    if (pan && existing.pan === pan) {
      throw new ConflictException('PAN number already exists');
    }
    if (passportNumber && existing.passport?.number === passportNumber) {
      throw new ConflictException('Passport number already exists');
    }
    if (bankAccount && existing.bankDetails?.accountNumber === bankAccount) {
      throw new ConflictException('Bank account number is already assigned to another employee.');
    }
  }

  async create(
    body: CreateEmployeeDto | Record<string, unknown>,
    idFiles?: Express.Multer.File[],
    educationFiles?: Express.Multer.File[],
  ) {
    const dto = parseEmployeeBody(body);
    validateDobIsAdult(dto.dob);
    await this.assertUniqueEmployeeFields(dto);

    if (!idFiles?.length) {
      throw new BadRequestException('Aadhaar and PAN documents (PDF) are required');
    }
    if (!educationFiles?.length) {
      throw new BadRequestException('Education document(s) (PDF) are required');
    }

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
    validateDobIsAdult(dto.dob);
    delete (dto as unknown as Record<string, unknown>).employeeId;

    const previousStatus = emp.status;
    const newStatus = dto.status || previousStatus;

    if (dto.bankDetails === undefined ||
      (dto.bankDetails &&
        !dto.bankDetails.bankName?.trim() &&
        !dto.bankDetails.accountNumber?.trim() &&
        !dto.bankDetails.ifscCode?.trim())) {
      dto.bankDetails = emp.bankDetails;
    }

    await this.assertUniqueEmployeeFields(dto, id);

    const update: Record<string, unknown> = { ...dto };
    if (dto.pan) update.pan = dto.pan.toUpperCase();
    if (dto.bankDetails === undefined && emp.bankDetails !== undefined) {
      update.bankDetails = emp.bankDetails;
    }

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

    if (previousStatus === 'Active' && newStatus === 'Inactive') {
      await this.userModel.updateOne(
        { employeeId: emp.employeeId, isActive: true },
        { $set: { isActive: false } },
      ).exec();
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
