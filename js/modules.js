const Modules = (() => {
  const icons = {
    dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
    leave: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    employees: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    recruitment: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>',
    payroll: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    performance: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
    reports: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>'
  };

  const ROLE_NAV = {
    admin: [
      { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
      { id: 'employees', label: 'Employees', icon: 'employees' },
      { id: 'leave', label: 'Leave Request', icon: 'leave' },
      { id: 'recruitment', label: 'Recruitment', icon: 'recruitment' },
      { id: 'payroll', label: 'Payroll', icon: 'payroll' },
      { id: 'performance', label: 'Performance', icon: 'performance' },
      { id: 'reports', label: 'Reports', icon: 'reports' }
    ],
    hr_manager: [
      { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
      { id: 'employees', label: 'Employees', icon: 'employees' },
      { id: 'leave', label: 'Leave Request', icon: 'leave' },
      { id: 'recruitment', label: 'Recruitment', icon: 'recruitment' },
      { id: 'payroll', label: 'Payroll', icon: 'payroll' },
      { id: 'performance', label: 'Performance', icon: 'performance' }
    ],
    employee: [
      { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
      { id: 'leave', label: 'Leave Request', icon: 'leave' },
      { id: 'recruitment', label: 'Recruitment', icon: 'recruitment' },
      { id: 'payroll', label: 'Payroll', icon: 'payroll' }
    ],
    project_manager: [
      { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
      { id: 'leave', label: 'Leave Request', icon: 'leave' },
      { id: 'recruitment', label: 'Recruitment', icon: 'recruitment' },
      { id: 'payroll', label: 'Payroll', icon: 'payroll' }
    ],
    reporting_manager: [
      { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
      { id: 'leave', label: 'Leave Request', icon: 'leave' },
      { id: 'recruitment', label: 'Recruitment', icon: 'recruitment' },
      { id: 'payroll', label: 'Payroll', icon: 'payroll' },
      { id: 'performance', label: 'Performance', icon: 'performance' }
    ],
    ca: [
      { id: 'employees', label: 'Employees', icon: 'employees' },
      { id: 'payroll', label: 'Payroll', icon: 'payroll' }
    ]
  };

  const PERMS = {
    'leave.approval': ['admin', 'hr_manager', 'project_manager', 'reporting_manager'],
    'payroll.list': ['admin', 'hr_manager', 'ca'],
    'payroll.process': ['admin', 'hr_manager', 'ca'],
    'recruitment.pipeline': ['admin', 'hr_manager'],
    'recruitment.post': ['admin', 'hr_manager'],
    'recruitment.refer': ['admin', 'hr_manager', 'employee', 'project_manager', 'reporting_manager'],
    'employees.onboard': ['hr_manager'],
    'employees.view': ['admin', 'hr_manager', 'ca'],
    'employees.edit': ['admin', 'hr_manager'],
    'performance.manage': ['admin', 'hr_manager', 'reporting_manager']
  };

  function effectiveRole(role) {
    return (role || '').toLowerCase() === 'manager' ? 'reporting_manager' : (role || '').toLowerCase();
  }

  function canAccess(user, feature) {
    return PERMS[feature]?.includes(effectiveRole(user.role)) ?? false;
  }

  function isLeaveApprover(user) {
    return canAccess(user, 'leave.approval');
  }

  function getDefaultSub(page, user) {
    if (page === 'leave' && user && isLeaveApprover(user)) return 'approval';
    const role = effectiveRole(user?.role);
    if (page === 'payroll' && user && ['admin', 'hr_manager', 'ca'].includes(role)) return 'list';
    return DEFAULT_SUB[page] || '';
  }

  function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function formatRupee(amount) {
    return `₹${Number(amount).toLocaleString('en-IN')}`;
  }

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
    { name: 'Christmas Day', date: '2026-12-25', day: 'Friday' }
  ];

  function parseDob(dob) {
    if (!dob) return null;
    const parts = String(dob).trim().split(/[-/]/);
    if (parts.length !== 3) return null;
    let day; let month; let year;
    if (parts[0].length === 4) {
      year = Number(parts[0]); month = Number(parts[1]) - 1; day = Number(parts[2]);
    } else {
      day = Number(parts[0]); month = Number(parts[1]) - 1; year = Number(parts[2]);
    }
    if (!day || month < 0 || !year) return null;
    return { day, month, year };
  }

  function getUpcomingBirthdays(employees) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return employees
      .filter(e => e.status === 'Active')
      .map((employee) => {
        const parsed = parseDob(employee.dob);
        if (!parsed) return null;
        let next = new Date(today.getFullYear(), parsed.month, parsed.day);
        if (next < today) next = new Date(today.getFullYear() + 1, parsed.month, parsed.day);
        const daysUntil = Math.ceil((next - today) / 86400000);
        return {
          name: employee.name,
          employeeId: employee.employeeId,
          daysUntil,
          label: next.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 5);
  }

  function getNextHoliday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcoming = HOLIDAYS_2026
      .map(h => ({ ...h, at: new Date(`${h.date}T00:00:00`) }))
      .filter(h => h.at >= today)
      .sort((a, b) => a.at - b.at);
    const next = upcoming[0];
    if (!next) return null;
    return {
      name: next.name,
      date: next.date,
      day: next.day,
      daysUntil: Math.ceil((next.at - today) / 86400000),
      label: next.at.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    };
  }

  function getWeeklyAttendanceData(employees, dashboard) {
    if (dashboard?.weeklyAttendance) return dashboard.weeklyAttendance;
    const activeCount = employees.filter(e => e.status === 'Active').length || employees.length;
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const rates = [0.92, 0.9, 0.88, 0.91, 0.86, 0.35, 0.12];
    const present = rates.map(rate => Math.max(0, Math.round(activeCount * rate)));
    const max = Math.max(...present, 1);
    return {
      labels,
      present,
      total: activeCount,
      heights: present.map(value => Math.round((value / max) * 100))
    };
  }

  function statusBadge(status) {
    const cls = {
      Approved: 'badge-approved',
      Rejected: 'badge-rejected',
      Deleted: 'badge-deleted',
      Pending: 'badge-pending'
    }[status] || 'badge-pending';
    return `<span class="badge ${cls}">${status}</span>`;
  }

  function leaveTypeBadge(type) {
    const cls = type === 'sick' ? 'badge-sick' : 'badge-annual';
    const label = type === 'sick' ? 'Sick Leave' : 'Annual Leave';
    return `<span class="badge ${cls}">${label}</span>`;
  }

  function formatRoleName(role) {
    const key = effectiveRole(role);
    const names = {
      hr_manager: 'HR Manager',
      project_manager: 'Project Manager',
      reporting_manager: 'Reporting Manager',
      admin: 'Admin',
      employee: 'Employee',
      ca: 'CA'
    };
    return names[key] || (key || '').replace(/_/g, ' ');
  }

  function renderApprovalBoxes(approvals) {
    const a = Store.normalizeApprovals(approvals);
    const steps = Store.APPROVAL_STEPS.filter(s => a[s.key] !== 'N/A');
    return `<div class="approval-tracker">${steps.map(s => {
      const st = a[s.key] || 'Pending';
      const cls = st === 'Approved' ? 'approved'
        : st === 'Rejected' ? 'rejected'
        : st === 'Cancelled' ? 'cancelled'
        : 'pending';
      return `<div class="approval-box ${cls}"><span class="approval-label">${s.label}</span><span class="approval-status">${st}</span></div>`;
    }).join('')}</div>`;
  }

  function renderSubTabs(page, user, subPage) {
    const tabs = {
      leave: [
        { id: 'apply', label: 'My Leave', locked: false },
        { id: 'approval', label: 'Approvals', locked: !isLeaveApprover(user) }
      ],
      payroll: [
        { id: 'list', label: 'Payroll', locked: !canAccess(user, 'payroll.list') },
        { id: 'tax-form', label: 'Tax Form', locked: false },
        { id: 'payslip', label: 'Download Payslip', locked: false }
      ],
      recruitment: [
        { id: 'pipeline', label: 'Recruitment', locked: !canAccess(user, 'recruitment.pipeline') },
        { id: 'jobs', label: 'Job Posting', locked: false },
        { id: 'referrals', label: 'Referrals', locked: false }
      ]
    };

    const pageTabs = tabs[page];
    if (!pageTabs) return '';

    const filteredTabs = pageTabs.filter(t => !(page === 'payroll' && t.id === 'payslip' && effectiveRole(user.role) === 'ca'));

    return `
      <div class="sub-tabs">
        <label class="sub-tabs-label" for="sub-tab-select">Section</label>
        <select id="sub-tab-select" class="sub-tab-select">
          ${filteredTabs.map(t => `
            <option value="${t.id}" ${subPage === t.id ? 'selected' : ''} ${t.locked ? 'disabled' : ''}>
              ${t.label}${t.locked ? ' 🔒' : ''}
            </option>
          `).join('')}
        </select>
      </div>`;
  }

  function renderDashboard(user) {
    const employees = Store.getEmployees();
    const dashboard = Store.getDashboard();
    const role = effectiveRole(user.role);
    const ownLeaves = Store.getLeaves().filter(l => Store.isOwnLeave(l, user) && Store.isLeaveActive(l));
    const pending = role === 'employee'
      ? ownLeaves.filter(l => l.status === 'Pending').length
      : Store.getLeaves().filter(l => Store.isLeaveActive(l) && l.status === 'Pending').length;
    const attendance = dashboard?.attendance || Store.getAttendance();
    const weekly = getWeeklyAttendanceData(employees, dashboard);
    const birthdays = dashboard?.upcomingBirthdays || getUpcomingBirthdays(employees);
    const holiday = dashboard?.nextHoliday || getNextHoliday();
    const totalEmployees = dashboard?.totalEmployees ?? employees.length;

    return `
      <div class="stats-grid">
        <div class="stat-card accent-blue">
          <div class="label">Total Employees</div>
          <div class="value">${totalEmployees}</div>
          <div class="change">Active workforce</div>
        </div>
        <div class="stat-card accent-amber">
          <div class="label">${role === 'employee' ? 'My Pending Leave' : 'Pending Leave Requests'}</div>
          <div class="value">${pending}</div>
          <div class="change">${role === 'employee' ? 'Your requests awaiting approval' : 'Awaiting approval'}</div>
        </div>
        <div class="stat-card accent-green">
          <div class="label">Present Today</div>
          <div class="value">${attendance.present ?? 0}</div>
          <div class="change">Attendance tracked</div>
        </div>
        <div class="stat-card accent-red">
          <div class="label">On Leave</div>
          <div class="value">${attendance.onLeave ?? 0}</div>
          <div class="change">Currently away</div>
        </div>
      </div>
      <div class="dashboard-panels">
        <div class="panel">
          <div class="panel-header"><h3>Weekly Attendance</h3></div>
          <div class="panel-body">
            <div class="chart-bars chart-bars-tall">
              ${weekly.labels.map((label, i) => `
                <div class="chart-bar-wrap">
                  <span class="chart-bar-value">${weekly.present[i]}</span>
                  <div class="chart-bar" style="height:${weekly.heights[i]}%"></div>
                  <span>${label}</span>
                </div>
              `).join('')}
            </div>
            <p class="form-hint" style="margin-top:1rem">Present employees this week (of ${weekly.total} active)</p>
          </div>
        </div>
        <div class="dashboard-side-panels">
          <div class="panel highlight-panel">
            <div class="panel-header"><h3>Next Holiday</h3></div>
            <div class="panel-body">
              ${holiday ? `
                <div class="highlight-card">
                  <div class="highlight-title">${holiday.name}</div>
                  <div class="highlight-meta">${holiday.label} · ${holiday.day}</div>
                  <div class="highlight-sub">${holiday.daysUntil === 0 ? 'Today' : `In ${holiday.daysUntil} day${holiday.daysUntil > 1 ? 's' : ''}`}</div>
                </div>
              ` : '<div class="empty-state"><p>No upcoming holidays</p></div>'}
            </div>
          </div>
          <div class="panel">
            <div class="panel-header"><h3>Upcoming Birthdays</h3></div>
            <div class="panel-body" style="padding:0">
              ${birthdays.length === 0 ? '<div class="empty-state"><p>No birthdays on file</p></div>' : `
                <ul class="birthday-list">
                  ${birthdays.map(b => `
                    <li class="birthday-item">
                      <span class="birthday-icon">🎂</span>
                      <div>
                        <strong>${b.name}</strong>
                        <span class="birthday-meta">${b.label} · ${b.daysUntil === 0 ? 'Today! 🎈' : `in ${b.daysUntil} day${b.daysUntil > 1 ? 's' : ''}`}</span>
                      </div>
                    </li>
                  `).join('')}
                </ul>`}
            </div>
          </div>
        </div>
      </div>`;
  }

  function renderLeave(user, subPage) {
    if (subPage === 'approval') {
      if (!canAccess(user, 'leave.approval')) {
        return `<div class="locked-panel"><div class="locked-icon">🔒</div><h3>Approval Locked</h3><p>Only Reporting Manager, Project Manager, HR, and Admin can access leave approvals.</p></div>`;
      }
      return renderLeaveApprovals(user);
    }
    return renderApplyLeave(user);
  }

  function renderApplyLeave(user) {
    const balances = Store.computeLeaveBalance(user.employeeId);
    const leaves = Store.getLeaves().filter(l => Store.isOwnLeave(l, user));

    return `
      <div class="balance-pills">
        <div class="balance-pill sick-balance">
          <span class="dot dot-sick"></span>
          <div>
            <strong>Sick Leave</strong>
            <span class="balance-fraction">${balances.sick.remaining}/${balances.sick.total}</span>
            <span class="balance-used">${balances.sick.used} day(s) used</span>
          </div>
        </div>
        <div class="balance-pill annual-balance">
          <span class="dot dot-annual"></span>
          <div>
            <strong>Annual Leave</strong>
            <span class="balance-fraction">${balances.annual.remaining}/${balances.annual.total}</span>
            <span class="balance-used">${balances.annual.used} day(s) used</span>
          </div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-header">
          <h3>My Leave Requests</h3>
          <button class="btn btn-primary btn-sm" id="btn-apply-leave" type="button">+ New Request</button>
        </div>
        <div class="panel-body">
          ${leaves.length === 0 ? `<div class="empty-state"><p>You have not applied for any leave yet.</p></div>` : `
            <div class="leave-grid">
              ${leaves.map(l => `
                <div class="leave-card">
                  <div class="leave-card-header">
                    ${leaveTypeBadge(l.leaveType)}
                    ${statusBadge(l.status)}
                  </div>
                  <div class="leave-card-dates">${formatDate(l.fromDate)} – ${formatDate(l.toDate)} (${l.numberOfDays} day${l.numberOfDays > 1 ? 's' : ''})</div>
                  <div class="leave-card-reason">${l.reason}</div>
                  ${l.documents?.length ? `<div class="doc-download-list" style="margin-top:0.5rem">
                    ${l.documents.map((doc, i) => {
                      const name = typeof doc === 'string' ? doc.split('/').pop() : `Doc ${i + 1}`;
                      return `<button class="btn btn-secondary btn-sm doc-download-btn" type="button" data-download-leave-doc="${l.id}" data-doc-index="${i}">📥 ${name}</button>`;
                    }).join('')}
                  </div>` : ''}
                  <div class="approval-section">
                    <p class="approval-title">Approval Stages</p>
                    ${renderApprovalBoxes(l.approvals)}
                  </div>
                  <div class="leave-card-actions">
                    ${l.status === 'Pending' ? `<button class="btn btn-danger btn-sm" data-delete-leave="${l.id}" type="button">Delete</button>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>`}
        </div>
      </div>`;
  }

  function renderLeaveApprovals(user) {
    const roleKey = Store.roleToApprovalKey(user.role);
    const leaves = Store.getLeaves()
      .filter(l => Store.isLeaveActive(l) && l.status === 'Pending')
      .filter(l => !Store.isOwnLeave(l, user))
      .filter(l => {
        if (!roleKey) return false;
        return Store.normalizeApprovals(l.approvals)[roleKey] !== 'N/A';
      });

    return `
      <div class="panel">
        <div class="panel-header">
          <h3>Pending Approvals</h3>
          
        </div>
        <div class="panel-body">
          ${leaves.length === 0 ? '<div class="empty-state"><p>No leave requests awaiting approval.</p></div>' : `
            <div class="leave-grid">
              ${leaves.map(l => {
                const canAct = roleKey && Store.canApproveAtStep(l.approvals, roleKey, l);
                const waiting = roleKey && !canAct && Store.normalizeApprovals(l.approvals)[roleKey] === 'Pending';
                const initials = (l.employeeName || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                return `
                <div class="leave-card leave-card-approval">
                  <div class="leave-card-employee">
                    <span class="leave-employee-avatar">${initials}</span>
                    <div>
                      <div class="leave-employee-name">${l.employeeName || 'Unknown Employee'}</div>
                    </div>
                  </div>
                  <div class="leave-card-header">
                    ${leaveTypeBadge(l.leaveType)}
                    ${statusBadge(l.status)}
                  </div>
                  <div class="leave-card-dates">${formatDate(l.fromDate)} – ${formatDate(l.toDate)} (${l.numberOfDays} day${l.numberOfDays > 1 ? 's' : ''})</div>
                  <div class="leave-card-reason">${l.reason}</div>
                  ${l.documents?.length ? `<div class="doc-download-list" style="margin-top:0.5rem">
                    ${l.documents.map((doc, i) => {
                      const name = typeof doc === 'string' ? doc.split('/').pop() : `Doc ${i + 1}`;
                      return `<button class="btn btn-secondary btn-sm doc-download-btn" type="button" data-download-leave-doc="${l.id}" data-doc-index="${i}">📥 ${name}</button>`;
                    }).join('')}
                  </div>` : ''}
                  <div class="approval-section">
                    <p class="approval-title">Approval Stages</p>
                    ${renderApprovalBoxes(l.approvals)}
                  </div>
                  <div class="leave-card-actions">
                    ${canAct ? `
                      <button class="btn btn-success btn-sm" data-approve-step="${l.id}" type="button">Approve</button>
                      <button class="btn btn-danger btn-sm" data-reject-step="${l.id}" type="button">Reject</button>
                    ` : waiting ? '<span class="text-muted">Awaiting prior approval</span>' : '<span class="text-muted">No action required</span>'}
                  </div>
                </div>`;
              }).join('')}
            </div>`}
        </div>
      </div>`;
  }

  function renderPayroll(user, subPage) {
    const role = effectiveRole(user.role);
    const targetSub = subPage || getDefaultSub('payroll', user);

    if (targetSub === 'list') {
      if (!canAccess(user, 'payroll.list')) {
        return `<div class="locked-panel"><div class="locked-icon">🔒</div><h3>Payroll List Locked</h3><p>Only HR and Admin can view the full payroll list.</p></div>`;
      }
      return renderPayrollList(user);
    }
    if (targetSub === 'tax-form') {
      return renderTaxForms(user);
    }
    return renderDownloadPayslip(user);
  }

  function renderTaxForms(user) {
    const role = effectiveRole(user.role);
    const isPrivileged = role === 'ca' || role === 'admin';
    const taxForms = Store.getTaxForms().filter(f => isPrivileged || Store.sameEmployeeId(f.employeeId, user.employeeId));
    
    return `
      <div class="panel">
        <div class="panel-header">
          <h3>Tax Forms & Declarations</h3>
          <div class="header-actions">
            ${isPrivileged ? '<button class="btn btn-primary btn-sm" id="btn-upload-form16">+ Upload Form 16</button>' : ''}
            ${role === 'employee' ? '<button class="btn btn-primary btn-sm" id="btn-upload-tax-decl">+ Upload Tax Declaration</button>' : ''}
          </div>
        </div>
        <div class="panel-body" style="padding:0">
          <table class="data-table">
            <thead><tr><th>Financial Year</th><th>Document Type</th>${isPrivileged ? '<th>Employee</th>' : ''}<th>Status</th><th>Action</th></tr></thead>
            <tbody>
              ${taxForms.length === 0 ? `<tr><td colspan="${isPrivileged ? 5 : 4}" style="text-align:center;padding:2rem;color:var(--text-muted)">No tax documents available</td></tr>` : 
              taxForms.map(f => `
                <tr>
                  <td>${f.financialYear}</td>
                  <td>${f.documentType}</td>
                  ${isPrivileged ? `<td><strong>${f.employeeName}</strong></td>` : ''}
                  <td><span class="badge ${f.status === 'Available' || f.status === 'Approved' ? 'badge-approved' : 'badge-pending'}">${f.status}</span></td>
                  <td><button class="btn btn-primary btn-sm" data-download-tax-form="${f.id}" type="button">Download</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  function renderDownloadPayslip(user) {
    let payrolls = Store.getPayrolls().filter(p =>
      (canAccess(user, 'payroll.list') || Store.sameEmployeeId(p.employeeId, user.employeeId)) && 
      p.type === 'payslip'
    );

    // For non-admin/HR/CA, limit to last 6 months based on payroll month
    if (!canAccess(user, 'payroll.list')) {
      const parseMonth = (mStr) => {
        const [m, y] = mStr.split(' ');
        const idx = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].indexOf(m);
        return new Date(parseInt(y), idx, 1);
      };

      payrolls = payrolls
        .sort((a, b) => parseMonth(b.month) - parseMonth(a.month))
        .slice(0, 6);
    }

    return `
      <div class="panel">
        <div class="panel-header"><h3>Download Payslip</h3></div>
        <div class="panel-body" style="padding:0">
          <table class="data-table">
            <thead><tr><th>Month</th><th>Gross (₹)</th><th>Net (₹)</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              ${payrolls.length === 0 ? '<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--text-muted)">No payslips available</td></tr>' :
              payrolls.map(p => `
                <tr>
                  <td><strong>${p.month}</strong></td>
                  <td>${formatRupee(p.gross)}</td>
                  <td>${formatRupee(p.net)}</td>
                  <td><span class="badge ${p.status === 'Paid' ? 'badge-approved' : 'badge-pending'}">${p.status}</span></td>
                  <td><button class="btn btn-primary btn-sm" data-download-payslip="${p.id}" type="button">Download PDF</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  function renderPayrollList(user) {
    const payrolls = Store.getPayrolls().filter(p => p.type === 'payslip');
    const isCA = effectiveRole(user?.role) === 'ca';
    return `
      <div class="panel">
        <div class="panel-header">
          <h3>Payroll List</h3>
          <button class="btn btn-primary btn-sm" type="button" id="btn-process-payroll">+ ${isCA ? 'Upload Payslip' : 'Process Payroll'}</button>
        </div>
        <div class="panel-body" style="padding:0">
          <table class="data-table">
            <thead><tr><th>Employee</th><th>Month</th><th>Gross (₹)</th><th>Net (₹)</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              ${payrolls.map(p => `
                <tr>
                  <td><strong>${p.employeeName}</strong></td>
                  <td>${p.month}</td>
                  <td>${formatRupee(p.gross)}</td>
                  <td>${formatRupee(p.net)}</td>
                  <td><span class="badge ${p.status === 'Paid' ? 'badge-approved' : 'badge-pending'}">${p.status}</span></td>
                  <td><button class="btn btn-primary btn-sm" data-download-payslip="${p.id}" type="button">Download</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  function renderRecruitment(user, subPage) {
    if (subPage === 'pipeline') {
      if (!canAccess(user, 'recruitment.pipeline')) {
        return `<div class="locked-panel"><div class="locked-icon">🔒</div><h3>Recruitment Locked</h3><p>Only HR can access candidate recruitment and tracking.</p></div>`;
      }
      return renderRecruitmentPipeline();
    }
    if (subPage === 'referrals') {
      return renderMyReferrals(user);
    }
    return renderJobPostings(user);
  }

  function renderMyReferrals(user) {
    const myReferrals = Store.getCandidates().filter(c => 
      c.referredBy && c.referredBy.toUpperCase().includes(`(${user.employeeId.toUpperCase()})`)
    );

    return `
      <div class="panel">
        <div class="panel-header">
          <h3>My Referrals</h3>
          <button class="btn btn-primary btn-sm" id="btn-add-referral" type="button">+ Add Referral</button>
        </div>
        <div class="panel-body" style="padding:0">
          <table class="data-table">
            <thead><tr><th>Candidate Name</th><th>Position</th><th>Status</th><th>Submitted On</th><th>Resume</th></tr></thead>
            <tbody>
              ${myReferrals.length === 0 ? '<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--text-muted)">You haven\'t referred anyone yet.</td></tr>' : 
              myReferrals.map(c => `
                <tr>
                  <td><strong>${c.name}</strong></td>
                  <td>${c.job}</td>
                  <td><span class="badge badge-pending">${c.stage}</span></td>
                  <td>${formatDate(c.appliedOn)}</td>
                  <td>${c.resumePath ? `<button class="btn btn-secondary btn-sm" data-download-resume="${c.id}">📥 View</button>` : '—'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  function renderRecruitmentPipeline() {
    const candidates = Store.getCandidates();
    return `
      <div class="panel">
        <div class="panel-header">
          <h3>Recruitment — Candidate Tracking</h3>
          <button class="btn btn-primary btn-sm" id="btn-add-candidate" type="button">+ Add Candidate</button>
        </div>
        <div class="panel-body" style="padding:0">
          <table class="data-table">
            <thead><tr><th>Name</th><th>Position</th><th>Stage</th><th>Applied</th><th>Resume</th></tr></thead>
            <tbody>
              ${candidates.map(c => `
                <tr>
                  <td><strong>${c.name}</strong></td>
                  <td>${c.job}</td>
                  <td><span class="badge badge-pending">${c.stage}</span></td>
                  <td>${formatDate(c.appliedOn)}</td>
                  <td>
                    ${c.resumePath ? `<button class="btn btn-secondary btn-sm" data-download-resume="${c.id}">📥 Download</button>` : '—'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  function renderJobPostings(user) {
    const jobs = Store.getJobs();
    const role = effectiveRole(user.role);
    const canPost = canAccess(user, 'recruitment.post') || role === 'admin';
    const canManage = role === 'admin' || role === 'hr_manager';

    return `
      <div class="panel">
        <div class="panel-header">
          <h3>Job Postings</h3>
          ${canPost ? '<button class="btn btn-primary btn-sm" id="btn-post-job" type="button">+ Post Job</button>' : ''}
        </div>
        <div class="panel-body" style="padding:0">
          <table class="data-table">
            <thead><tr><th>Title</th><th>Department</th><th>Status</th><th>Posted</th><th>Applicants</th><th>Action</th></tr></thead>
            <tbody>
              ${jobs.length === 0 ? '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-muted)">No job postings found</td></tr>' : 
              jobs.map(j => `
                <tr>
                  <td><strong>${j.title}</strong></td>
                  <td>${j.department}</td>
                  <td><span class="badge ${j.status === 'Open' ? 'badge-approved' : 'badge-rejected'}">${j.status}</span></td>
                  <td>${formatDate(j.postedOn)}</td>
                  <td>${j.applicants || 0}</td>
                  <td class="table-actions">
                    <button class="btn btn-secondary btn-sm" data-download-job="${j.id}" type="button">Download PDF</button>
                    ${canManage ? `
                      <button class="btn btn-secondary btn-sm" data-edit-job="${j.id}" type="button">Edit</button>
                      <button class="btn btn-danger btn-sm" data-delete-job="${j.id}" type="button">Delete</button>
                    ` : ''}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  function renderEmployees(user) {
    const employees = Store.getEmployees();
    const total = employees.length;
    const inactiveCount = employees.filter(e => e.status === 'Inactive').length;
    const activeCount = total - inactiveCount;
    const attritionRate = total > 0 ? ((inactiveCount / total) * 100).toFixed(1) : '0.0';

    const canOnboard = canAccess(user, 'employees.onboard');
    const canView = canAccess(user, 'employees.view');
    const canEdit = canAccess(user, 'employees.edit');
    const colSpan = canView ? 8 : 7;

    return `
      <div style="margin-bottom: 1.5rem;">
        <div class="stat-card accent-red" style="width: fit-content; min-width: 280px;">
          <div class="label">Attrition Rate</div>
          <div class="value">${attritionRate}%</div>
          <div class="change">${inactiveCount} employee(s) have left</div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-header">
          <h3>Employee Records</h3>
          ${canOnboard ? '<button class="btn btn-primary btn-sm" id="btn-onboard" type="button">+ Onboard Employee</button>' : ''}
        </div>
        <div class="panel-body" style="padding:0">
          <table class="data-table">
            <thead><tr><th>Name</th><th>Email</th><th>Department</th><th>Role</th><th>Join Date</th><th>BGV</th><th>Status</th>${canView ? '<th>Actions</th>' : ''}</tr></thead>
            <tbody>
              ${employees.length === 0 ? `<tr><td colspan="${colSpan}"><div class="empty-state"><p>No employees yet</p></div></td></tr>` : employees.map(e => `
                <tr>
                  <td><strong>${e.name}</strong></td>
                  <td>${e.officeMail || e.email}</td>
                  <td>${e.department}</td>
                  <td>${formatRoleName(e.role)}</td>
                  <td>${formatDate(e.joinDate)}</td>
                  <td>${e.bgv ? '<span class="badge badge-approved">Done</span>' : '<span class="badge badge-pending">Pending</span>'}</td>
                  <td><span class="badge badge-approved">${e.status}</span></td>
                  ${canView ? `<td class="table-actions">
                    <button class="btn btn-secondary btn-sm" type="button" data-view-employee="${e.id}">View</button>
                    ${canEdit ? `<button class="btn btn-secondary btn-sm" type="button" data-edit-employee="${e.id}">Edit</button>` : ''}
                  </td>` : ''}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  function renderPerformance(user) {
    const goals = Store.getPerformance();
    const templates = Store.getPerfTemplates();
    const role = effectiveRole(user.role);
    
    if (!['admin', 'hr_manager', 'reporting_manager'].includes(role)) {
      return `<div class="locked-panel"><div class="locked-icon">🔒</div><h3>Access Restricted</h3><p>Performance reviews are only accessible by HR and Reporting Managers.</p></div>`;
    }

    const isHR = role === 'admin' || role === 'hr_manager';
    const isManager = role === 'reporting_manager';

    return `
      <div class="panel" style="margin-bottom: 2rem;">
        <div class="panel-header">
          <h3>Performance Templates</h3>
          <div class="header-actions">
            ${isHR ? '<button class="btn btn-secondary btn-sm" id="btn-upload-perf-template" type="button">Upload Template</button>' : ''}
            ${isManager ? '<button class="btn btn-primary btn-sm" id="btn-set-performance" type="button">Set Performance Record</button>' : ''}
          </div>
        </div>
        <div class="panel-body">
          ${templates.length === 0 ? '<div class="empty-state"><p>No templates available.</p></div>' : `
            <div class="card-grid">
              ${templates.map(t => `
                <div class="info-card" style="display:flex; justify-content:space-between; align-items:center;">
                  <div style="flex:1">
                    <h4 style="margin:0">${t.name}</h4>
                    <p class="form-hint" style="margin:0">Uploaded by ${t.createdBy || 'Admin'}</p>
                  </div>
                  <button class="btn btn-secondary btn-sm" data-download-perf-template="${t.id}" type="button">📥 Download PDF</button>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>

      ${(isManager || isHR) && goals.length > 0 ? `
      <div class="panel">
        <div class="panel-header" style="display: flex; flex-direction: column; align-items: center; text-align: center; padding: 1.5rem 1rem;">
          <h3 style="margin: 0 auto; width: 100%; text-align: center;">Employee Goals & Reviews</h3>
          <p class="form-hint" style="margin-top: 0.25rem;">Performance Assessment & Probation Tracking</p>
        </div>
        <div class="panel-body">
          <div class="card-grid">
            ${goals.map(g => `
              <div class="info-card">
                <h4 style="margin: 0;">${g.employeeName}</h4>
                <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.75rem;">ID: ${g.employeeId || '—'}</div>
                <p>${g.goal}</p>
                ${g.probationPeriod ? `<p style="font-size: 0.8rem; margin-top: 0.5rem; color: var(--text-muted);"><strong>Probation:</strong> ${g.probationPeriod}</p>` : ''}
                <p style="margin-top:0.5rem;font-size:0.75rem;color:var(--text-muted)">Reviewer: ${g.reviewer}</p>
                <div class="table-actions" style="margin-top: 1rem; padding-top: 0.5rem; border-top: 1px solid var(--border);">
                  ${(g.reviewFilePath || g.reviewPath) ? `<button class="btn btn-secondary btn-sm" data-view-perf-review="${g.id}" type="button" style="width: 100%;">📥 Download Review PDF</button>` : '<p class="form-hint" style="text-align:center; width:100%;">No review file uploaded</p>'}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>` : ''}`;
  }

  function renderReports() {
    const employees = Store.getEmployees();
    const leaves = Store.getLeaves();
    const jobs = Store.getJobs();

    const total = employees.length;
    const inactiveCount = employees.filter(e => e.status === 'Inactive').length;
    const attritionRate = total > 0 ? ((inactiveCount / total) * 100).toFixed(1) : '0.0';

    const bars = [
      { label: 'Jan', h: 60 }, { label: 'Feb', h: 75 }, { label: 'Mar', h: 55 },
      { label: 'Apr', h: 90 }, { label: 'May', h: 80 }, { label: 'Jun', h: 95 }
    ];
    return `
      <div class="stats-grid">
        <div class="stat-card accent-blue"><div class="label">Headcount</div><div class="value">${employees.length}</div></div>
        <div class="stat-card accent-amber"><div class="label">Leave Requests (YTD)</div><div class="value">${leaves.length}</div></div>
        <div class="stat-card accent-green"><div class="label">Open Positions</div><div class="value">${jobs.filter(j => j.status === 'Open').length}</div></div>
        <div class="stat-card accent-red"><div class="label">Attrition Rate</div><div class="value">${attritionRate}%</div></div>
      </div>
      <div class="panel">
        <div class="panel-header"><h3>KPI / HR Reports</h3></div>
        <div class="panel-body">
          <div class="chart-bars">
            ${bars.map(b => `
              <div class="chart-bar-wrap">
                <div class="chart-bar" style="height:${b.h}%"></div>
                <span>${b.label}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>`;
  }

  const PAGE_TITLES = {
    dashboard: 'Main Dashboard',
    leave: 'Leave Request',
    employees: 'Employees',
    recruitment: 'Recruitment',
    payroll: 'Payroll',
    performance: 'Performance',
    reports: 'Reports & Analytics'
  };

  const DEFAULT_SUB = {
    leave: 'apply',
    payroll: 'payslip',
    recruitment: 'jobs'
  };

  function render(page, user, subPage) {
    const sp = subPage || getDefaultSub(page, user);
    const subTabs = ['leave', 'payroll', 'recruitment'].includes(page)
      ? renderSubTabs(page, user, sp)
      : '';

    let content = '';
    switch (page) {
      case 'dashboard': content = renderDashboard(user); break;
      case 'leave': content = renderLeave(user, sp); break;
      case 'employees': content = renderEmployees(user); break;
      case 'recruitment': content = renderRecruitment(user, sp); break;
      case 'payroll': content = renderPayroll(user, sp); break;
      case 'performance': content = renderPerformance(user); break;
      case 'reports': content = renderReports(); break;
      default: content = renderDashboard(user);
    }

    return subTabs + content;
  }

  return {
    icons, ROLE_NAV, PAGE_TITLES, DEFAULT_SUB, PERMS,
    render, canAccess, getDefaultSub, isLeaveApprover, formatDate, formatRupee, formatRoleName, statusBadge, leaveTypeBadge, renderApprovalBoxes
  };
})();
