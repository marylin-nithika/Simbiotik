import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GrievanceDocument = Grievance & Document;

@Schema({ timestamps: true })
export class Grievance {
  @Prop({ unique: true, sparse: true })
  grievanceNumber?: string;

  @Prop({ required: true })
  employeeId: string;

  @Prop()
  employeeName?: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true })
  priority: string;

  @Prop({ required: true })
  description: string;

  @Prop()
  attachment?: string;

  @Prop({ default: 'Submitted' })
  status: string;

  @Prop()
  hrNotes?: string;
}

export const GrievanceSchema = SchemaFactory.createForClass(Grievance);
