import { IsIn, IsNotEmpty, IsString } from 'class-validator';

const GRIEVANCE_STATUSES = ['Submitted', 'Acknowledged', 'Under Review', 'Need More Information', 'Resolved', 'Closed'];

export class UpdateGrievanceStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(GRIEVANCE_STATUSES)
  status: string;
}
