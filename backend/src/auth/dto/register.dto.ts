import { IsEmail, IsIn, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'admin@simbiotiktech.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 6 })
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: ['admin', 'hr_manager', 'employee', 'manager', 'project_manager', 'reporting_manager', 'ca'] })
  @IsIn(['admin', 'hr_manager', 'employee', 'manager', 'project_manager', 'reporting_manager', 'ca'])
  role: string;

  @ApiProperty({ example: 'SG00001' })
  @IsNotEmpty()
  employeeId: string;
}
