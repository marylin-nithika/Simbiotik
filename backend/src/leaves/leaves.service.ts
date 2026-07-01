import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Response } from 'express';
import { join, isAbsolute, basename } from 'path';
import * as fs from 'fs';
import { Leave } from './schemas/leave.schema';
import { mapDoc, mapDocs } from '../common/map-id';
import {
  APPROVAL_LABELS,
  buildApprovalsForRole,
  getActiveApprovalSteps,
  normalizeApprovals,
  roleToApprovalKey,
} from './leave-approvals';

@Injectable()
export class LeavesService {
  constructor(@InjectModel(Leave.name) private model: Model<Leave>) {}

  private assertCanApprove(approvals: unknown, key: string) {
    const a = normalizeApprovals(approvals);
    const active = getActiveApprovalSteps(approvals);
    const idx = active.indexOf(key as typeof active[number]);
    if (idx < 0) throw new BadRequestException('Invalid approver role');
    if (a[key as keyof typeof a] !== 'Pending') {
      throw new BadRequestException('This step is already completed');
    }
    for (let i = 0; i < idx; i++) {
      const prev = active[i];
      if (a[prev] !== 'Approved') {
        throw new BadRequestException(`${APPROVAL_LABELS[prev]} must approve before you can act`);
      }
    }
  }

  async findAll() {
    return mapDocs(await this.model.find().sort({ createdAt: -1 }).exec());
  }

  async create(data: any, files?: Express.Multer.File[], applicantRole?: string) {
    const numberOfDays = Number(data.numberOfDays);
    if (data.leaveType === 'sick' && numberOfDays > 2 && !files?.length) {
      throw new BadRequestException('Medical documents required for sick leave exceeding 2 days');
    }

    const role = applicantRole || data.applicantRole;
    const docs = files?.map((f) => `uploads/leave-documents/${f.filename}`) || [];
    if (!data.employeeId) {
      throw new BadRequestException('Employee ID is required');
    }

    const leave = await this.model.create({
      employeeId: data.employeeId,
      employeeName: data.employeeName,
      applicantEmail: data.applicantEmail?.toLowerCase?.() || data.applicantEmail,
      applicantRole: role,
      leaveType: data.leaveType,
      fromDate: data.fromDate,
      toDate: data.toDate,
      reason: data.reason,
      numberOfDays,
      status: 'Pending',
      approvals: buildApprovalsForRole(role),
      documents: docs,
      appliedOn: new Date().toISOString(),
    });
    return mapDoc(leave);
  }

  async updateStatus(id: string, status: string) {
    const leave = await this.model.findById(id);
    if (!leave) throw new NotFoundException('Leave not found');

    leave.status = status;
    if (status === 'Approved') {
      const approvals = normalizeApprovals(leave.approvals);
      getActiveApprovalSteps(approvals).forEach((key) => {
        approvals[key] = 'Approved';
      });
      leave.approvals = approvals;
      leave.markModified('approvals');
    }
    await leave.save();
    return mapDoc(leave);
  }

  async approveStep(id: string, role: string, decision: string) {
    const key = roleToApprovalKey(role);
    if (!key) throw new BadRequestException('Invalid approver role');

    const leave = await this.model.findById(id);
    if (!leave) throw new NotFoundException('Leave not found');
    if (leave.status === 'Deleted') {
      throw new BadRequestException('This leave request was deleted by the applicant');
    }

    this.assertCanApprove(leave.approvals, key);

    const approvals = { ...normalizeApprovals(leave.approvals), [key]: decision };
    const active = getActiveApprovalSteps(approvals);
    const allApproved = active.every((k) => approvals[k] === 'Approved');
    const anyRejected = active.some((k) => approvals[k] === 'Rejected');

    leave.approvals = approvals;
    leave.markModified('approvals');
    leave.status = anyRejected ? 'Rejected' : allApproved ? 'Approved' : 'Pending';
    await leave.save();
    return mapDoc(leave);
  }

  async remove(id: string) {
    const leave = await this.model.findById(id);
    if (!leave) throw new NotFoundException('Leave not found');
    if (leave.status === 'Deleted') return mapDoc(leave);

    const approvals = normalizeApprovals(leave.approvals);
    (Object.keys(approvals) as Array<keyof typeof approvals>).forEach((key) => {
      if (approvals[key] === 'Pending') approvals[key] = 'Cancelled';
    });

    leave.status = 'Deleted';
    leave.deletedAt = new Date().toISOString();
    leave.approvals = approvals;
    leave.markModified('approvals');
    await leave.save();
    return mapDoc(leave);
  }

  async downloadDocument(id: string, index: number, res: Response) {
    const leave: any = await this.model.findById(id).lean();
    if (!leave) throw new NotFoundException('Leave not found');

    const docs = leave.documents || [];
    const docPath = docs[index];
    if (!docPath) throw new NotFoundException('Document not found');

    const filePath = isAbsolute(docPath) ? docPath : join(process.cwd(), docPath);
    
    if (!fs.existsSync(filePath)) {
      console.error(`[LeavesService] File not found at: ${filePath} (Started from: ${process.cwd()})`);
      throw new NotFoundException('File not found on server');
    }

    return res.download(filePath, basename(docPath) || 'document.pdf');
  }
}
