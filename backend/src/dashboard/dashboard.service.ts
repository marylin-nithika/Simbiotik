import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Employee } from '../employees/schemas/employee.schema';
import { Leave } from '../leaves/schemas/leave.schema';

const HOLIDAYS_2026 = [
  { name: "New Year's Day", date: '2026-01-01', day: 'Thursday' },
  { name: 'Republic Day', date: '2026-01-26', day: 'Monday' },
  { name: 'Ugadi', date: '2026-03-19', day: 'Thursday' },
  { name: 'Labour Day', date: '2026-05-01', day: 'Friday' },
  { name: 'Janmashtami', date: '2026-09-04', day: 'Friday' },
  { name: 'Ganesh Chaturthi', date: '2026-09-14', day: 'Monday' },
  { name: 'Gandhi Jayanti', date: '2026-10-02', day: 'Friday' },
  { name: 'Dussehra', date: '2026-10-20', day: 'Tuesday' },
  { name: 'Diwali', date: '2026-11-09', day: 'Monday' },
  { name: 'Christmas Day', date: '2026-12-25', day: 'Friday' },
];

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Employee.name) private employeeModel: Model<Employee>,
    @InjectModel(Leave.name) private leaveModel: Model<Leave>,
  ) {}

  private parseDob(dob?: string) {
    if (!dob) return null;
    const parts = dob.trim().split(/[-/]/);
    if (parts.length !== 3) return null;
    let day: number;
    let month: number;
    let year: number;
    if (parts[0].length === 4) {
      year = Number(parts[0]);
      month = Number(parts[1]) - 1;
      day = Number(parts[2]);
    } else {
      day = Number(parts[0]);
      month = Number(parts[1]) - 1;
      year = Number(parts[2]);
    }
    if (!day || month < 0 || !year) return null;
    return { day, month, year };
  }

  private getUpcomingBirthdays(employees: Employee[]) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return employees
      .map((employee) => {
        const parsed = this.parseDob(employee.dob);
        if (!parsed) return null;
        let next = new Date(today.getFullYear(), parsed.month, parsed.day);
        if (next < today) next = new Date(today.getFullYear() + 1, parsed.month, parsed.day);
        const daysUntil = Math.ceil((next.getTime() - today.getTime()) / 86400000);
        return {
          name: employee.name,
          employeeId: employee.employeeId,
          date: next.toISOString().split('T')[0],
          daysUntil,
          label: next.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        };
      })
      .filter(Boolean)
      .sort((a, b) => a!.daysUntil - b!.daysUntil)
      .slice(0, 5);
  }

  private getNextHoliday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcoming = HOLIDAYS_2026
      .map((holiday) => ({ ...holiday, at: new Date(`${holiday.date}T00:00:00`) }))
      .filter((holiday) => holiday.at >= today)
      .sort((a, b) => a.at.getTime() - b.at.getTime());
    const next = upcoming[0];
    if (!next) return null;
    const daysUntil = Math.ceil((next.at.getTime() - today.getTime()) / 86400000);
    return {
      name: next.name,
      date: next.date,
      day: next.day,
      daysUntil,
      label: next.at.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    };
  }

  private getWeeklyAttendance(activeCount: number) {
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const rates = [0.92, 0.9, 0.88, 0.91, 0.86, 0.35, 0.12];
    const present = rates.map((rate) => Math.max(0, Math.round(activeCount * rate)));
    const max = Math.max(...present, 1);
    return {
      labels,
      present,
      total: activeCount,
      heights: present.map((value) => Math.round((value / max) * 100)),
    };
  }

  async getStats() {
    const [employees, pendingLeaves, onLeave] = await Promise.all([
      this.employeeModel.find({ status: 'Active' }).exec(),
      this.leaveModel.countDocuments({ status: 'Pending' }),
      this.leaveModel.countDocuments({ status: 'Approved' }),
    ]);

    const activeCount = employees.length;

    return {
      totalEmployees: activeCount,
      onLeave,
      leaveRequests: pendingLeaves,
      attendance: {
        present: Math.round(activeCount * 0.9),
        absent: Math.max(0, activeCount - Math.round(activeCount * 0.9) - onLeave),
        onLeave,
      },
      weeklyAttendance: this.getWeeklyAttendance(activeCount),
      upcomingBirthdays: this.getUpcomingBirthdays(employees),
      nextHoliday: this.getNextHoliday(),
    };
  }
}
