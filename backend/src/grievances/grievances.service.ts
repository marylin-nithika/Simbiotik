import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Grievance } from './schemas/grievance.schema';
import { Counter } from '../common/schemas/counter.schema';
import { CreateGrievanceDto } from './dto/create-grievance.dto';
import { UpdateGrievanceStatusDto } from './dto/update-grievance-status.dto';
import { UpdateGrievanceNotesDto } from './dto/update-grievance-notes.dto';

const COUNTER_KEY = 'grievance';

@Injectable()
export class GrievancesService implements OnModuleInit {
  private readonly log = new Logger(GrievancesService.name);

  constructor(
    @InjectModel(Grievance.name) private grievanceModel: Model<Grievance>,
    @InjectModel(Counter.name) private counterModel: Model<Counter>,
  ) {}

  async onModuleInit() {
    await this.migrateGrievanceNumbers();
  }

  /**
   * Atomically increments the grievance counter and returns the next
   * formatted grievance number (e.g. "GRV-0001").
   */
  private async generateGrievanceNumber(): Promise<string> {
    const counter = await this.counterModel.findByIdAndUpdate(
      COUNTER_KEY,
      { $inc: { seq: 1 } },
      { upsert: true, new: true },
    );
    return `GRV-${String(counter.seq).padStart(4, '0')}`;
  }

  /**
   * Backfills grievanceNumber for any existing grievance records that do not
   * have one yet. Processes records in chronological order (oldest first).
   * This method is idempotent — safe to call on every startup.
   */
  private async migrateGrievanceNumbers(): Promise<void> {
    const unNumbered = await this.grievanceModel
      .find({ grievanceNumber: { $exists: false } })
      .sort({ createdAt: 1 })
      .exec();

    if (unNumbered.length === 0) {
      this.log.log('Grievance number migration: all records already numbered.');
      return;
    }

    this.log.log(`Grievance number migration: backfilling ${unNumbered.length} record(s)...`);

    for (const grievance of unNumbered) {
      const grievanceNumber = await this.generateGrievanceNumber();
      await this.grievanceModel.updateOne(
        { _id: grievance._id },
        { $set: { grievanceNumber } },
      );
    }

    this.log.log(`Grievance number migration: complete. ${unNumbered.length} record(s) numbered.`);
  }

  async create(data: CreateGrievanceDto, employeeId: string, employeeName: string, attachment?: string) {
    const grievanceNumber = await this.generateGrievanceNumber();
    const grievance = await this.grievanceModel.create({
      ...data,
      employeeId,
      employeeName,
      attachment,
      status: 'Submitted',
      grievanceNumber,
    });
    return grievance;
  }

  async findAll() {
    return this.grievanceModel.find().sort({ createdAt: -1 }).exec();
  }

  async findForEmployee(employeeId: string) {
    return this.grievanceModel.find({ employeeId }).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string) {
    const grievance = await this.grievanceModel.findById(id).exec();
    if (!grievance) throw new NotFoundException('Grievance not found');
    return grievance;
  }

  async updateStatus(id: string, dto: UpdateGrievanceStatusDto) {
    const grievance = await this.grievanceModel.findByIdAndUpdate(id, { status: dto.status }, { new: true }).exec();
    if (!grievance) throw new NotFoundException('Grievance not found');
    return grievance;
  }

  async updateNotes(id: string, dto: UpdateGrievanceNotesDto) {
    const grievance = await this.grievanceModel.findByIdAndUpdate(id, { hrNotes: dto.hrNotes }, { new: true }).exec();
    if (!grievance) throw new NotFoundException('Grievance not found');
    return grievance;
  }
}

