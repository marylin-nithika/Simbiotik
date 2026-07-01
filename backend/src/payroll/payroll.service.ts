import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Response } from 'express';
import { join, isAbsolute } from 'path';
import * as fs from 'fs';
import { Payroll } from './schemas/payroll.schema';
import { mapDoc, mapDocs } from '../common/map-id';

@Injectable()
export class PayrollService {
  constructor(@InjectModel(Payroll.name) private model: Model<Payroll>) {}

  async findAll() {
    return mapDocs(await this.model.find({ 
      type: 'payslip'
    }).sort({ createdAt: -1 }).exec());
  }

  private parseMonth(monthStr: string): Date {
    const [m, y] = monthStr.split(' ');
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthIdx = months.indexOf(m);
    return new Date(parseInt(y), monthIdx, 1);
  }

  async findForUser(employeeId: string, role: string) {
    const all = await this.model.find({ 
      type: 'payslip'
    }).sort({ createdAt: -1 }).exec();
    
    const allMapped = mapDocs(all);
    if (['admin', 'hr_manager', 'ca'].includes(role)) return allMapped;

    // Employee specific logic: filter by ID, sort by payroll date, and limit to 6
    const own = allMapped.filter((p) => p.employeeId.toUpperCase() === employeeId.toUpperCase());
    
    return own
      .sort((a, b) => this.parseMonth(b.month).getTime() - this.parseMonth(a.month).getTime())
      .slice(0, 6);
  }

  async create(data: any, file?: Express.Multer.File) {
    const p = await this.model.create({
      employeeId: data.employeeId,
      employeeName: data.employeeName,
      month: data.month,
      gross: Number(data.gross),
      net: Number(data.net),
      status: data.status || 'Processing',
      type: 'payslip',
      // Note: We leave financialYear and documentType undefined here so the filters pick this up as a payslip
      pdfPath: file ? file.path : undefined,
      pdfFileName: file ? file.originalname : undefined,
    });
    return mapDoc(p);
  }

  async downloadPayslip(id: string, res: Response) {
    const p: any = await this.model.findById(id).lean();
    if (!p) throw new NotFoundException('Payroll record not found');

    if (p.pdfPath) {
      // Ensure we resolve the path relative to the root if not absolute
      const filePath = isAbsolute(p.pdfPath) ? p.pdfPath : join(process.cwd(), p.pdfPath.replace(/\\/g, '/'));
      if (fs.existsSync(filePath)) {
        res.setHeader('Content-Type', 'application/pdf');
        return res.download(filePath, p.pdfFileName || `payslip-${p.month}.pdf`);
      }
    }

    // Fallback if no file exists (existing text-based logic)
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="payslip-${p.month.replace(/\s+/g, '-')}.txt"`);
    return res.send(`PAYSLIP\nEmployee: ${p.employeeName}\nMonth: ${p.month}\nGross: ${p.gross}\nNet: ${p.net}`);
  }

  async findTaxForms(employeeId: string, role: string) {
    const all = await this.model.find({ 
      type: 'tax_form'
    }).sort({ _id: -1 }).exec();
    
    const docs = mapDocs(all);
    if (['admin', 'ca'].includes(role)) return docs;
    return docs.filter(f => f.employeeId.toUpperCase() === employeeId.toUpperCase());
  }

  async createTaxForm(data: any, file?: Express.Multer.File) {
    const f = await this.model.create({
      employeeId: data.employeeId,
      employeeName: data.employeeName,
      financialYear: data.financialYear,
      documentType: data.documentType || 'Form 16',
      status: 'Available',
      type: 'tax_form',
      pdfPath: file ? file.path : undefined,
      pdfFileName: file ? file.originalname : undefined,
      // Populate payroll fields with FY as placeholder if required by schema
      month: data.financialYear,
      gross: 0,
      net: 0,
    });
    return mapDoc(f);
  }

  async downloadTaxForm(id: string, res: Response) {
    const f: any = await this.model.findById(id).lean();
    if (!f || !f.pdfPath) throw new NotFoundException('Tax document not found');

    const filePath = isAbsolute(f.pdfPath) ? f.pdfPath : join(process.cwd(), f.pdfPath.replace(/\\/g, '/'));
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found on server');
    }

    return res.download(filePath, f.pdfFileName || `${f.documentType}-${f.financialYear}.pdf`);
  }
}
