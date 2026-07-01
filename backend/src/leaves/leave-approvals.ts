const APPROVAL_ORDER = ['reporting_manager', 'project_manager', 'hr', 'admin'] as const;

export type ApprovalKey = typeof APPROVAL_ORDER[number];
export type ApprovalMap = Record<ApprovalKey, string>;

export function normalizeApplicantRole(role?: string) {
  if (role === 'manager') return 'reporting_manager';
  return role || 'employee';
}

export function buildApprovalsForRole(applicantRole?: string): ApprovalMap {
  const role = normalizeApplicantRole(applicantRole);
  const approvals: ApprovalMap = {
    reporting_manager: 'N/A',
    project_manager: 'N/A',
    hr: 'N/A',
    admin: 'N/A',
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

export function toPlainApprovals(approvals: unknown): Record<string, string> {
  if (!approvals) return {};
  const obj = approvals as Record<string, unknown> & {
    toObject?: () => Record<string, string>;
    _doc?: Record<string, string>;
  };
  if (typeof obj.toObject === 'function') return obj.toObject();
  if (obj._doc && typeof obj._doc === 'object') return { ...obj._doc };
  return { ...(approvals as Record<string, string>) };
}

export function normalizeApprovals(approvals: unknown): ApprovalMap {
  const plain = toPlainApprovals(approvals);
  return {
    reporting_manager: plain.reporting_manager ?? plain.manager ?? 'Pending',
    project_manager: plain.project_manager ?? 'Pending',
    hr: plain.hr ?? 'Pending',
    admin: plain.admin ?? 'N/A',
  };
}

export function getActiveApprovalSteps(approvals: unknown) {
  const normalized = normalizeApprovals(approvals);
  return APPROVAL_ORDER.filter((key) => normalized[key] !== 'N/A');
}

export function roleToApprovalKey(role: string): ApprovalKey | null {
  if (role === 'admin') return 'admin';
  if (role === 'hr_manager') return 'hr';
  if (role === 'reporting_manager' || role === 'manager') return 'reporting_manager';
  if (role === 'project_manager') return 'project_manager';
  return null;
}

export const APPROVAL_LABELS: Record<ApprovalKey, string> = {
  reporting_manager: 'Reporting Manager',
  project_manager: 'Project Manager',
  hr: 'HR',
  admin: 'Admin',
};
