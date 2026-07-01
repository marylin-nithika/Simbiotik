import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Response } from 'express';
import { join, isAbsolute } from 'path';
import * as fs from 'fs';
import { Performance } from './schemas/performance.schema';
import { Feedback } from './schemas/feedback.schema';
import { PerformanceTemplate } from './schemas/template.schema';
import { mapDoc, mapDocs } from '../common/map-id';

@Injectable()
export class PerformanceService {
  constructor(
    @InjectModel(Performance.name) private perfModel: Model<Performance>,
    @InjectModel(Feedback.name) private feedbackModel: Model<Feedback>,
    @InjectModel(PerformanceTemplate.name) private templateModel: Model<PerformanceTemplate>,
  ) {}

  async findAll() {
    return mapDocs(await this.perfModel.find().sort({ createdAt: -1 }).exec());
  }

  async findForUser(employeeId: string, role: string) {
    const all = await this.findAll();
    if (['admin', 'hr_manager', 'reporting_manager', 'manager'].includes(role)) return all;
    return all.filter((p) => p.employeeId === employeeId);
  }

  async create(data: any) {
    const p = await this.perfModel.create(data);
    return mapDoc(p);
  }

  async update(id: string, data: any) {
    const updated = await this.perfModel.findByIdAndUpdate(id, data, { new: true }).exec();
    return updated ? mapDoc(updated) : null;
  }

  async getFeedbacks(role: string, employeeId: string) {
    const all = mapDocs(await this.feedbackModel.find().sort({ createdAt: -1 }).exec());
    if (['admin', 'hr_manager'].includes(role)) return all;
    if (role === 'reporting_manager' || role === 'manager') {
      return all.filter((f) => f.addedByRole === 'reporting_manager' || f.addedByRole === 'manager');
    }
    return all.filter((f) => f.employeeId === employeeId);
  }

  async addFeedback(data: any) {
    const f = await this.feedbackModel.create({ ...data, visibleToHr: true });
    return mapDoc(f);
  }

  async getTemplates() {
    return mapDocs(await this.templateModel.find().sort({ name: 1 }).exec());
  }

  async createTemplate(data: any) {
    const t = await this.templateModel.create(data);
    return mapDoc(t);
  }

  async downloadTemplate(id: string, res: Response) {
    const template = await this.templateModel.findById(id).exec();
    if (!template || !template.filePath) throw new NotFoundException('Template file not found');

    const filePath = isAbsolute(template.filePath) 
      ? template.filePath 
      : join(process.cwd(), template.filePath);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found on server');
    }

    return res.download(filePath, `${template.name}.pdf`);
  }

  async downloadReview(id: string, res: Response) {
    const perf = await this.perfModel.findById(id).exec() as any;
    const reviewPath = perf?.reviewPath || perf?.reviewFilePath;
    if (!perf || !reviewPath) throw new NotFoundException('Review file not found');

    const filePath = isAbsolute(reviewPath) 
      ? reviewPath 
      : join(process.cwd(), reviewPath);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found on server');
    }

    return res.download(filePath, `review-${perf?.employeeName || 'record'}.pdf`);
  }
}
