import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'candidates' })
export class Candidate extends Document {
  @Prop({ required: true }) name: string;
  @Prop({ required: true }) job: string;
  @Prop({ default: 'Screening' }) stage: string;
  @Prop({ required: true }) appliedOn: string;
  @Prop() referredBy?: string;
  @Prop() resumePath?: string;
  @Prop() resumeFileName?: string;
}

export const CandidateSchema = SchemaFactory.createForClass(Candidate);
