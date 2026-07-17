import { IsNumber, IsString, Min } from 'class-validator';

export class AddActivityDto {
  @IsString()
  activity: string;

  @IsNumber()
  @Min(0.5)
  duration: number;
}

export class EditActivityDto {
  @IsNumber()
  @Min(0)
  index: number;

  @IsString()
  activity: string;

  @IsNumber()
  @Min(0.5)
  duration: number;
}

export class ResolveMissedPunchOutDto {
  @IsString()
  missedPunchOutTime: string;
}

export class SubmitTimesheetDto {
  // No specific fields needed; submission is explicit action
}
