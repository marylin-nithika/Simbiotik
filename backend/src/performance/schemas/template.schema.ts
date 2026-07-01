import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class PerformanceTemplate extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ type: [Object], default: [] })
  goals: any[];

  @Prop()
  description: string;

  @Prop()
  filePath: string;

  @Prop()
  createdBy: string;
}

export const PerformanceTemplateSchema = SchemaFactory.createForClass(PerformanceTemplate);