import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Timesheet, TimesheetActivity } from './schemas/timesheet.schema';
import { Employee } from '../employees/schemas/employee.schema';
import { User } from '../auth/schemas/user.schema';
import { AddActivityDto, EditActivityDto, ResolveMissedPunchOutDto } from './dto/timesheet.dto';
import { mapDoc, mapDocs } from '../common/map-id';

@Injectable()
export class TimesheetsService {
  constructor(
    @InjectModel(Timesheet.name) private model: Model<Timesheet>,
    @InjectModel(Employee.name) private employeeModel: Model<Employee>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  private getTodayDate(): string {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }

  private async getEmployeeInfo(employeeId: string) {
    const employee = await this.employeeModel.findOne({ employeeId }).lean().exec();
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  private calculatePunchedInDuration(punchInTime?: Date, punchOutTime?: Date): number {
    if (!punchInTime) return 0;
    if (!punchOutTime) return 0;
    const durationMs = punchOutTime.getTime() - punchInTime.getTime();
    return Math.round((durationMs / (1000 * 60 * 60)) * 100) / 100;
  }

  private calculateTotalActivityHours(activities: TimesheetActivity[]): number {
    return activities.reduce((sum, act) => sum + (act.duration || 0), 0);
  }

  async getTodayTimesheet(employeeId: string) {
    const today = this.getTodayDate();
    const timesheet = await this.model.findOne({ employeeId, date: today }).lean().exec();
    return timesheet ? mapDoc(timesheet) : null;
  }

  async getOrCreateTodayTimesheet(user: any) {
    const today = this.getTodayDate();
    const employeeId = user.employeeId;

    let timesheet = await this.model.findOne({ employeeId, date: today }).exec();

    if (!timesheet) {
      const employee = await this.getEmployeeInfo(employeeId);

      timesheet = await this.model.create({
        employeeId,
        employeeName: employee.name,
        email: employee.email || user.email,
        date: today,
        reportingManagerId: employee.supervisor,
        status: 'Not Punched In',
        activities: [],
        submitted: false,
      });
    }

    return mapDoc(timesheet);
  }

  async checkMissedPunchOut(employeeId: string): Promise<any> {
    const today = this.getTodayDate();

    // Get yesterday's date
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split('T')[0];

    const previousTimesheet = await this.model
      .findOne({
        employeeId,
        date: yesterday,
        punchInTime: { $exists: true, $ne: null },
        punchOutTime: { $exists: false },
      })
      .lean()
      .exec();

    return previousTimesheet || null;
  }

  async punchIn(user: any) {
    const today = this.getTodayDate();
    const employeeId = user.employeeId;

    const missedPunchOut = await this.checkMissedPunchOut(employeeId);
    if (missedPunchOut) {
      throw new BadRequestException('Resolve your previous missed punch-out before punching in today');
    }

    const existingTimesheet = await this.model.findOne({ employeeId, date: today }).exec();

    if (existingTimesheet && existingTimesheet.punchInTime) {
      throw new BadRequestException('You have already punched in today');
    }

    const employee = await this.getEmployeeInfo(employeeId);

    if (!existingTimesheet) {
      const timesheet = await this.model.create({
        employeeId,
        employeeName: employee.name,
        email: employee.email || user.email,
        date: today,
        reportingManagerId: employee.supervisor,
        punchInTime: new Date(),
        status: 'Working',
        activities: [],
        submitted: false,
      });
      return mapDoc(timesheet);
    }

    existingTimesheet.punchInTime = new Date();
    existingTimesheet.status = 'Working';
    await existingTimesheet.save();
    return mapDoc(existingTimesheet);
  }

  async punchOut(user: any) {
    const today = this.getTodayDate();
    const employeeId = user.employeeId;

    const timesheet = await this.model.findOne({ employeeId, date: today }).exec();

    if (!timesheet) {
      throw new NotFoundException('Timesheet not found');
    }

    if (!timesheet.punchInTime) {
      throw new BadRequestException('You must punch in first');
    }

    if (timesheet.punchOutTime) {
      throw new BadRequestException('You have already punched out today');
    }

    timesheet.punchOutTime = new Date();
    timesheet.status = 'Punched Out';
    timesheet.punchOutSource = 'System';
    await timesheet.save();

    return mapDoc(timesheet);
  }

  async addActivity(user: any, dto: AddActivityDto) {
    const today = this.getTodayDate();
    const employeeId = user.employeeId;

    const timesheet = await this.model.findOne({ employeeId, date: today }).exec();

    if (!timesheet) {
      throw new NotFoundException('Timesheet not found');
    }

    if (!timesheet.punchInTime) {
      throw new BadRequestException('You must punch in to add activities');
    }

    if (timesheet.submitted) {
      throw new BadRequestException('Cannot add activities to a submitted timesheet');
    }

    timesheet.activities.push({
      activity: dto.activity,
      duration: dto.duration,
    });

    await timesheet.save();
    return mapDoc(timesheet);
  }

  async editActivity(user: any, index: number, dto: AddActivityDto) {
    const today = this.getTodayDate();
    const employeeId = user.employeeId;

    const timesheet = await this.model.findOne({ employeeId, date: today }).exec();

    if (!timesheet) {
      throw new NotFoundException('Timesheet not found');
    }

    if (timesheet.submitted) {
      throw new BadRequestException('Cannot edit activities in a submitted timesheet');
    }

    if (index < 0 || index >= timesheet.activities.length) {
      throw new BadRequestException('Invalid activity index');
    }

    timesheet.activities[index] = {
      activity: dto.activity,
      duration: dto.duration,
    };

    await timesheet.save();
    return mapDoc(timesheet);
  }

  async deleteActivity(user: any, index: number) {
    const today = this.getTodayDate();
    const employeeId = user.employeeId;

    const timesheet = await this.model.findOne({ employeeId, date: today }).exec();

    if (!timesheet) {
      throw new NotFoundException('Timesheet not found');
    }

    if (timesheet.submitted) {
      throw new BadRequestException('Cannot delete activities from a submitted timesheet');
    }

    if (index < 0 || index >= timesheet.activities.length) {
      throw new BadRequestException('Invalid activity index');
    }

    timesheet.activities.splice(index, 1);
    await timesheet.save();
    return mapDoc(timesheet);
  }

  async resolveMissedPunchOut(user: any, missedTimesheetId: string, dto: ResolveMissedPunchOutDto) {
    const employeeId = user.employeeId;

    const missedTimesheet = await this.model.findById(missedTimesheetId).exec();

    if (!missedTimesheet) {
      throw new NotFoundException('Timesheet not found');
    }

    if (missedTimesheet.employeeId !== employeeId) {
      throw new BadRequestException('You can only resolve your own missed punch-outs');
    }

    if (!missedTimesheet.punchInTime) {
      throw new BadRequestException('No punch-in found for this timesheet');
    }

    if (missedTimesheet.punchOutTime) {
      throw new BadRequestException('This timesheet already has a punch-out');
    }

    const punchOutTime = new Date(dto.missedPunchOutTime);

    if (isNaN(punchOutTime.getTime())) {
      throw new BadRequestException('Invalid punch-out time format');
    }

    if (punchOutTime <= missedTimesheet.punchInTime) {
      throw new BadRequestException('Punch-out time must be after punch-in time');
    }

    missedTimesheet.punchOutTime = punchOutTime;
    missedTimesheet.punchOutSource = 'Manual';
    missedTimesheet.status = 'Punched Out';
    await missedTimesheet.save();

    return mapDoc(missedTimesheet);
  }

  async submitTimesheet(user: any) {
    const today = this.getTodayDate();
    const employeeId = user.employeeId;

    const timesheet = await this.model.findOne({ employeeId, date: today }).exec();

    if (!timesheet) {
      throw new NotFoundException('Timesheet not found');
    }

    if (!timesheet.punchInTime) {
      throw new BadRequestException('Cannot submit without punch-in');
    }

    if (!timesheet.punchOutTime) {
      throw new BadRequestException('Cannot submit without punch-out');
    }

    if (timesheet.submitted) {
      throw new BadRequestException('This timesheet is already submitted');
    }

    timesheet.submitted = true;
    timesheet.submittedAt = new Date();
    timesheet.status = 'Submitted';
    await timesheet.save();

    return mapDoc(timesheet);
  }

  async getMyTimesheets(user: any, limit = 30) {
    const timesheets = await this.model
      .find({ employeeId: user.employeeId })
      .sort({ date: -1 })
      .limit(limit)
      .lean()
      .exec();

    return mapDocs(timesheets);
  }

  async getTimesheetByDateRange(employeeId: string, fromDate: string, toDate: string) {
    const timesheets = await this.model
      .find({
        employeeId,
        date: { $gte: fromDate, $lte: toDate },
      })
      .sort({ date: -1 })
      .lean()
      .exec();

    return mapDocs(timesheets);
  }

  async getTeamTimesheets(managerEmployeeId: string) {
    const today = this.getTodayDate();

    const directReports = await this.employeeModel
      .find({
        supervisor: managerEmployeeId,
        status: { $ne: 'Inactive' },
      })
      .lean()
      .exec();

    const directReportIds = directReports.map((emp) => emp.employeeId);

    const timesheets = await this.model
      .find({
        employeeId: { $in: directReportIds },
        date: today,
      })
      .lean()
      .exec();

    const timesheetByEmployeeId = new Map(timesheets.map((ts) => [ts.employeeId, ts]));
    return directReports.map((employee) => {
      const timesheet = timesheetByEmployeeId.get(employee.employeeId);
      if (timesheet) return mapDoc(timesheet);
      return {
        id: null,
        employeeId: employee.employeeId,
        employeeName: employee.name,
        date: today,
        status: 'Not Submitted',
        activities: [],
        submitted: false,
      };
    });
  }

  async getTeamTimesheetDetail(managerEmployeeId: string, subordinateId: string, date: string) {
    const subordinate = await this.employeeModel
      .findOne({
        employeeId: subordinateId,
        supervisor: managerEmployeeId,
      })
      .lean()
      .exec();

    if (!subordinate) {
      throw new BadRequestException('You do not have access to this employee');
    }

    const timesheet = await this.model
      .findOne({
        employeeId: subordinateId,
        date,
        submitted: true,
      })
      .lean()
      .exec();

    if (!timesheet) {
      throw new NotFoundException('Timesheet not found');
    }

    return mapDoc(timesheet);
  }

  async getAllEmployeeTimesheets(limit = 100) {
    const today = this.getTodayDate();

    const activeEmployees = await this.employeeModel
      .find({ status: { $ne: 'Inactive' } })
      .lean()
      .exec();

    const employeeIds = activeEmployees.map((emp) => emp.employeeId);

    const timesheets = await this.model
      .find({
        employeeId: { $in: employeeIds },
        date: today,
      })
      .sort({ employeeName: 1 })
      .limit(limit)
      .lean()
      .exec();

    const employeeMap = new Map(activeEmployees.map((emp) => [emp.employeeId, emp]));

    const result = employeeIds.map((empId) => {
      const timesheet = timesheets.find((t) => t.employeeId === empId);
      const employee = employeeMap.get(empId);

      const overview = {
        _id: null,
        employeeId: empId,
        employeeName: employee?.name || 'Unknown',
        department: employee?.department || '',
        email: employee?.email || '',
        date: today,
        status: timesheet?.status || 'Not Punched In',
        punchInTime: null,
        punchOutTime: null,
        activities: [],
        submitted: false,
      };
      if (!timesheet) return overview;
      return {
        ...overview,
        ...mapDoc(timesheet),
        employeeId: empId,
        employeeName: employee?.name || timesheet.employeeName || 'Unknown',
        department: employee?.department || '',
      };
    });

    return result;
  }

  async getEmployeeTimesheetHistory(
    employeeId: string,
    fromDate?: string,
    toDate?: string,
    page = 1,
    limit = 30,
  ) {
    const query: any = { employeeId };

    if (fromDate || toDate) {
      query.date = {};
      if (fromDate) query.date.$gte = fromDate;
      if (toDate) query.date.$lte = toDate;
    }

    const skip = (page - 1) * limit;
    const timesheets = await this.model
      .find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    const total = await this.model.countDocuments(query);

    return {
      data: mapDocs(timesheets),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getEmployeeTimesheetDetail(employeeId: string, date: string) {
    const timesheet = await this.model
      .findOne({
        employeeId,
        date,
      })
      .lean()
      .exec();

    if (!timesheet) {
      throw new NotFoundException('Timesheet not found');
    }

    const employee = await this.getEmployeeInfo(employeeId);
    return {
      ...mapDoc(timesheet),
      employeeName: employee.name || timesheet.employeeName,
      department: employee.department || '',
    };
  }

  async enrichTimesheetWithCalculations(timesheet: any) {
    if (!timesheet) return timesheet;

    return {
      ...timesheet,
      punchedInDuration: this.calculatePunchedInDuration(
        timesheet.punchInTime ? new Date(timesheet.punchInTime) : undefined,
        timesheet.punchOutTime ? new Date(timesheet.punchOutTime) : undefined,
      ),
      totalActivityHours: this.calculateTotalActivityHours(timesheet.activities || []),
    };
  }
}
