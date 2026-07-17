import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req, Query, BadRequestException, NotFoundException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TimesheetsService } from './timesheets.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { AddActivityDto, EditActivityDto, ResolveMissedPunchOutDto } from './dto/timesheet.dto';

@ApiTags('Timesheets')
@ApiBearerAuth()
@Controller('timesheets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TimesheetsController {
  constructor(private timesheets: TimesheetsService) {}

  private normalizedRole(role?: string) {
    const value = String(role || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
    if (['hr', 'hr_manager'].includes(value)) return 'hr_manager';
    if (['manager', 'reporting_manager'].includes(value)) return 'reporting_manager';
    return value;
  }

  @Get('today')
  @Roles('employee', 'manager', 'project_manager', 'reporting_manager', 'hr', 'admin')
  @ApiOperation({ summary: 'Get today timesheet with status and calculations' })
  async getTodayTimesheet(@Req() req: any) {
    const timesheet = await this.timesheets.getOrCreateTodayTimesheet(req.user);
    return this.timesheets.enrichTimesheetWithCalculations(timesheet);
  }

  @Get('missed-punch-out')
  @Roles('employee', 'manager', 'project_manager', 'reporting_manager', 'hr', 'admin')
  @ApiOperation({ summary: 'Check for missed punch-out from previous day' })
  async checkMissedPunchOut(@Req() req: any) {
    const missed = await this.timesheets.checkMissedPunchOut(req.user.employeeId);
    if (missed) {
      return {
        hasMissedPunchOut: true,
        timesheet: missed,
      };
    }
    return {
      hasMissedPunchOut: false,
    };
  }

  @Post('punch-in')
  @Roles('employee', 'manager', 'project_manager', 'reporting_manager', 'hr', 'admin')
  @ApiOperation({ summary: 'Punch in for the day' })
  async punchIn(@Req() req: any) {
    const timesheet = await this.timesheets.punchIn(req.user);
    return this.timesheets.enrichTimesheetWithCalculations(timesheet);
  }

  @Post('punch-out')
  @Roles('employee', 'manager', 'project_manager', 'reporting_manager', 'hr', 'admin')
  @ApiOperation({ summary: 'Punch out for the day' })
  async punchOut(@Req() req: any) {
    const timesheet = await this.timesheets.punchOut(req.user);
    return this.timesheets.enrichTimesheetWithCalculations(timesheet);
  }

  @Post('activities')
  @Roles('employee', 'manager', 'project_manager', 'reporting_manager', 'hr', 'admin')
  @ApiOperation({ summary: 'Add activity to todays timesheet' })
  async addActivity(@Req() req: any, @Body() dto: AddActivityDto) {
    const timesheet = await this.timesheets.addActivity(req.user, dto);
    return this.timesheets.enrichTimesheetWithCalculations(timesheet);
  }

  @Patch('activities/:index')
  @Roles('employee', 'manager', 'project_manager', 'reporting_manager', 'hr', 'admin')
  @ApiOperation({ summary: 'Edit activity in todays timesheet' })
  async editActivity(
    @Req() req: any,
    @Param('index') indexStr: string,
    @Body() dto: AddActivityDto,
  ) {
    const index = parseInt(indexStr, 10);
    if (isNaN(index)) throw new BadRequestException('Invalid index');
    const timesheet = await this.timesheets.editActivity(req.user, index, dto);
    return this.timesheets.enrichTimesheetWithCalculations(timesheet);
  }

  @Patch('activities/:index/delete')
  @Roles('employee', 'manager', 'project_manager', 'reporting_manager', 'hr', 'admin')
  @ApiOperation({ summary: 'Delete activity from todays timesheet' })
  async deleteActivity(@Req() req: any, @Param('index') indexStr: string) {
    const index = parseInt(indexStr, 10);
    if (isNaN(index)) throw new BadRequestException('Invalid index');
    const timesheet = await this.timesheets.deleteActivity(req.user, index);
    return this.timesheets.enrichTimesheetWithCalculations(timesheet);
  }

  @Patch('resolve-missed-punch-out/:timesheetId')
  @Roles('employee', 'manager', 'project_manager', 'reporting_manager', 'hr', 'admin')
  @ApiOperation({ summary: 'Resolve missed punch-out from previous day' })
  async resolveMissedPunchOut(
    @Req() req: any,
    @Param('timesheetId') timesheetId: string,
    @Body() dto: ResolveMissedPunchOutDto,
  ) {
    const timesheet = await this.timesheets.resolveMissedPunchOut(req.user, timesheetId, dto);
    return this.timesheets.enrichTimesheetWithCalculations(timesheet);
  }

  @Post('submit')
  @Roles('employee', 'manager', 'project_manager', 'reporting_manager', 'hr', 'admin')
  @ApiOperation({ summary: 'Submit today timesheet' })
  async submitTimesheet(@Req() req: any) {
    const timesheet = await this.timesheets.submitTimesheet(req.user);
    return this.timesheets.enrichTimesheetWithCalculations(timesheet);
  }

  @Get('history')
  @Roles('employee', 'manager', 'project_manager', 'reporting_manager', 'hr', 'admin')
  @ApiOperation({ summary: 'Get my timesheet history' })
  async getMyHistory(@Req() req: any, @Query('limit') limitStr?: string) {
    const limit = limitStr ? parseInt(limitStr, 10) : 30;
    const timesheets = await this.timesheets.getMyTimesheets(req.user, limit);
    return timesheets.map((ts) => this.timesheets.enrichTimesheetWithCalculations(ts));
  }

  @Get('team')
  @Roles('reporting_manager', 'hr', 'admin')
  @ApiOperation({ summary: 'Get team timesheets for reporting manager (today)' })
  async getTeamTimesheets(@Req() req: any) {
    const role = this.normalizedRole(req.user.role);
    if (role === 'reporting_manager') {
      const timesheets = await this.timesheets.getTeamTimesheets(req.user.employeeId);
      return timesheets.map((ts) => this.timesheets.enrichTimesheetWithCalculations(ts));
    } else if (role === 'hr_manager' || role === 'admin') {
      const timesheets = await this.timesheets.getAllEmployeeTimesheets();
      return timesheets.map((ts) => this.timesheets.enrichTimesheetWithCalculations(ts));
    }
    throw new BadRequestException('Unauthorized');
  }

  @Get('team/:employeeId/:date')
  @Roles('reporting_manager', 'hr', 'admin')
  @ApiOperation({ summary: 'Get specific team member timesheet detail' })
  async getTeamTimesheetDetail(
    @Req() req: any,
    @Param('employeeId') employeeId: string,
    @Param('date') date: string,
  ) {
    const role = this.normalizedRole(req.user.role);
    if (role === 'reporting_manager') {
      const timesheet = await this.timesheets.getTeamTimesheetDetail(req.user.employeeId, employeeId, date);
      return this.timesheets.enrichTimesheetWithCalculations(timesheet);
    } else if (role === 'hr_manager' || role === 'admin') {
      const timesheet = await this.timesheets.getEmployeeTimesheetDetail(employeeId, date);
      return this.timesheets.enrichTimesheetWithCalculations(timesheet);
    }
    throw new BadRequestException('Unauthorized');
  }

  @Get('manage/employee/:employeeId')
  @Roles('hr_manager', 'admin')
  @ApiOperation({ summary: 'Get employee timesheet history for HR' })
  async getEmployeeHistory(
    @Param('employeeId') employeeId: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
  ) {
    const page = pageStr ? parseInt(pageStr, 10) : 1;
    const limit = limitStr ? parseInt(limitStr, 10) : 30;
    const result = await this.timesheets.getEmployeeTimesheetHistory(employeeId, fromDate, toDate, page, limit);
    return {
      ...result,
      data: result.data.map((ts) => this.timesheets.enrichTimesheetWithCalculations(ts)),
    };
  }

  @Get('manage/employee/:employeeId/:date')
  @Roles('hr_manager', 'admin')
  @ApiOperation({ summary: 'Get specific employee daily timesheet detail for HR' })
  async getEmployeeTimesheetDetail(
    @Param('employeeId') employeeId: string,
    @Param('date') date: string,
  ) {
    const timesheet = await this.timesheets.getEmployeeTimesheetDetail(employeeId, date);
    return this.timesheets.enrichTimesheetWithCalculations(timesheet);
  }
}
