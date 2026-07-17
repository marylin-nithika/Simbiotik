import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TimesheetsController } from './timesheets.controller';
import { TimesheetsService } from './timesheets.service';
import { Timesheet, TimesheetSchema } from './schemas/timesheet.schema';
import { Employee, EmployeeSchema } from '../employees/schemas/employee.schema';
import { User, UserSchema } from '../auth/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Timesheet.name, schema: TimesheetSchema },
      { name: Employee.name, schema: EmployeeSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [TimesheetsController],
  providers: [TimesheetsService],
})
export class TimesheetsModule {}
