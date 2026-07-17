import { Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { SeedService } from './seed/seed.service';
import { AuthModule } from './auth/auth.module';
import { EmployeesModule } from './employees/employees.module';
import { JwtAuthGuard } from './common/jwt-auth.guard';
import { LeavesModule } from './leaves/leaves.module';
import { JobsModule } from './jobs/jobs.module';
import { CandidatesModule } from './candidates/candidates.module';
import { PayrollModule } from './payroll/payroll.module';
import { PerformanceModule } from './performance/performance.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { GrievancesModule } from './grievances/grievances.module';
import { TimesheetsModule } from './timesheets/timesheets.module';
import { User, UserSchema } from './auth/schemas/user.schema';
import { Employee, EmployeeSchema } from './employees/schemas/employee.schema';
import { Job, JobSchema } from './jobs/schemas/job.schema';
import { Candidate, CandidateSchema } from './candidates/schemas/candidate.schema';
import { Payroll, PayrollSchema } from './payroll/schemas/payroll.schema';
import { Performance, PerformanceSchema } from './performance/schemas/performance.schema';
import { Feedback, FeedbackSchema } from './performance/schemas/feedback.schema';
import { Leave, LeaveSchema } from './leaves/schemas/leave.schema';
import { Grievance, GrievanceSchema } from './grievances/schemas/grievance.schema';
import { Timesheet, TimesheetSchema } from './timesheets/schemas/timesheet.schema';

const resolvedMongoUri = (() => {
  const uri = (process.env.MONGODB_URI || '').trim();
  if (!uri) {
    return 'mongodb://127.0.0.1:27017/hrms-simbiotik';
  }

  const [base, query = ''] = uri.split('?');
  if (/\/[^/?#]+$/.test(base)) {
    return uri;
  }

  const suffix = query ? `/hrms-simbiotik?${query}` : '/hrms-simbiotik';
  return `${base.replace(/\/$/, '')}${suffix}`;
})();

@Module({
  imports: [
    MongooseModule.forRoot(resolvedMongoUri),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Employee.name, schema: EmployeeSchema },
      { name: Job.name, schema: JobSchema },
      { name: Candidate.name, schema: CandidateSchema },
      { name: Payroll.name, schema: PayrollSchema },
      { name: Performance.name, schema: PerformanceSchema },
      { name: Feedback.name, schema: FeedbackSchema },
      { name: Leave.name, schema: LeaveSchema },
      { name: Grievance.name, schema: GrievanceSchema },
      { name: Timesheet.name, schema: TimesheetSchema },
    ]),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'hrms-simbiotik-jwt-secret',
      signOptions: { expiresIn: process.env.JWT_EXPIRES || '24h' },
    }),
    AuthModule,
    EmployeesModule,
    LeavesModule,
    JobsModule,
    CandidatesModule,
    PayrollModule,
    PerformanceModule,
    DashboardModule,
    GrievancesModule,
    TimesheetsModule,
  ],
  controllers: [AppController],
  providers: [SeedService],
})
export class AppModule implements OnModuleInit {
  constructor(private seed: SeedService) {}
  async onModuleInit() {
    await this.seed.run();
  }
}