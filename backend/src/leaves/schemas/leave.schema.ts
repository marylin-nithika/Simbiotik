import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'leaves' })
export class Leave extends Document {
  @Prop({ required: true }) employeeId: string;
  @Prop({ required: true }) employeeName: string;
  @Prop({ required: false }) applicantEmail?: string;
  @Prop({ required: true, enum: ['sick', 'annual'] }) leaveType: string;
  @Prop({ required: true }) fromDate: string;
  @Prop({ required: true }) toDate: string;
  @Prop({ required: true }) reason: string;
  @Prop({ required: true }) numberOfDays: number;
  @Prop({ default: 'Pending', enum: ['Pending', 'Approved', 'Rejected', 'Deleted'] }) status: string;
  @Prop({ required: false }) deletedAt?: string;
  @Prop({ required: false }) applicantRole?: string;
  @Prop({
    type: { reporting_manager: String, project_manager: String, hr: String, admin: String },
    default: { reporting_manager: 'Pending', project_manager: 'Pending', hr: 'Pending', admin: 'N/A' },
  })
  approvals: { reporting_manager: string; project_manager: string; hr: string; admin: string };
  @Prop({ type: [String], default: [] }) documents: string[];
  @Prop() appliedOn: string;
}

export const LeaveSchema = SchemaFactory.createForClass(Leave);
