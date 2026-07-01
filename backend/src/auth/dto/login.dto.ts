import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'sarah@company.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'emp123' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
