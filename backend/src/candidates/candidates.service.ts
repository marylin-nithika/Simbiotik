import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Response } from 'express';
import { join, isAbsolute } from 'path';
import * as fs from 'fs';
import { Candidate } from './schemas/candidate.schema';
import { mapDoc, mapDocs } from '../common/map-id';

@Injectable()
export class CandidatesService {
  constructor(@InjectModel(Candidate.name) private model: Model<Candidate>) {}

  async findAll(employeeId?: string, role?: string) {
    const all = await this.model.find().sort({ appliedOn: -1 }).exec();
    const mapped = mapDocs(all);
    
    if (!role || ['admin', 'hr_manager'].includes(role)) {
      return mapped;
    }

    // For employees/managers, only return candidates they referred
    return mapped.filter(c => 
      c.referredBy && c.referredBy.toUpperCase().includes(`(${employeeId?.toUpperCase()})`)
    );
  }

  async create(data: any, file?: Express.Multer.File) {
    const c = await this.model.create({
      name: data.name,
      job: data.job,
      stage: data.stage || 'Screening',
      appliedOn: data.appliedOn || new Date().toISOString().split('T')[0],
      referredBy: data.referredBy,  
      resumePath: file ? file.path : undefined,  
      resumeFileName: file ? file.originalname : undefined,  
    });
    return mapDoc(c);
  }

  async downloadResume(id: string, res: Response) {
    const c: any = await this.model.findById(id).lean();
    if (!c) throw new NotFoundException('Candidate not found');
    if (!c.resumePath) throw new NotFoundException('No resume found for this candidate');

    // Resolve path relative to root if not absolute, handling potential Windows backslashes
    const filePath = isAbsolute(c.resumePath) ? c.resumePath : join(process.cwd(), c.resumePath.replace(/\\/g, '/'));
    
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Resume file not found on server');
    }

    return res.download(filePath, c.resumeFileName || 'resume.pdf');
  }
}
