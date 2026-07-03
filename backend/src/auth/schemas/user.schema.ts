import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'users' })
export class User extends Document {
  @Prop({
    required: true,
    lowercase: true,
    trim: true,
    index: { unique: true, partialFilterExpression: { isActive: true } },
  })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: ['admin', 'hr_manager', 'employee', 'manager', 'project_manager', 'reporting_manager','ca'] })
  role: string;

  @Prop({ required: true })
  employeeId: string;

  @Prop({ required: true, default: true })
  isActive: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
