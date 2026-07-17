import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

const GRIEVANCE_CATEGORIES = [
  'Payroll',
  'Leave',
  'Attendance',
  'Workplace Harassment',
  'Discrimination',
  'Manager Conduct',
  'Workplace Safety',
  'Policy Violation',
  'Other',
];

const GRIEVANCE_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

export class CreateGrievanceDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(GRIEVANCE_CATEGORIES)
  category: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(GRIEVANCE_PRIORITIES)
  priority: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsString()
  attachment?: string;
}
