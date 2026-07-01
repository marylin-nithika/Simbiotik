import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'SG00008' })
  @IsNotEmpty()
  @Matches(/^SG00[A-Za-z0-9]+$/, { message: 'Employee ID must start with SG00' })
  employeeId: string;

  @ApiProperty() @IsNotEmpty() name: string;

  @ApiProperty({ example: 'john@gmail.com' })
  @IsEmail()
  @Matches(/@gmail\.com$/i, { message:
     'Personal email must be a Gmail address' })
  email: string;

  @ApiProperty({ example: 'john@simbiotiktech.com' })
  @IsEmail()
  @Matches(/@simbiotiktech\.com$/i, { message: 'Office mail must be @simbiotiktech.com' })
  officeMail: string;

  @ApiProperty() @IsNotEmpty() department: string;

  @ApiPropertyOptional() @IsOptional() designation?: string;
  @ApiPropertyOptional() @IsOptional() role?: string;
  @ApiPropertyOptional() @IsOptional() employeeType?: string;
  @ApiPropertyOptional() @IsOptional() workingLocation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(/^[7-9][0-9]{9}$/, { message: 'Mobile must be 10-digit Indian number' })
  mobile?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(/^[7-9][0-9]{9}$/, { message: 'Emergency mobile must be 10-digit Indian number' })
  emergencyMobile?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(/^[0-9]{12}$/, { message: 'Aadhaar must be 12 digits' })
  aadhaar?: string;

  @ApiPropertyOptional({ example: 'ABCDE1234F' })
  @IsOptional()
  @Matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, { message: 'Invalid PAN format' })
  pan?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(/^[0-9]{12}$/, { message: 'UAN must be 12 digits' })
  uan?: string;

  @ApiPropertyOptional() @IsOptional() pfNo?: string;
  @ApiPropertyOptional() @IsOptional() dob?: string;
  @ApiProperty() @IsNotEmpty() joinDate: string;
  @ApiPropertyOptional() @IsOptional() username?: string;
  @ApiPropertyOptional() @IsOptional() supervisor?: string;
  @ApiPropertyOptional() @IsOptional() projectName?: string;
  @ApiPropertyOptional() @IsOptional() address?: Record<string, string>;
  @ApiPropertyOptional() @IsOptional() education?: Record<string, string>[];
  @ApiPropertyOptional() @IsOptional() experience?: Record<string, string>[];
  @ApiPropertyOptional() @IsOptional() passport?: Record<string, string>;
  @ApiPropertyOptional() @IsOptional() asset?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  bgv: boolean = false;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  insurance: boolean = false;
}
