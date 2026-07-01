import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'jobs' })
export class Job extends Document {
  @Prop({ required: true }) title: string;
  @Prop({ required: true }) department: string;
  @Prop({ default: '' }) description: string;
  @Prop({ default: '' }) requirements: string;
  @Prop({ default: 'Open' }) status: string;
  @Prop({ required: true }) postedOn: string;
  @Prop({ default: 0 }) applicants: number;
  @Prop() pdfPath: string;
  @Prop() pdfFileName: string;
}

export const JobSchema = SchemaFactory.createForClass(Job);
