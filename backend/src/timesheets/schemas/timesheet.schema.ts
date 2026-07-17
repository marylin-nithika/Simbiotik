import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
export class TimesheetActivity {
  @Prop({ required: true })
  activity: string;

  @Prop({ required: true, type: Number })
  duration: number;
}

export const TimesheetActivitySchema = SchemaFactory.createForClass(TimesheetActivity);

@Schema({ timestamps: true, collection: 'timesheets' })
export class Timesheet extends Document {
  @Prop({ required: true, index: true })
  employeeId: string;

  @Prop({ required: true })
  employeeName: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true, index: true })
  date: string;

  // Employee.supervisor stores the reporting manager's employeeId, not an
  // Employee document ObjectId. Keep this field aligned with that relationship.
  @Prop()
  reportingManagerId?: string;

  @Prop({ type: Date })
  punchInTime?: Date;

  @Prop({ type: Date })
  punchOutTime?: Date;

  @Prop({ default: 'System', enum: ['System', 'Manual'] })
  punchOutSource: string;

  @Prop({ default: 'Not Punched In', enum: ['Not Punched In', 'Working', 'Punch Out Missing', 'Punched Out', 'Submitted'] })
  status: string;

  @Prop({ type: [TimesheetActivitySchema], default: [] })
  activities: TimesheetActivity[];

  @Prop({ default: false })
  submitted: boolean;

  @Prop({ type: Date })
  submittedAt?: Date;

  @Prop({ timestamps: true })
  createdAt?: Date;

  @Prop({ timestamps: true })
  updatedAt?: Date;
}

export const TimesheetSchema = SchemaFactory.createForClass(Timesheet);

// Compound index for unique timesheet per user per date
TimesheetSchema.index({ employeeId: 1, date: 1 }, { unique: true });
