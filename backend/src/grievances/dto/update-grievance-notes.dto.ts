import { IsOptional, IsString } from 'class-validator';

export class UpdateGrievanceNotesDto {
  @IsOptional()
  @IsString()
  hrNotes?: string;
}
