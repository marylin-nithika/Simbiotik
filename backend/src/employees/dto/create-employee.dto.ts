import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  Matches,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

function computeAge(dob?: string): number | null {
  if (!dob) return null;
  const date = new Date(dob);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }
  return age;
}

@ValidatorConstraint({ async: false })
class IsAdultConstraint implements ValidatorConstraintInterface {
  validate(value: unknown) {
    const age = computeAge(String(value || ''));
    return age !== null && age >= 18;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Employee must be at least 18 years old to be onboarded.';
  }
}

function IsAdult(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: IsAdultConstraint,
    });
  };
}

export class CreateEmployeeDto {
  @ApiProperty({ example: 'SG008' })
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
  @ApiProperty() @IsNotEmpty() @IsDateString() @IsAdult() dob: string;
  @ApiProperty() @IsNotEmpty() joinDate: string;
  @ApiPropertyOptional() @IsOptional() username?: string;
  @ApiPropertyOptional() @IsOptional() supervisor?: string;
  @ApiPropertyOptional() @IsOptional() projectName?: string;
  @ApiPropertyOptional() @IsOptional() address?: Record<string, string>;
  @ApiPropertyOptional() @IsOptional() education?: Record<string, string>[];
  @ApiPropertyOptional() @IsOptional() experience?: Record<string, string>[];
  @ApiPropertyOptional() @IsOptional() passport?: Record<string, string>;
  @ApiPropertyOptional() @IsOptional() asset?: string;
  @ApiPropertyOptional() @IsOptional() status?: string;
  @ApiPropertyOptional() @IsOptional() bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
  };

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  bgv: boolean = false;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  insurance: boolean = false;
}
