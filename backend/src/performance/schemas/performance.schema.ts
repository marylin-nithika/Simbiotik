import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'performance' })
export class Performance extends Document {
  @Prop({ required: true }) employeeId: string;
  @Prop({ required: true }) employeeName: string;
  @Prop({ required: true }) goal: string;
  @Prop({ default: 0 }) progress: number;
  @Prop({ default: 'In Progress' }) reviewStatus: string;
  @Prop({ required: true }) reviewer: string;

  @Prop() probationPeriod: string;
  
  @Prop() reviewPath: string;
  
  @Prop() reviewFilePath: string;
}

export const PerformanceSchema = SchemaFactory.createForClass(Performance);
