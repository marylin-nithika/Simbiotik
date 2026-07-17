const Store = (() => {
  const KEYS = {
    user: 'hrms_user',
    leaves: 'hrms_leaves',
    employees: 'hrms_employees',
    jobs: 'hrms_jobs',
    candidates: 'hrms_candidates',
    payrolls: 'hrms_payrolls',
    grievances: 'hrms_grievances',
    performance: 'hrms_performance',
    taxForms: 'hrms_tax_forms',
    perfTemplates: 'hrms_perf_templates',
    feedbacks: 'hrms_feedbacks',
    attendance: 'hrms_attendance',
    dashboard: 'hrms_dashboard',
    timesheet: 'hrms_timesheet',
    timesheetError: 'hrms_timesheet_error',
    timesheetHistory: 'hrms_timesheet_history',
    teamTimesheets: 'hrms_team_timesheets',
    allTimesheets: 'hrms_all_timesheets'
  };

  const APPROVAL_STEPS = [
    { key: 'reporting_manager', label: 'Reporting Manager' },
    { key: 'project_manager', label: 'Project Manager' },
    { key: 'hr', label: 'HR' },
    { key: 'admin', label: 'Admin' }
  ];

  const APPROVAL_ORDER = ['reporting_manager', 'project_manager', 'hr', 'admin'];

  function load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  }

  function save(key, data) { localStorage.setItem(key, JSON.stringify(data)); }

  function normalizeApplicantRole(role) {
    if (role === 'manager') return 'reporting_manager';
    return role || 'employee';
  }

  function toPlainApprovals(approvals) {
    if (!approvals) return {};
    if (typeof approvals.toObject === 'function') return approvals.toObject();
    if (approvals._doc && typeof approvals._doc === 'object') return { ...approvals._doc };
    return { ...approvals };
  }

  function normalizeApprovals(approvals) {
    const plain = toPlainApprovals(approvals);
    return {
      reporting_manager: plain.reporting_manager ?? plain.manager ?? 'Pending',
      project_manager: plain.project_manager ?? 'Pending',
      hr: plain.hr ?? 'Pending',
      admin: plain.admin ?? 'N/A'
    };
  }

  function sameEmployeeId(a, b) {
    if (!a || !b) return false;
    return String(a).toUpperCase() === String(b).toUpperCase();
  }

  function isOwnLeave(leave, user) {
    if (!leave || !user) return false;
    const leaveEmail = (leave.applicantEmail || '').toLowerCase().trim();
    const userEmail = (user.email || '').toLowerCase().trim();
    if (leaveEmail && userEmail) return leaveEmail === userEmail;
    return sameEmployeeId(leave.employeeId, user.employeeId);
  }

  function isLeaveDeleted(leave) {
    return leave?.status === 'Deleted';
  }

  function isLeaveActive(leave) {
    return leave && !isLeaveDeleted(leave);
  }

  function buildApprovalsForRole(applicantRole) {
    const role = normalizeApplicantRole(applicantRole);
    const approvals = {
      reporting_manager: 'N/A',
      project_manager: 'N/A',
      hr: 'N/A',
      admin: 'N/A'
    };

    if (role === 'employee') {
      approvals.reporting_manager = 'Pending';
      approvals.project_manager = 'Pending';
      approvals.hr = 'Pending';
    } else if (role === 'reporting_manager') {
      approvals.project_manager = 'Pending';
      approvals.hr = 'Pending';
    } else if (role === 'project_manager') {
      approvals.hr = 'Pending';
    } else if (role === 'hr_manager') {
      approvals.admin = 'Pending';
    }

    return approvals;
  }

  function defaultApprovals() {
    return buildApprovalsForRole('employee');
  }

  function getActiveApprovalSteps(approvals) {
    const a = normalizeApprovals(approvals);
    return APPROVAL_ORDER.filter(key => a[key] !== 'N/A');
  }

  function roleToApprovalKey(role) {
    if (role === 'admin') return 'admin';
    if (role === 'hr_manager') return 'hr';
    if (role === 'reporting_manager' || role === 'manager') return 'reporting_manager';
    if (role === 'project_manager') return 'project_manager';
    if (role === 'ca') return 'ca';
    return null;
  }

  function canApproveAtStep(approvals, roleKey, leave) {
    if (leave && isLeaveDeleted(leave)) return false;
    const a = normalizeApprovals(approvals);
    if (a[roleKey] !== 'Pending') return false;
    const active = getActiveApprovalSteps(approvals);
    const idx = active.indexOf(roleKey);
    if (idx < 0) return false;
    for (let i = 0; i < idx; i++) {
      if (a[active[i]] !== 'Approved') return false;
    }
    return true;
  }

  function isFullyApproved(leave) {
    if (isLeaveDeleted(leave) || leave.status === 'Rejected') return false;
    const a = normalizeApprovals(leave.approvals);
    return getActiveApprovalSteps(leave.approvals).every(key => a[key] === 'Approved');
  }

  function getUser() { return load(KEYS.user, null); }
  function setUser(user) { save(KEYS.user, user); }
  function clearUser() { localStorage.removeItem(KEYS.user); }

  function getLeaves() { return load(KEYS.leaves, []); }
  function setLeaves(data) { save(KEYS.leaves, data); }
  function addLeave(leave) {
    const item = { ...leave, approvals: normalizeApprovals(leave.approvals), status: leave.status || 'Pending' };
    const leaves = getLeaves();
    leaves.unshift(item);
    save(KEYS.leaves, leaves);
    return item;
  }
  function updateLeave(id, updates) {
    save(KEYS.leaves, getLeaves().map(l => l.id === id ? { ...l, ...updates } : l));
  }
  function approveLeaveStep(id, role, decision) {
    const roleKey = roleToApprovalKey(role);
    if (!roleKey) return;
    const leaves = getLeaves().map(l => {
      if (l.id !== id) return l;
      if (!canApproveAtStep(l.approvals, roleKey, l)) return l;
      const approvals = { ...normalizeApprovals(l.approvals), [roleKey]: decision };
      const allApproved = getActiveApprovalSteps(approvals).every(key => approvals[key] === 'Approved');
      const anyRejected = getActiveApprovalSteps(approvals).some(key => approvals[key] === 'Rejected');
      return { ...l, approvals, status: anyRejected ? 'Rejected' : allApproved ? 'Approved' : 'Pending' };
    });
    save(KEYS.leaves, leaves);
  }
  function softDeleteLeave(id) {
    const leaves = getLeaves().map(l => {
      if (l.id !== id) return l;
      const approvals = { ...normalizeApprovals(l.approvals) };
      Object.keys(approvals).forEach(key => {
        if (approvals[key] === 'Pending') approvals[key] = 'Cancelled';
      });
      return {
        ...l,
        status: 'Deleted',
        deletedAt: new Date().toISOString(),
        approvals
      };
    });
    save(KEYS.leaves, leaves);
  }

  function getEmployees() { return load(KEYS.employees, []); }
  function setEmployees(data) { save(KEYS.employees, data); }
  function addEmployee(emp) { getEmployees().push(emp); save(KEYS.employees, getEmployees()); }

  function getJobs() { return load(KEYS.jobs, []); }
  function setJobs(data) { save(KEYS.jobs, data); }
  function addJob(job) { const list = getJobs(); list.unshift(job); save(KEYS.jobs, list); }
  function updateJob(id, updates) {
    save(KEYS.jobs, getJobs().map(j => j.id === id ? { ...j, ...updates } : j));
  }
  function deleteJob(id) {
    save(KEYS.jobs, getJobs().filter(j => j.id !== id));
  }

  function getCandidates() { return load(KEYS.candidates, []); }
  function setCandidates(data) { save(KEYS.candidates, data); }
  function addCandidate(c) { const list = getCandidates(); list.unshift(c); save(KEYS.candidates, list); }

  function getPayrolls() { return load(KEYS.payrolls, []); }
  function setPayrolls(data) { save(KEYS.payrolls, data); }

  function normalizeGrievance(grievance) {
    if (!grievance) return grievance;
    const id = grievance.id || grievance._id || grievance.grievanceId;
    return {
      ...grievance,
      id: id ? String(id) : undefined,
      _id: grievance._id || (id ? String(id) : undefined)
    };
  }

  function getGrievances() { return (load(KEYS.grievances, []) || []).map(normalizeGrievance); }
  function setGrievances(data) { save(KEYS.grievances, (Array.isArray(data) ? data : []).map(normalizeGrievance)); }
  function addGrievance(grievance) { const list = getGrievances(); list.unshift(normalizeGrievance(grievance)); save(KEYS.grievances, list); }
  function updateGrievance(id, updates) { save(KEYS.grievances, getGrievances().map(g => (g.id === id || g._id === id) ? normalizeGrievance({ ...g, ...updates }) : g)); }
  function getGrievanceById(id) { return getGrievances().find(g => g.id === id || g._id === id); }

  function getTaxForms() { return load(KEYS.taxForms, []); }
  function setTaxForms(data) { save(KEYS.taxForms, data); }

  function getPerformance() { return load(KEYS.performance, []); }
  function setPerformance(data) { save(KEYS.performance, data); }
  function getPerfTemplates() { return load(KEYS.perfTemplates, []); }
  function setPerfTemplates(data) { save(KEYS.perfTemplates, data); }
  function addPerformance(p) { getPerformance().push(p); save(KEYS.performance, getPerformance()); }
  function updatePerformance(id, updates) {
    save(KEYS.performance, getPerformance().map(p => p.id === id ? { ...p, ...updates } : p));
  }

  function getFeedbacks() { return load(KEYS.feedbacks, []); }
  function setFeedbacks(data) { save(KEYS.feedbacks, data); }

  function getTimesheet() { return load(KEYS.timesheet, null); }
  function setTimesheet(data) { save(KEYS.timesheet, data); }
  function getTimesheetError() { return load(KEYS.timesheetError, ''); }
  function setTimesheetError(message) { save(KEYS.timesheetError, message || ''); }
  function getTimesheetHistory() { return load(KEYS.timesheetHistory, []); }
  function setTimesheetHistory(data) { save(KEYS.timesheetHistory, data); }
  function getTeamTimesheets() { return load(KEYS.teamTimesheets, []); }
  function setTeamTimesheets(data) { save(KEYS.teamTimesheets, data); }
  function getAllTimesheets() { return load(KEYS.allTimesheets, []); }
  function setAllTimesheets(data) { save(KEYS.allTimesheets, data); }

  function getAttendance() { return load(KEYS.attendance, { present: 0, absent: 0, onLeave: 0 }); }

  function getDashboard() { return load(KEYS.dashboard, null); }
  function setDashboard(data) { save(KEYS.dashboard, data); }

  function computeLeaveBalance(userId) {
    const leaves = getLeaves().filter(l => sameEmployeeId(l.employeeId, userId) && isFullyApproved(l));
    let sickUsed = 0, annualUsed = 0;
    for (const l of leaves) {
      const days = l.numberOfDays || 1;
      if (l.leaveType === 'sick') sickUsed += days;
      else annualUsed += days;
    }
    const sickTotal = 6, annualTotal = 18;
    return {
      sick: { total: sickTotal, used: sickUsed, remaining: Math.max(0, sickTotal - sickUsed) },
      annual: { total: annualTotal, used: annualUsed, remaining: Math.max(0, annualTotal - annualUsed) }
    };
  }

  function uid(prefix) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }

  function clearAllData() {
    Object.values(KEYS).forEach(k => { if (k !== KEYS.user) localStorage.removeItem(k); });
  }

  return {
    getUser, setUser, clearUser, clearAllData,
    getLeaves, setLeaves, addLeave, updateLeave, approveLeaveStep, softDeleteLeave,
    isFullyApproved, isOwnLeave, isLeaveDeleted, isLeaveActive, sameEmployeeId, defaultApprovals, buildApprovalsForRole,
    normalizeApprovals, canApproveAtStep, getActiveApprovalSteps, roleToApprovalKey, APPROVAL_STEPS,
    getEmployees, setEmployees, addEmployee, updateJob, deleteJob,
    getJobs, setJobs, addJob,
    getCandidates, setCandidates, addCandidate,
    getPayrolls, setPayrolls,
    getGrievances, setGrievances, addGrievance, updateGrievance, getGrievanceById,
    getTaxForms, setTaxForms,
    getPerformance, setPerformance, addPerformance, getPerfTemplates, setPerfTemplates,
    getFeedbacks, setFeedbacks,
    getTimesheet, setTimesheet, getTimesheetError, setTimesheetError, getTimesheetHistory, setTimesheetHistory, getTeamTimesheets, setTeamTimesheets, getAllTimesheets, setAllTimesheets,
    getAttendance, getDashboard, setDashboard, computeLeaveBalance, uid
  };
})();
