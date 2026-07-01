import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'feedbacks' })
export class Feedback extends Document {
  @Prop({ required: true }) employeeId: string;
  @Prop({ required: true }) employeeName: string;
  @Prop({ required: true }) feedback: string;
  @Prop({ required: true }) addedBy: string;
  @Prop({ required: true }) addedByRole: string;
  @Prop({ default: true }) visibleToHr: boolean;
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);
