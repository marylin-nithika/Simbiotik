const API = (() => {
  const BASE = 'http://localhost:3001/api';

  function authHeader() {
    const user = Store.getUser();
    return user?.token ? { Authorization: `Bearer ${user.token}` } : {};
  }

  function headers() {
    return { 'Content-Type': 'application/json', ...authHeader() };
  }

  function parseError(body, fallback = 'Request failed') {
    if (!body?.message) return fallback;
    return Array.isArray(body.message) ? body.message.join(', ') : body.message;
  }

  async function request(method, path, body, isFormData = false, throwOnError = false) {
    const opts = { method, headers: isFormData ? { ...authHeader() } : headers() };
    if (body) opts.body = isFormData ? body : JSON.stringify(body);

    try {
      const res = await fetch(`${BASE}${path}`, opts);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        const msg = parseError(err, res.statusText);
        if (throwOnError) throw new Error(msg);
        console.warn(`API ${method} ${path} failed:`, msg);
        return null;
      }
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) return res.json();
      return res;
    } catch (e) {
      const msg = e.message === 'Failed to fetch'
        ? 'Cannot reach backend at http://localhost:3001 — start it with: cd backend && npm run start:dev'
        : e.message;
      if (throwOnError) throw new Error(msg);
      console.warn(`API ${method} ${path} failed:`, msg);
      return null;
    }
  }

  return {
    BASE,
    authHeader,
    login: (email, password) => request('POST', '/auth/login', { email, password }, false, true),
    register: (data) => request('POST', '/auth/register', data, false, true),
    createUser: (data) => request('POST', '/auth/users', data, false, true),

    getDashboard: () => request('GET', '/dashboard'),

    getLeaves: () => request('GET', '/leaves'),
    createLeave: (data) => request('POST', '/leaves', data),
    createLeaveWithDocs: (formData) => request('POST', '/leaves', formData, true, true),
    updateLeaveStatus: (id, status) => request('PATCH', `/leaves/${id}/status`, { status }),
    approveLeaveStep: (id, status) => request('PATCH', `/leaves/${id}/approve`, { status }, false, true),
    deleteLeave: (id) => request('DELETE', `/leaves/${id}`),
    getLeaveDocUrl: (id, index) => `${BASE}/leaves/${id}/documents/${index}`,

    getEmployees: () => request('GET', '/employees'),
    getEmployee: (id) => request('GET', `/employees/${id}`),
    createEmployee: (data) => request('POST', '/employees', data, false, true),
    createEmployeeWithDocs: (formData) => request('POST', '/employees', formData, true, true),
    updateEmployeeWithDocs: (id, formData) => request('PATCH', `/employees/${id}`, formData, true, true),
    getEmployeeDocUrl: (id, type, index) => `${BASE}/employees/${id}/documents/${type}/${index}`,

    getJobs: () => request('GET', '/jobs'),
    createJob: (data) => request('POST', '/jobs', data),
    createJobWithPdf: (formData) => request('POST', '/jobs', formData, true, true),
    updateJob: (id, formData) => request('PATCH', `/jobs/${id}`, formData, true, true),
    deleteJob: (id) => request('DELETE', `/jobs/${id}`, null, false, true),
    getJobPdfUrl: (id) => `${BASE}/jobs/${id}/pdf`,

    getCandidates: () => request('GET', '/candidates'),
    createCandidate: (data) => request('POST', '/candidates', data, false, true),
    createCandidateWithResume: (formData) => request('POST', '/candidates', formData, true, true),

    getPayrolls: () => request('GET', '/payroll'),
    createPayroll: (data) => request('POST', '/payroll', data, data instanceof FormData),
    getPayslipUrl: (id) => `${BASE}/payroll/${id}/payslip`,

    getTaxForms: () => request('GET', '/payroll/tax-forms'),
    uploadTaxForm: (formData) => request('POST', '/payroll/tax-forms', formData, true, true),
    getTaxFormDownloadUrl: (id) => `${BASE}/payroll/tax-forms/${id}/download`,

    getPerformance: () => request('GET', '/performance'),
    createPerformance: (data) => request('POST', '/performance', data, data instanceof FormData, true),
    getPerformanceTemplates: () => request('GET', '/performance/template'),
    uploadPerformanceTemplate: (formData) => request('POST', '/performance/template', formData, true, true),
    uploadPerformanceReview: (id, formData) => request('PATCH', `/performance/${id}/review`, formData, true, true),
    downloadPerformanceTemplateUrl: (id) => `${BASE}/performance/template/${id}/download`,
    getPerformanceReviewUrl: (id) => `${BASE}/performance/${id}/review/download`,

    getFeedbacks: () => request('GET', '/performance/feedback'),
    addFeedback: (data) => request('POST', '/performance/feedback', data),

    isOnline: async () => {
      try {
        const r = await fetch(`${BASE}/health`, { method: 'GET' });
        return r.ok;
      } catch { return false; }
    }
  };
})();
