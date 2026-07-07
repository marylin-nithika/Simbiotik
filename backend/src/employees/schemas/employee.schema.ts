import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'employees', strict: false })
export class Employee extends Document {
  @Prop({ unique: true, sparse: true }) employeeId: string;
  @Prop({ required: true }) name: string;
  @Prop({ required: true }) email: string;
  @Prop() officeMail: string;
  @Prop({ required: true }) department: string;
  @Prop() designation: string;
  @Prop({ 
    default: 'employee', 
    enum: ['admin', 'hr_manager', 'employee', 'manager', 'project_manager', 'reporting_manager', 'ca'] 
  }) 
  role: string;
  @Prop() employeeType: string;
  @Prop() workingLocation: string;
  @Prop() mobile: string;
  @Prop() emergencyMobile: string;
  @Prop() aadhaar: string;
  @Prop() pan: string;
  @Prop() pfNo: string;
  @Prop() uan: string;
  @Prop() dob: string;
  @Prop() joinDate: string;
  @Prop() username: string;
  @Prop() supervisor: string;
  @Prop() projectName: string;
  @Prop({ type: Object }) address: Record<string, string>;
  @Prop({ type: Array }) education: Record<string, string>[];
  @Prop({ type: Array }) experience: Record<string, string>[];
  @Prop({ type: Object }) passport: Record<string, string>;
  @Prop() asset: string;
  @Prop({ type: Object }) bankDetails: { bankName?: string; accountNumber?: string; ifscCode?: string };
  @Prop({ type: [{ path: String, name: String }], default: [] }) idDocuments: { path: string; name: string }[];
  @Prop({ type: [{ path: String, name: String }], default: [] }) educationDocuments: { path: string; name: string }[];
  @Prop({ default: false }) bgv: boolean;
  @Prop({ default: 'Active' }) status: string;
}

export const EmployeeSchema = SchemaFactory.createForClass(Employee);
