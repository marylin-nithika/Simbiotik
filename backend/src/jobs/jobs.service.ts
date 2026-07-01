import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Response } from 'express';
import { join, isAbsolute } from 'path';
import * as fs from 'fs';
import { Job } from './schemas/job.schema';
import { mapDoc, mapDocs } from '../common/map-id';

@Injectable()
export class JobsService {
  constructor(@InjectModel(Job.name) private model: Model<Job>) {}

  async findAll() {
    return mapDocs(await this.model.find().sort({ postedOn: -1 }).exec());
  }

  async create(data: any, file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Job posting PDF is required');
    const job = await this.model.create({
      title: data.title,
      department: data.department,
      description: data.description || '',
      requirements: data.requirements || '',
      status: data.status || 'Open',
      postedOn: data.postedOn || new Date().toISOString().split('T')[0],
      applicants: Number(data.applicants) || 0,
      pdfPath: file ? `uploads/job-pdfs/${file.filename}` : undefined,
      pdfFileName: file?.originalname,
    });
    return mapDoc(job);
  }

  async downloadPdf(id: string, res: Response) {
    const job: any = await this.model.findById(id).lean();
    if (!job) throw new NotFoundException('Job not found');

    if (!job.pdfPath) throw new NotFoundException('No PDF attached to this job posting');

    const filePath = isAbsolute(job.pdfPath) ? job.pdfPath : join(process.cwd(), job.pdfPath);
    
    if (!fs.existsSync(filePath)) {
      console.error(`[JobsService] File not found at: ${filePath} (Started from: ${process.cwd()})`);
      throw new NotFoundException('PDF file not found on server');
    }

    return res.download(filePath, job.pdfFileName || 'job-details.pdf');
  }

  async update(id: string, data: any, file?: Express.Multer.File) {
    const updates: any = { ...data };
    
    // Convert applicants to number if it exists in the payload
    if (updates.applicants) {
      updates.applicants = Number(updates.applicants);
    }

    if (file) {
      updates.pdfPath = `uploads/job-pdfs/${file.filename}`;
      updates.pdfFileName = file.originalname;
    }

    const updated = await this.model.findByIdAndUpdate(id, updates, { new: true }).exec();
    return updated ? mapDoc(updated) : null;
  }

  async remove(id: string) {
    const result = await this.model.findByIdAndDelete(id).exec();
    return result ? mapDoc(result) : null;
  }
}
