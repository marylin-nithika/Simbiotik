import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'payrolls' })
export class Payroll extends Document {
  @Prop({ required: true }) employeeId: string;
  @Prop({ required: true }) employeeName: string;
  @Prop({ required: true }) month: string;
  @Prop({ required: true }) gross: number;
  @Prop({ required: true }) net: number;
  @Prop({ default: 'Processing' }) status: string;
  @Prop({ required: true, enum: ['payslip', 'tax_form'], default: 'payslip' }) type: string;

  @Prop() pdfPath?: string;
  @Prop() pdfFileName?: string;
  @Prop() financialYear?: string;
  @Prop() documentType?: string;
}

export const PayrollSchema = SchemaFactory.createForClass(Payroll);
