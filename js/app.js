const App = (() => {
  const LOGO_ALT = 'Simbiotik Solutions';
  const LOGO_CANDIDATES = [
    'simbiotik-logo.png',
    'simbiotik-logo.svg',
    'assets/simbiotik-logo.png',
    'assets/Simbiotik-Solutions.png',
    'assets/logo.png',
    'assets/simbiotik-logo.jpg',
    'assets/simbiotik-logo.svg'
  ];

  let currentPage = 'dashboard';
  let currentSubPage = {};

  function logoUrl(path) {
    try {
      return new URL(path, document.baseURI).href;
    } catch {
      return path;
    }
  }

  function renderBrandLogo(className = 'brand-logo') {
    const src = logoUrl(LOGO_CANDIDATES[0]);
    const fallbacks = LOGO_CANDIDATES.slice(1).map(logoUrl).join('|');
    return `<img src="${src}" alt="${LOGO_ALT}" class="${className}" data-logo-fallbacks="${fallbacks}" />`;
  }

  function bindLogoImages(root = document) {
    root.querySelectorAll('img[data-logo-fallbacks]').forEach((img) => {
      if (img.dataset.logoBound) return;
      img.dataset.logoBound = '1';
      const fallbacks = (img.dataset.logoFallbacks || '').split('|').filter(Boolean);
      img.addEventListener('error', () => {
        if (!fallbacks.length) return;
        img.src = fallbacks.shift();
        img.dataset.logoFallbacks = fallbacks.join('|');
      });
    });
  }

  function normalizeRole(role) {
    return role === 'manager' ? 'reporting_manager' : role;
  }

  function toast(msg, type = 'info') {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    document.getElementById('toast-container').appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }

  function openModal(title, bodyHtml, footerHtml, sizeClass = '') {
    const overlay = document.getElementById('modal-overlay');
    const content = document.getElementById('modal-content');
    content.className = `modal ${sizeClass}`.trim();
    content.innerHTML = `
      <div class="modal-header">
        <h3>${title}</h3>
        <button class="btn-icon" id="modal-close" type="button" aria-label="Close">✕</button>
      </div>
      <div class="modal-body">${bodyHtml}</div>
      ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}`;
    overlay.classList.remove('hidden');
    document.getElementById('modal-close')?.addEventListener('click', closeModal);
  }

  function closeModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
  }

  function isPdfFile(f) {
    if (!f) return false;
    return f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');
  }

  function escAttr(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  async function downloadWithAuth(url, filename) {
    try {
      const res = await fetch(url, { headers: API.authHeader() });
      if (!res.ok) throw new Error('Download failed');
      
      // Determine actual content type from headers
      const contentType = res.headers.get('Content-Type') || '';
      const isPdf = contentType.includes('application/pdf');
      
      // Adjust filename extension if the server sent a text fallback
      let finalFilename = filename || 'document.pdf';
      if (!isPdf && finalFilename.toLowerCase().endsWith('.pdf')) {
        finalFilename = finalFilename.slice(0, -4) + '.txt';
      }

      const blob = await res.blob();
      const a = document.createElement('a');
      const objectUrl = URL.createObjectURL(blob);
      a.href = objectUrl;
      a.download = finalFilename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
      }, 100);
    } catch (e) {
      toast(e.message, 'error');
    }
  }

  function computeDays(from, to) {
    const start = new Date(from);
    const end = new Date(to);
    if (isNaN(start) || isNaN(end) || end < start) return 0;
    return Math.ceil((end - start) / 86400000) + 1;
  }

  function getSubPage(page,user) {
    if (currentSubPage[page]) return currentSubPage[page];
    return Modules.getDefaultSub(page, Store.getUser());
  }

  function renderLogin() {
    return `
      <style>
        .login-hero {
          position: relative;
          overflow: hidden;
          background: #0f172a;
        }
        /* Animated Liquid Mesh Background */
        .login-hero::before {
          content: '';
          position: absolute;
          top: -50%; left: -50%; width: 200%; height: 200%;
          background: radial-gradient(circle at center, #1e293b 0%, transparent 50%),
                      radial-gradient(circle at 20% 30%, #0ea5e9 0%, transparent 30%),
                      radial-gradient(circle at 80% 70%, #4338ca 0%, transparent 30%);
          animation: rotateMesh 20s linear infinite;
          z-index: 0;
        }
        /* Glass Sweep Reflection */
        .login-hero::after {
          content: '';
          position: absolute;
          top: 0; left: -150%; width: 50%; height: 100%;
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.05), transparent);
          transform: skewX(-25deg);
          animation: glassSweep 6s Math.random() ease-in-out infinite;
          z-index: 1;
        }
        @keyframes rotateMesh {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes glassSweep {
          0% { left: -150%; }
          20%, 100% { left: 150%; }
        }
        @keyframes floatHero {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes logoEntrance {
          0% { opacity: 0; transform: scale(0.9) translateY(20px); filter: blur(10px) brightness(2); }
          100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0) brightness(1); }
        }
        @keyframes taglineReveal {
          from { opacity: 0; letter-spacing: 5px; filter: blur(5px); }
          to { opacity: 0.8; letter-spacing: 2px; filter: blur(0); }
        }
        .login-hero-inner { 
          position: relative; z-index: 2;
          animation: floatHero 6s ease-in-out infinite; 
        }
        .brand-logo-hero { animation: logoEntrance 1.5s cubic-bezier(0.22, 1, 0.36, 1); }
        .login-hero-tagline { 
          animation: taglineReveal 2s ease-out forwards; 
          animation-delay: 0.5s; opacity: 0; 
        }
        .login-card { animation: slideInRight 0.8s ease-out; }
      </style>
      <div class="login-page">
        <aside class="login-hero">
          <div class="login-hero-pattern" aria-hidden="true"></div>
          <div class="login-hero-inner">
            ${renderBrandLogo('brand-logo-hero')}
            <p class="login-hero-tagline">Human Resources Portal</p>
          </div>
        </aside>
        <div class="login-form-panel">
          <div class="login-card">
            <div id="login-panel">
              <h2>Welcome back</h2>
              <p class="subtitle">Sign in to manage your workforce</p>
              <form id="login-form">
                <div class="form-group">
                  <label for="email">Email</label>
                  <input type="email" id="email" name="email" placeholder="name@simbiotiktech.com" required />
                </div>
                <div class="form-group">
                  <label for="password">Password</label>
                  <input type="password" id="password" name="password" placeholder="••••••••" required />
                </div>
                <button class="btn btn-primary" type="submit">Sign In</button>
              </form>
              <button class="btn btn-link" id="show-setup" type="button">First time? Create admin account</button>
            </div>

            <div id="setup-panel" class="hidden">
              <h2>First-time setup</h2>
              <p class="subtitle">Create the first admin account (only when database is empty)</p>
              <form id="setup-form">
                <div class="form-group">
                  <label for="setup-name">Full name</label>
                  <input type="text" id="setup-name" required />
                </div>
                <div class="form-group">
                  <label for="setup-email">Office email</label>
                  <input type="email" id="setup-email" placeholder="admin@simbiotiktech.com" required />
                </div>
                <div class="form-group">
                  <label for="setup-gmail">Personal Gmail</label>
                  <input type="email" id="setup-gmail" placeholder="admin@gmail.com" required />
                </div>
                <div class="form-group">
                  <label for="setup-employeeId">Employee ID</label>
                  <input type="text" id="setup-employeeId" placeholder="SG00001" required />
                </div>
                <div class="form-group">
                  <label for="setup-password">Password</label>
                  <input type="password" id="setup-password" minlength="6" required />
                </div>
                <button class="btn btn-primary" type="submit">Create Admin & Sign In</button>
              </form>
              <button class="btn btn-link" id="show-login" type="button">← Back to sign in</button>
            </div>
          </div>
        </div>
      </div>`;
  }

  function renderApp(user) {
    const role = normalizeRole(user.role);
    const nav = Modules.ROLE_NAV[role] || Modules.ROLE_NAV.employee;
    const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2);

    return `
      <div class="app-layout">
        <aside class="sidebar">
          <div class="sidebar-brand">
            ${renderBrandLogo('brand-logo-sidebar')}
          </div>
          <div class="sidebar-user">
            <div class="avatar">${initials}</div>
            <div class="sidebar-user-info">
              <div class="name">${user.name}</div>
              <div class="role">${Modules.formatRoleName(role)}</div>
            </div>
          </div>
          <nav class="sidebar-nav">
            <div class="nav-section-label">Modules</div>
            ${nav.map(item => `
              <button class="nav-item ${currentPage === item.id ? 'active' : ''}" data-page="${item.id}" type="button">
                ${Modules.icons[item.icon] || ''}
                ${item.label}
              </button>
            `).join('')}
          </nav>
          <div class="sidebar-footer">
            <button class="nav-item" id="btn-logout" type="button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Logout
            </button>
          </div>
        </aside>
        <div class="main-content">
          <header class="topbar">
            <div class="topbar-brand">${renderBrandLogo('brand-logo-topbar')}</div>
            <h2>${Modules.PAGE_TITLES[currentPage] || 'Dashboard'}</h2>
            <div class="topbar-actions">
              <span style="font-size:0.85rem;color:var(--text-muted)">${new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </header>
          <main class="page-content" id="page-content">
            ${Modules.render(currentPage, user, getSubPage(currentPage,user))}
          </main>
        </div>
      </div>`;
  }

  async function syncFromApi() {
    const online = await API.isOnline();
    if (!online) {
      toast('Cannot connect to backend. Start MongoDB and run npm run start:dev in backend/', 'error');
      return;
    }

    const user = Store.getUser();
    const canEmployees = Modules.canAccess(user, 'employees.view');
    const canRecruitment = Modules.canAccess(user, 'recruitment.pipeline');

    const [leaves, employees, jobs, candidates, payrolls, taxForms, performance, templates, dashboard] = await Promise.all([
      API.getLeaves(),
      canEmployees ? API.getEmployees() : Promise.resolve(null),
      API.getJobs(),
      API.getCandidates(), // Fetch candidates for everyone; backend handles filtering
      API.getPayrolls(), // Fetch payrolls for everyone; backend handles filtering
      API.getTaxForms(), // Fetch tax forms for everyone; backend handles filtering
      API.getPerformance(),
      API.getPerformanceTemplates(),
      API.getDashboard()
    ]);
    if (leaves) Store.setLeaves(leaves);
    if (dashboard) Store.setDashboard(dashboard);
    if (employees) Store.setEmployees(employees);
    if (jobs) Store.setJobs(jobs);
    if (candidates) Store.setCandidates(candidates);
    if (payrolls) Store.setPayrolls(payrolls);
    if (taxForms) Store.setTaxForms(taxForms);
    if (performance) Store.setPerformance(performance);
    if (templates) Store.setPerfTemplates(templates);
  }

  function render() {
    const user = Store.getUser();
    const app = document.getElementById('app');
    app.innerHTML = user ? renderApp(user) : renderLogin();
    bindLogoImages(app);
    bindEvents();
    if (user) syncFromApi().then(() => {
      if (Store.getUser()) {
        document.getElementById('page-content').innerHTML =
          Modules.render(currentPage, user, getSubPage(currentPage, user));
        bindPageEvents(user);
      }
    });
  }

  function navigate(page, subPage) {
    currentPage = page;
    if (subPage) currentSubPage[page] = subPage;
    render();
  }

  function showLeaveForm(user) {
    const balances = Store.computeLeaveBalance(user.employeeId);
    const today = new Date().toISOString().split('T')[0];

    openModal('Apply Leave', `
      <form id="leave-form">
        <div class="form-group">
          <label for="leaveType">Leave Type</label>
          <select id="leaveType" name="leaveType" required>
            <option value="" disabled selected hidden>Select type</option>
            <option value="sick" ${balances.sick.remaining <= 0 ? 'disabled' : ''}>Sick Leave (${balances.sick.remaining} left)</option>
            <option value="annual" ${balances.annual.remaining <= 0 ? 'disabled' : ''}>Annual Leave (${balances.annual.remaining} left)</option>
          </select>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="fromDate">From Date</label>
            <input type="date" id="fromDate" name="fromDate" min="${today}" required />
          </div>
          <div class="form-group">
            <label for="toDate">To Date</label>
            <input type="date" id="toDate" name="toDate" min="${today}" required />
          </div>
        </div>
        <div id="days-summary" class="form-hint"></div>
        <div class="form-group">
          <label for="reason">Reason</label>
          <textarea id="reason" name="reason" rows="3" placeholder="Describe your leave reason" required></textarea>
        </div>
        <div id="medical-docs-section" class="form-group hidden">
          <label>Medical Documents <span class="required">*</span></label>
          <p class="form-hint warn">Sick leave exceeding 2 days requires medical documents.</p>
          <input type="file" id="medicalDocs" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
          <div id="selected-docs" class="selected-docs"></div>
        </div>
      </form>
    `, `
      <button class="btn btn-secondary" id="leave-cancel" type="button">Cancel</button>
      <button class="btn btn-primary" id="leave-submit" type="button">Submit</button>
    `);

    const fromEl = document.getElementById('fromDate');
    const toEl = document.getElementById('toDate');
    const typeEl = document.getElementById('leaveType');
    const summary = document.getElementById('days-summary');
    const medSection = document.getElementById('medical-docs-section');
    const medInput = document.getElementById('medicalDocs');
    const selectedDocs = document.getElementById('selected-docs');

    function updateSummary() {
      const days = computeDays(fromEl.value, toEl.value);
      summary.textContent = days > 0 ? `Applying for ${days} day(s)` : '';
      if (fromEl.value) toEl.min = fromEl.value;

      const isSick = typeEl.value === 'sick';
      const needsDocs = isSick && days > 2;
      medSection.classList.toggle('hidden', !needsDocs);
    }

    fromEl.addEventListener('change', updateSummary);
    toEl.addEventListener('change', updateSummary);
    typeEl.addEventListener('change', updateSummary);

    medInput?.addEventListener('change', () => {
      const files = Array.from(medInput.files || []);
      selectedDocs.innerHTML = files.map(f => `<span class="doc-chip">📎 ${f.name}</span>`).join('');
    });

    document.getElementById('leave-cancel').addEventListener('click', closeModal);
    document.getElementById('leave-submit').addEventListener('click', () => submitLeave(user));
  }

  async function submitLeave(user) {
    const leaveType = document.getElementById('leaveType').value;
    const fromDate = document.getElementById('fromDate').value;
    const toDate = document.getElementById('toDate').value;
    const reason = document.getElementById('reason').value.trim();
    const medInput = document.getElementById('medicalDocs');
    const files = Array.from(medInput?.files || []);

    if (!leaveType || !fromDate || !toDate || !reason) {
      toast('Please fill in all required fields', 'error');
      return;
    }

    const numberOfDays = computeDays(fromDate, toDate);
    if (numberOfDays <= 0) {
      toast('Invalid date range', 'error');
      return;
    }

    const balances = Store.computeLeaveBalance(user.employeeId);
    const key = leaveType === 'sick' ? 'sick' : 'annual';
    if (numberOfDays > balances[key].remaining) {
      const lopDays = numberOfDays - balances[key].remaining;
      if (!confirm(`Loss of pay for ${lopDays} day(s). Proceed?`)) return;
    }

    if (leaveType === 'sick' && numberOfDays > 2 && files.length === 0) {
      toast('Medical documents are required for sick leave exceeding 2 days', 'error');
      return;
    }

    const docNames = files.map(f => f.name);
    const leave = {
      id: Store.uid('leave'),
      employeeId: user.employeeId,
      employeeName: user.name,
      applicantEmail: user.email,
      applicantRole: user.role,
      leaveType,
      fromDate,
      toDate,
      reason,
      numberOfDays,
      status: 'Pending',
      approvals: Store.buildApprovalsForRole(user.role),
      appliedOn: new Date().toISOString(),
      documents: docNames
    };

    if (files.length > 0) {
      const fd = new FormData();
      fd.append('employeeId', user.employeeId);
      fd.append('employeeName', user.name);
      fd.append('applicantEmail', user.email);
      fd.append('applicantRole', user.role);
      fd.append('leaveType', leaveType);
      fd.append('fromDate', fromDate);
      fd.append('toDate', toDate);
      fd.append('reason', reason);
      fd.append('numberOfDays', numberOfDays);
      files.forEach(f => fd.append('documents', f));
      const res = await API.createLeaveWithDocs(fd);
      if (res) Store.setLeaves([res, ...Store.getLeaves().filter(l => l.id !== res.id)]);
      else Store.addLeave(leave);
    } else {
      const res = await API.createLeave(leave);
      if (res) Store.setLeaves([res, ...Store.getLeaves()]);
      else Store.addLeave(leave);
    }

    closeModal();
    toast('Leave applied successfully! Awaiting approval.', 'success');
    navigate('leave', 'apply');
  }

  function showOnboardForm() {
    const today = new Date().toISOString().split('T')[0];
    const req = '<span class="required">*</span>';
    openModal('Onboard Employee', `
      <form id="onboard-form" class="onboard-form">
        <div class="form-section">
          <h4>Basic Information</h4>
          <div class="form-row">
            <div class="form-group"><label>Name ${req}</label><input id="ob-name" type="text" placeholder="e.g. Rahul Sharma" required /></div>
            <div class="form-group"><label>Employee ID (SG00xxx) ${req}</label><input id="ob-employeeId" type="text" placeholder="e.g. SG00012" required /></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Working Location ${req}</label><input id="ob-workingLocation" type="text" placeholder="e.g. Bangalore" required /></div>
            <div class="form-group"><label>Employee Type ${req}</label>
              <select id="ob-employeeType" required>
                <option value="" disabled selected hidden>Select type</option><option>Full Time</option><option>Contract</option><option>Intern</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Role ${req}</label>
              <select id="ob-role" required>
                <option value="" disabled selected hidden>Select role</option>
                <option value="employee">Employee</option>
                <option value="project_manager">Project Manager</option>
                <option value="reporting_manager">Reporting Manager</option>
                <option value="hr_manager">HR Manager</option>
                <option value="ca">CA</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div class="form-group"><label>Department ${req}</label><input id="ob-dept" type="text" placeholder="e.g. Engineering" required /></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Designation ${req}</label><input id="ob-designation" type="text" placeholder="e.g. Senior Developer" required /></div>
            <div class="form-group"><label>Date of Birth ${req}</label><input id="ob-dob" type="date" required /></div>
          </div>
        </div>

        <div class="form-section">
          <h4>Contact Details</h4>
          <div class="form-row">
            <div class="form-group"><label>Mobile ${req}</label><input id="ob-mobile" type="tel" maxlength="10" placeholder="e.g. 9876543210" required /></div>
            <div class="form-group"><label>Emergency Mobile ${req}</label><input id="ob-emergencyMobile" type="tel" maxlength="10" placeholder="e.g. 9123456780" required /></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Personal Gmail ${req}</label><input id="ob-email" type="email" placeholder="e.g. rahul.sharma@gmail.com" required /></div>
            <div class="form-group"><label>Office Mail ${req}</label><input id="ob-officeMail" type="email" placeholder="e.g. rahul@simbiotiktech.com" required /></div>
          </div>
        </div>

        <div class="form-section">
          <h4>Identity & Employment</h4>
          <div class="form-row">
            <div class="form-group"><label>Aadhaar ${req}</label><input id="ob-aadhaar" type="text" maxlength="12" placeholder="e.g. 123456789012" required /></div>
            <div class="form-group"><label>PAN ${req}</label><input id="ob-pan" type="text" maxlength="10" placeholder="e.g. ABCDE1234F" required /></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>PF Number ${req}</label><input id="ob-pfNo" type="text" placeholder="e.g. KRMAL1234567000" required /></div>
            <div class="form-group"><label>UAN ${req}</label><input id="ob-uan" type="text" maxlength="12" placeholder="e.g. 100123456789" required /></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Date of Joining ${req}</label><input id="ob-joinDate" type="date" value="${today}" required /></div>
            <div class="form-group"><label>Username ${req}</label><input id="ob-username" type="text" placeholder="e.g. rahul.sharma" required /></div>
          </div>
          <div class="form-group"><label>Password (portal login) ${req}</label><input id="ob-password" type="password" placeholder="e.g. Pass@123 (min 6 chars)" minlength="6" required /></div>
        </div>

        <div class="form-section">
          <h4>Supervisor Details</h4>
          <div class="form-row">
            <div class="form-group"><label>Reporting Manager ${req}</label><input id="ob-supervisor" type="text" placeholder="e.g. Priya Nair" required /></div>
            <div class="form-group"><label>Project Name ${req}</label><input id="ob-projectName" type="text" placeholder="e.g. HRMS Portal" required /></div>
          </div>
        </div>

        <div class="form-section">
          <h4>Address</h4>
          <div class="form-row">
            <div class="form-group"><label>Street ${req}</label><input id="ob-street" type="text" placeholder="e.g. 42 MG Road" required /></div>
            <div class="form-group"><label>City ${req}</label><input id="ob-city" type="text" placeholder="e.g. Bangalore" required /></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>State ${req}</label><input id="ob-state" type="text" placeholder="e.g. Karnataka" required /></div>
            <div class="form-group"><label>Pincode ${req}</label><input id="ob-pincode" type="text" maxlength="6" placeholder="e.g. 560001" required /></div>
          </div>
        </div>

        <div class="form-section">
          <h4>Education</h4>
          <div id="ob-education-rows">
            <div class="form-row edu-row">
              <div class="form-group"><label>Degree ${req}</label><input class="edu-degree" type="text" placeholder="e.g. B.Tech CSE" required /></div>
              <div class="form-group"><label>Institution ${req}</label><input class="edu-inst" type="text" placeholder="e.g. VTU" required /></div>
              <div class="form-group"><label>Year ${req}</label><input class="edu-year" type="text" placeholder="e.g. 2018" required /></div>
            </div>
          </div>
          <button class="btn btn-secondary btn-sm" id="ob-add-edu" type="button">+ Add Education</button>
        </div>

        <div class="form-section">
          <h4>Work Experience</h4>
          <div id="ob-exp-rows">
            <div class="form-row exp-row">
              <div class="form-group"><label>Company ${req}</label><input class="exp-company" type="text" placeholder="e.g. Infosys" required /></div>
              <div class="form-group"><label>Role ${req}</label><input class="exp-role" type="text" placeholder="e.g. Software Engineer" required /></div>
              <div class="form-group"><label>Duration ${req}</label><input class="exp-duration" type="text" placeholder="e.g. 2020-2022" required /></div>
            </div>
          </div>
          <button class="btn btn-secondary btn-sm" id="ob-add-exp" type="button">+ Add Experience</button>
        </div>

        <div class="form-section">
          <h4>Passport & Assets</h4>
          <div class="form-row">
            <div class="form-group"><label>Passport Number ${req}</label><input id="ob-passportNo" type="text" placeholder="e.g. A1234567" required /></div>
            <div class="form-group"><label>Passport Expiry ${req}</label><input id="ob-passportExpiry" type="date" required /></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Assets ${req}</label><input id="ob-asset" type="text" placeholder="e.g. Laptop, Access Card, ID Badge" required /></div>
            <div class="form-group"><label>Asset Status ${req}</label>
              <select id="assets-status" required>
                <option value="" disabled selected hidden>Select status</option>
                <option>Own</option>
                <option>Company</option>
              </select>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h4>Bank Details</h4>
          <div class="form-group"><label>Bank Name ${req}</label><input id="bank-name" type="text" placeholder="e.g. State Bank of India" required /></div>
          <div class="form-row">
            <div class="form-group"><label>Account Number ${req}</label><input id="acc-num" type="text" placeholder="e.g. 01234567890123" required /></div>
            <div class="form-group"><label>IFSC Code ${req}</label><input id="ifsc-code" type="text" placeholder="e.g. SBIN0001234" required /></div>
          </div>
        </div>

        <div class="form-section">
          <h4>Documents</h4>
          <div class="form-group">
            <label>Upload Aadhaar &amp; PAN (PDF only) ${req}</label>
            <p class="form-hint">Upload Aadhaar and PAN as separate PDF files.</p>
            <input type="file" id="ob-id-documents" multiple accept=".pdf,application/pdf" required />
            <div id="ob-id-doc-preview" class="selected-docs"></div>
          </div>
          <div class="form-group">
            <label>Upload Education Documents (PDF only) ${req}</label>
            <p class="form-hint">Degree certificates, mark sheets, or other education proofs.</p>
            <input type="file" id="ob-education-documents" multiple accept=".pdf,application/pdf" required />
            <div id="ob-edu-doc-preview" class="selected-docs"></div>
          </div>
        </div>

        <div class="form-section">
          <label class="checkbox-row">
            <input type="checkbox" id="ob-bgv" required />
            <span>BGV (Background Verification) completed ${req}</span>
          </label>
          <label class="checkbox-row" style="margin-top: 0.5rem;">
            <input type="checkbox" id="ob-insurance" />
            <span>Insurance</span>
          </label>
        </div>
      </form>
    `, `
      <button class="btn btn-secondary" id="ob-cancel" type="button">Cancel</button>
      <button class="btn btn-primary" id="ob-save" type="button">Save Employee</button>
    `, 'modal-xl');
     
            

    document.getElementById('ob-cancel').addEventListener('click', closeModal);
    document.getElementById('ob-add-edu').addEventListener('click', () => {
      const row = document.createElement('div');
      row.className = 'form-row edu-row';
      row.innerHTML = `
        <div class="form-group"><label>Degree</label><input class="edu-degree" type="text" placeholder="e.g. M.Tech" /></div>
        <div class="form-group"><label>Institution</label><input class="edu-inst" type="text" placeholder="e.g. IIT Delhi" /></div>
        <div class="form-group"><label>Year</label><input class="edu-year" type="text" placeholder="e.g. 2020" /></div>`;
      document.getElementById('ob-education-rows').appendChild(row);
    });
    document.getElementById('ob-add-exp').addEventListener('click', () => {
      const row = document.createElement('div');
      row.className = 'form-row exp-row';
      row.innerHTML = `
        <div class="form-group"><label>Company</label><input class="exp-company" type="text" placeholder="e.g. TCS" /></div>
        <div class="form-group"><label>Role</label><input class="exp-role" type="text" placeholder="e.g. Lead Developer" /></div>
        <div class="form-group"><label>Duration</label><input class="exp-duration" type="text" placeholder="e.g. 2022-2024" /></div>`;
      document.getElementById('ob-exp-rows').appendChild(row);
    });
    document.getElementById('ob-save').addEventListener('click', () => submitOnboard());

    const bindDocPreview = (inputId, previewId) => {
      document.getElementById(inputId)?.addEventListener('change', (e) => {
        const files = Array.from(e.target.files || []);
        const el = document.getElementById(previewId);
        if (el) el.innerHTML = files.map(f => `<span class="doc-chip">📎 ${f.name}</span>`).join('');
      });
    };
    bindDocPreview('ob-id-documents', 'ob-id-doc-preview');
    bindDocPreview('ob-education-documents', 'ob-edu-doc-preview');
  }

  async function submitOnboard() {
    const get = (id) => document.getElementById(id)?.value.trim() || '';
    const firstEdu = document.querySelector('.edu-row');
    const firstExp = document.querySelector('.exp-row');
    const idDocFiles = Array.from(document.getElementById('ob-id-documents')?.files || []);
    const eduDocFiles = Array.from(document.getElementById('ob-education-documents')?.files || []);

    const bankName = get('bank-name');
    const accNum = get('acc-num');
    const ifscCode = get('ifsc-code').toUpperCase();
    const assetsStatus = get('assets-status');

    // Define regex patterns from CreateEmployeeDto for client-side validation
    const employeeIdRegex = /^SG00[A-Za-z0-9]+$/;
    const gmailRegex = /@gmail\.com$/i;
    const simbiotikMailRegex = /@simbiotiktech\.com$/i;
    const indianMobileRegex = /^[7-9][0-9]{9}$/;
    const aadhaarRegex = /^[0-9]{12}$/;
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    const uanRegex = /^[0-9]{12}$/;

    // Get values and apply transformations for validation consistency
    const employeeId = get('ob-employeeId').toUpperCase();
    const name = get('ob-name');
    const personalEmail = get('ob-email');
    const officeMail = get('ob-officeMail');
    const department = get('ob-dept');
    const joinDate = get('ob-joinDate');
    const mobile = get('ob-mobile');
    const emergencyMobile = get('ob-emergencyMobile');
    const aadhaar = get('ob-aadhaar');
    const pan = get('ob-pan').toUpperCase();
    const uan = get('ob-uan');

    const checks = [
      // Basic Information
      !name ? 'Name is required' : null,
      !employeeId ? 'Employee ID is required' : (!employeeIdRegex.test(employeeId) ? 'Employee ID must start with SG00 and contain alphanumeric characters' : null),
      Validators.required(get('ob-workingLocation'), 'Working Location'),
      Validators.required(get('ob-employeeType'), 'Employee Type'),
      !department ? 'Department is required' : null,
      Validators.required(get('ob-designation'), 'Designation'),
      Validators.required(get('ob-dob'), 'Date of Birth'),

      // Contact Details
      !mobile ? 'Mobile number is required' : (!indianMobileRegex.test(mobile) ? 'Mobile must be a 10-digit Indian number' : null),
      !emergencyMobile ? 'Emergency mobile number is required' : (!indianMobileRegex.test(emergencyMobile) ? 'Emergency mobile must be a 10-digit Indian number' : null),
      !personalEmail ? 'Personal Gmail is required' : (!gmailRegex.test(personalEmail) ? 'Personal email must be a Gmail address' : null),
      !officeMail ? 'Office mail is required' : (!simbiotikMailRegex.test(officeMail) ? 'Office mail must be @simbiotiktech.com' : null),

       !aadhaar ? 'Aadhaar is required' : (!aadhaarRegex.test(aadhaar) ? 'Aadhaar must be 12 digits' : null),
      !pan ? 'PAN is required' : (!panRegex.test(pan) ? 'Invalid PAN format' : null),
      Validators.pf(get('ob-pfNo')),
      !uan ? 'UAN is required' : (!uanRegex.test(uan) ? 'UAN must be 12 digits' : null),
      !joinDate ? 'Date of Joining is required' : null,
      Validators.required(get('ob-username'), 'Username'),
      Validators.required(get('ob-supervisor'), 'Reporting Manager'),
      Validators.required(get('ob-projectName'), 'Project Name'),

       Validators.required(get('ob-street'), 'Street'),
      Validators.required(get('ob-city'), 'City'),
      Validators.required(get('ob-state'), 'State'),
      Validators.required(get('ob-pincode'), 'Pincode'),

       Validators.required(firstEdu?.querySelector('.edu-degree')?.value.trim(), 'Degree'),
      Validators.required(firstEdu?.querySelector('.edu-inst')?.value.trim(), 'Institution'),
      Validators.required(firstEdu?.querySelector('.edu-year')?.value.trim(), 'Education Year'),

      
      Validators.required(firstExp?.querySelector('.exp-company')?.value.trim(), 'Company'),
      Validators.required(firstExp?.querySelector('.exp-role')?.value.trim(), 'Experience Role'),
      Validators.required(firstExp?.querySelector('.exp-duration')?.value.trim(), 'Experience Duration'),

       Validators.required(get('ob-passportNo'), 'Passport Number'),
      Validators.required(get('ob-passportExpiry'), 'Passport Expiry'),
      Validators.required(get('ob-asset'), 'Assets'),
      Validators.required(assetsStatus, 'Asset Status'),
      Validators.required(bankName, 'Bank Name'),
      Validators.bankAccount(accNum),
      Validators.ifsc(ifscCode)
    ];
    const err = checks.find(Boolean);
    if (err) { toast(err, 'error'); return; }

    const password = get('ob-password');
    if (password.length < 6) {
      toast('Password must be at least 6 characters', 'error');
      return;
    }
    if (!idDocFiles.length) {
      toast('Please upload Aadhaar and PAN documents (PDF)', 'error');
      return;
    }
    if (!eduDocFiles.length) {
      toast('Please upload at least one education document (PDF)', 'error');
      return;
    }
    if (![...idDocFiles, ...eduDocFiles].every(isPdfFile)) {
      toast('All uploaded documents must be PDF files', 'error');
      return;
    }
    if (!document.getElementById('ob-bgv')?.checked) {
      toast('BGV checkbox must be checked', 'error');
      return;
    }

    const education = Array.from(document.querySelectorAll('.edu-row')).map(row => ({
      degree: row.querySelector('.edu-degree')?.value.trim() || '',
      institution: row.querySelector('.edu-inst')?.value.trim() || '',
      year: row.querySelector('.edu-year')?.value.trim() || ''
    })).filter(e => e.degree && e.institution && e.year);

    const experience = Array.from(document.querySelectorAll('.exp-row')).map(row => ({
      company: row.querySelector('.exp-company')?.value.trim() || '',
      role: row.querySelector('.exp-role')?.value.trim() || '',
      duration: row.querySelector('.exp-duration')?.value.trim() || ''
    })).filter(e => e.company && e.role && e.duration);

    const emp = {
      employeeId: get('ob-employeeId').toUpperCase(),
      name: get('ob-name'),
      email: get('ob-email'),
      officeMail: get('ob-officeMail'),
      department: get('ob-dept'),
      designation: get('ob-designation'),
      role: get('ob-role') || 'employee',
      employeeType: get('ob-employeeType'),
      workingLocation: get('ob-workingLocation'),
      mobile: get('ob-mobile'),
      emergencyMobile: get('ob-emergencyMobile'),
      aadhaar: get('ob-aadhaar'),
      pan: get('ob-pan').toUpperCase(),
      pfNo: get('ob-pfNo'),
      uan: get('ob-uan'),
      dob: get('ob-dob'),
      joinDate: get('ob-joinDate'),
      username: get('ob-username'),
      supervisor: get('ob-supervisor'),
      projectName: get('ob-projectName'),
      address: {
        street: get('ob-street'),
        city: get('ob-city'),
        state: get('ob-state'),
        pincode: get('ob-pincode')
      },
      education,
      experience,
      passport: {
        number: get('ob-passportNo'),
        expiry: get('ob-passportExpiry')
      },
      asset: get('ob-asset'),
      assetStatus: assetsStatus,
      bgv: true,
      insurance: document.getElementById('ob-insurance')?.checked || false,
      bankDetails: {
        bankName,
        accountNumber: accNum,
        ifscCode
      },
      status: 'Active'
    };

    const fd = new FormData();
    Object.entries(emp).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        fd.append(key, typeof val === 'object' ? JSON.stringify(val) : String(val));
      }
    });
    idDocFiles.forEach(f => fd.append('idDocuments', f));
    eduDocFiles.forEach(f => fd.append('educationDocuments', f));

    try {
      const res = await API.createEmployeeWithDocs(fd);
      if (!res) throw new Error('No response from server');
      Store.addEmployee(res);
    } catch (e) {
      toast(`Failed to save employee: ${e.message}`, 'error');
      return;
    }

    try {
      await API.createUser({
        email: emp.officeMail,
        password,
        name: emp.name,
        role: emp.role,
        employeeId: emp.employeeId
      });
    } catch (e) {
      toast(`Failed to create login account: ${e.message}`, 'error');
      closeModal();
      render();
      return;
    }

    closeModal();
    toast('Employee onboarded successfully', 'success');
    render();
  }

  async function showEditEmployeeForm(employeeId) {
    let emp = Store.getEmployees().find(e => e.id === employeeId);
    const fresh = await API.getEmployee(employeeId);
    if (fresh) {
      emp = fresh;
      Store.setEmployees(Store.getEmployees().map(e => e.id === fresh.id ? fresh : e));
    }
    if (!emp) {
      toast('Employee not found', 'error');
      return;
    }

    const req = '<span class="required">*</span>';
    const addr = emp.address || {};
    const passport = emp.passport || {};
    const bank = emp.bankDetails || {};
    const eduRows = (emp.education?.length ? emp.education : [{ degree: '', institution: '', year: '' }])
      .map((ed, i) => `
        <div class="form-row edu-row">
          <div class="form-group"><label>Degree ${i === 0 ? req : ''}</label><input class="edu-degree" type="text" value="${escAttr(ed.degree)}" ${i === 0 ? 'required' : ''} /></div>
          <div class="form-group"><label>Institution ${i === 0 ? req : ''}</label><input class="edu-inst" type="text" value="${escAttr(ed.institution)}" ${i === 0 ? 'required' : ''} /></div>
          <div class="form-group"><label>Year ${i === 0 ? req : ''}</label><input class="edu-year" type="text" value="${escAttr(ed.year)}" ${i === 0 ? 'required' : ''} /></div>
        </div>`).join('');
    const expRows = (emp.experience?.length ? emp.experience : [{ company: '', role: '', duration: '' }])
      .map((ex, i) => `
        <div class="form-row exp-row">
          <div class="form-group"><label>Company ${i === 0 ? req : ''}</label><input class="exp-company" type="text" value="${escAttr(ex.company)}" ${i === 0 ? 'required' : ''} /></div>
          <div class="form-group"><label>Role ${i === 0 ? req : ''}</label><input class="exp-role" type="text" value="${escAttr(ex.role)}" ${i === 0 ? 'required' : ''} /></div>
          <div class="form-group"><label>Duration ${i === 0 ? req : ''}</label><input class="exp-duration" type="text" value="${escAttr(ex.duration)}" ${i === 0 ? 'required' : ''} /></div>
        </div>`).join('');
    const roleOpt = (v) => emp.role === v ? 'selected' : '';
    const typeOpt = (v) => emp.employeeType === v ? 'selected' : '';
    const statusOpt = (v) => emp.status === v ? 'selected' : '';

    openModal(`Edit Employee — ${emp.name}`, `
      <form id="edit-employee-form" class="onboard-form" data-employee-id="${emp.id}">
        <div class="form-section">
          <h4>Basic Information</h4>
          <div class="form-row">
            <div class="form-group"><label>Name ${req}</label><input id="ed-name" type="text" value="${escAttr(emp.name)}" required /></div>
            <div class="form-group"><label>Employee ID</label><input id="ed-employeeId" type="text" value="${escAttr(emp.employeeId)}" readonly /></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Working Location ${req}</label><input id="ed-workingLocation" type="text" value="${escAttr(emp.workingLocation)}" required /></div>
            <div class="form-group"><label>Employee Type ${req}</label>
              <select id="ed-employeeType" required>
                <option value="" disabled ${emp.employeeType ? '' : 'selected'} hidden>Select type</option>
                <option ${typeOpt('Full Time')}>Full Time</option>
                <option ${typeOpt('Contract')}>Contract</option>
                <option ${typeOpt('Intern')}>Intern</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Role ${req}</label>
              <select id="ed-role" required>
                <option value="" disabled ${emp.role ? '' : 'selected'} hidden>Select role</option>
                <option value="employee" ${roleOpt('employee')}>Employee</option>
                <option value="project_manager" ${roleOpt('project_manager')}>Project Manager</option>
                <option value="reporting_manager" ${roleOpt('reporting_manager')}>Reporting Manager</option>
                <option value="hr_manager" ${roleOpt('hr_manager')}>HR Manager</option>
                <option value="ca" ${roleOpt('ca')}>CA</option>
                <option value="admin" ${roleOpt('admin')}>Admin</option>
              </select>
            </div>
            <div class="form-group"><label>Department ${req}</label><input id="ed-dept" type="text" value="${escAttr(emp.department)}" required /></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Designation ${req}</label><input id="ed-designation" type="text" value="${escAttr(emp.designation)}" required /></div>
            <div class="form-group"><label>Date of Birth ${req}</label><input id="ed-dob" type="date" value="${escAttr(emp.dob)}" required /></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Status ${req}</label>
              <select id="ed-status" required>
                <option value="" disabled ${emp.status ? '' : 'selected'} hidden>Select status</option>
                <option value="Active" ${statusOpt('Active')}>Active</option>
                <option value="Inactive" ${statusOpt('Inactive')}>Inactive</option>
              </select>
            </div>
            <div class="form-group"><label>Date of Joining ${req}</label><input id="ed-joinDate" type="date" value="${escAttr(emp.joinDate)}" required /></div>
          </div>
        </div>
        <div class="form-section">
          <h4>Contact Details</h4>
          <div class="form-row">
            <div class="form-group"><label>Mobile ${req}</label><input id="ed-mobile" type="tel" maxlength="10" value="${escAttr(emp.mobile)}" required /></div>
            <div class="form-group"><label>Emergency Mobile ${req}</label><input id="ed-emergencyMobile" type="tel" maxlength="10" value="${escAttr(emp.emergencyMobile)}" required /></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Personal Gmail ${req}</label><input id="ed-email" type="email" value="${escAttr(emp.email)}" required /></div>
            <div class="form-group"><label>Office Mail ${req}</label><input id="ed-officeMail" type="email" value="${escAttr(emp.officeMail)}" required /></div>
          </div>
          <div class="form-group"><label>Username ${req}</label><input id="ed-username" type="text" value="${escAttr(emp.username)}" required /></div>
        </div>
        <div class="form-section">
          <h4>Identity &amp; Employment</h4>
          <div class="form-row">
            <div class="form-group"><label>Aadhaar ${req}</label><input id="ed-aadhaar" type="text" maxlength="12" value="${escAttr(emp.aadhaar)}" required /></div>
            <div class="form-group"><label>PAN ${req}</label><input id="ed-pan" type="text" maxlength="10" value="${escAttr(emp.pan)}" required /></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>PF Number ${req}</label><input id="ed-pfNo" type="text" value="${escAttr(emp.pfNo)}" required /></div>
            <div class="form-group"><label>UAN ${req}</label><input id="ed-uan" type="text" maxlength="12" value="${escAttr(emp.uan)}" required /></div>
          </div>
        </div>
        <div class="form-section">
          <h4>Supervisor Details</h4>
          <div class="form-row">
            <div class="form-group"><label>Reporting Manager ${req}</label><input id="ed-supervisor" type="text" value="${escAttr(emp.supervisor)}" required /></div>
            <div class="form-group"><label>Project Name ${req}</label><input id="ed-projectName" type="text" value="${escAttr(emp.projectName)}" required /></div>
          </div>
        </div>
        <div class="form-section">
          <h4>Address</h4>
          <div class="form-row">
            <div class="form-group"><label>Street ${req}</label><input id="ed-street" type="text" value="${escAttr(addr.street)}" required /></div>
            <div class="form-group"><label>City ${req}</label><input id="ed-city" type="text" value="${escAttr(addr.city)}" required /></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>State ${req}</label><input id="ed-state" type="text" value="${escAttr(addr.state)}" required /></div>
            <div class="form-group"><label>Pincode ${req}</label><input id="ed-pincode" type="text" maxlength="6" value="${escAttr(addr.pincode)}" required /></div>
          </div>
        </div>
        <div class="form-section">
          <h4>Education</h4>
          <div id="ed-education-rows">${eduRows}</div>
          <button class="btn btn-secondary btn-sm" id="ed-add-edu" type="button">+ Add Education</button>
        </div>
        <div class="form-section">
          <h4>Work Experience</h4>
          <div id="ed-exp-rows">${expRows}</div>
          <button class="btn btn-secondary btn-sm" id="ed-add-exp" type="button">+ Add Experience</button>
        </div>
        <div class="form-section">
          <h4>Passport &amp; Assets</h4>
          <div class="form-row">
            <div class="form-group"><label>Passport Number ${req}</label><input id="ed-passportNo" type="text" value="${escAttr(passport.number)}" required /></div>
            <div class="form-group"><label>Passport Expiry ${req}</label><input id="ed-passportExpiry" type="date" value="${escAttr(passport.expiry)}" required /></div>
          </div>
          <div class="form-group"><label>Assets ${req}</label><input id="ed-asset" type="text" value="${escAttr(emp.asset)}" required /></div>
        </div>
        
        <div class="form-section">
          <h4>Bank Details</h4>
          <div class="form-group">
            <label>Bank Name ${req}</label>
            <input id="ed-bankName" type="text" value="${escAttr(bank.bankName)}" required />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Account Number ${req}</label>
              <input id="ed-accNum" type="text" value="${escAttr(bank.accountNumber)}" required />
            </div>
            <div class="form-group"><label>IFSC Code ${req}</label><input id="ed-ifsc" type="text" value="${escAttr(bank.ifscCode)}" required /></div>
          </div>
        </div>

        <div class="form-section">
          <h4>Documents</h4>
          <p class="form-hint">Upload new PDFs only if you want to add more documents. Existing files are kept.</p>
          ${emp.idDocuments?.length ? `<p class="form-hint">Current ID docs: ${emp.idDocuments.map(d => d.name || 'file').join(', ')}</p>` : ''}
          <div class="form-group">
            <label>Add Aadhaar &amp; PAN (PDF)</label>
            <input type="file" id="ed-id-documents" multiple accept=".pdf,application/pdf" />
            <div id="ed-id-doc-preview" class="selected-docs"></div>
          </div>
          ${emp.educationDocuments?.length ? `<p class="form-hint">Current education docs: ${emp.educationDocuments.map(d => d.name || 'file').join(', ')}</p>` : ''}
          <div class="form-group">
            <label>Add Education Documents (PDF)</label>
            <input type="file" id="ed-education-documents" multiple accept=".pdf,application/pdf" />
            <div id="ed-edu-doc-preview" class="selected-docs"></div>
          </div>
        </div>
        <div class="form-section">
          <label class="checkbox-row">
            <input type="checkbox" id="ed-bgv" ${emp.bgv ? 'checked' : ''} />
            <span>BGV (Background Verification) completed</span>
          </label>
          <label class="checkbox-row" style="margin-top: 0.5rem;">
            <input type="checkbox" id="ed-insurance" ${emp.insurance ? 'checked' : ''} />
            <span>Insurance</span>
          </label>
        </div>
      </form>
    `, `
      <button class="btn btn-secondary" id="ed-cancel" type="button">Cancel</button>
      <button class="btn btn-primary" id="ed-save" type="button">Save Changes</button>
    `, 'modal-xl');

    document.getElementById('ed-cancel').addEventListener('click', closeModal);
    document.getElementById('ed-add-edu').addEventListener('click', () => {
      const row = document.createElement('div');
      row.className = 'form-row edu-row';
      row.innerHTML = `
        <div class="form-group"><label>Degree</label><input class="edu-degree" type="text" /></div>
        <div class="form-group"><label>Institution</label><input class="edu-inst" type="text" /></div>
        <div class="form-group"><label>Year</label><input class="edu-year" type="text" /></div>`;
      document.getElementById('ed-education-rows').appendChild(row);
    });
    document.getElementById('ed-add-exp').addEventListener('click', () => {
      const row = document.createElement('div');
      row.className = 'form-row exp-row';
      row.innerHTML = `
        <div class="form-group"><label>Company</label><input class="exp-company" type="text" /></div>
        <div class="form-group"><label>Role</label><input class="exp-role" type="text" /></div>
        <div class="form-group"><label>Duration</label><input class="exp-duration" type="text" /></div>`;
      document.getElementById('ed-exp-rows').appendChild(row);
    });
    const bindDocPreview = (inputId, previewId) => {
      document.getElementById(inputId)?.addEventListener('change', (e) => {
        const files = Array.from(e.target.files || []);
        const el = document.getElementById(previewId);
        if (el) el.innerHTML = files.map(f => `<span class="doc-chip">📎 ${f.name}</span>`).join('');
      });
    };
    bindDocPreview('ed-id-documents', 'ed-id-doc-preview');
    bindDocPreview('ed-education-documents', 'ed-edu-doc-preview');
    document.getElementById('ed-save').addEventListener('click', () => submitEditEmployee(employeeId));
  }

  async function submitEditEmployee(employeeId) {
    const get = (id) => document.getElementById(id)?.value.trim() || '';
    const firstEdu = document.querySelector('#edit-employee-form .edu-row');
    const firstExp = document.querySelector('#edit-employee-form .exp-row');
    const idDocFiles = Array.from(document.getElementById('ed-id-documents')?.files || []);
    const eduDocFiles = Array.from(document.getElementById('ed-education-documents')?.files || []);

    // Define regex patterns for robust client-side validation
    const gmailRegex = /@gmail\.com$/i;
    const simbiotikMailRegex = /@simbiotiktech\.com$/i;
    const indianMobileRegex = /^[7-9][0-9]{9}$/;
    const aadhaarRegex = /^[0-9]{12}$/;
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    const uanRegex = /^[0-9]{12}$/;

    const name = get('ed-name');
    const workingLocation = get('ed-workingLocation');
    const employeeType = get('ed-employeeType');
    const department = get('ed-dept');
    const designation = get('ed-designation');
    const dob = get('ed-dob');
    const mobile = get('ed-mobile');
    const emergencyMobile = get('ed-emergencyMobile');
    const personalEmail = get('ed-email');
    const officeMail = get('ed-officeMail');
    const aadhaar = get('ed-aadhaar');
    const pan = get('ed-pan').toUpperCase();
    const uan = get('ed-uan');
    const joinDate = get('ed-joinDate');
    const username = get('ed-username');
    const supervisor = get('ed-supervisor');
    const projectName = get('ed-projectName');
    const street = get('ed-street');
    const city = get('ed-city');
    const state = get('ed-state');
    const pincode = get('ed-pincode');

    const checks = [
      // Basic Info
      !name ? 'Name is required' : null,
      !workingLocation ? 'Working Location is required' : null,
      !employeeType ? 'Employee Type is required' : null,
      !department ? 'Department is required' : null,
      !designation ? 'Designation is required' : null,
      !dob ? 'Date of Birth is required' : null,

      // Contact
      !mobile ? 'Mobile is required' : (!indianMobileRegex.test(mobile) ? 'Invalid Mobile' : null),
      !emergencyMobile ? 'Emergency Mobile is required' : (!indianMobileRegex.test(emergencyMobile) ? 'Invalid Emergency Mobile' : null),
      !personalEmail ? 'Personal Gmail is required' : (!gmailRegex.test(personalEmail) ? 'Must be a Gmail address' : null),
      !officeMail ? 'Office mail is required' : (!simbiotikMailRegex.test(officeMail) ? 'Must be @simbiotiktech.com' : null),

      // Identity
      !aadhaar ? 'Aadhaar is required' : (!aadhaarRegex.test(aadhaar) ? 'Aadhaar must be 12 digits' : null),
      !pan ? 'PAN is required' : (!panRegex.test(pan) ? 'Invalid PAN format' : null),
      Validators.pf(get('ed-pfNo')),
      !uan ? 'UAN is required' : (!uanRegex.test(uan) ? 'UAN must be 12 digits' : null),
      !joinDate ? 'Date of Joining is required' : null,
      !username ? 'Username is required' : null,
      !supervisor ? 'Reporting Manager is required' : null,
      !projectName ? 'Project Name is required' : null,

      // Address
      !street ? 'Street is required' : null,
      !city ? 'City is required' : null,
      !state ? 'State is required' : null,
      !pincode ? 'Pincode is required' : null,

      // Education & Experience
      Validators.required(firstEdu?.querySelector('.edu-degree')?.value.trim(), 'Degree'),
      Validators.required(firstEdu?.querySelector('.edu-inst')?.value.trim(), 'Institution'),
      Validators.required(firstEdu?.querySelector('.edu-year')?.value.trim(), 'Education Year'),
      Validators.required(firstExp?.querySelector('.exp-company')?.value.trim(), 'Company'),
      Validators.required(firstExp?.querySelector('.exp-role')?.value.trim(), 'Experience Role'),
      Validators.required(firstExp?.querySelector('.exp-duration')?.value.trim(), 'Experience Duration'),

      // Assets
      !get('ed-passportNo') ? 'Passport Number required' : null,
      !get('ed-asset') ? 'Assets required' : null,
      Validators.required(get('ed-bankName'), 'Bank Name'),
      Validators.bankAccount(get('ed-accNum')),
      Validators.ifsc(get('ed-ifsc'))
    ];
    const err = checks.find(Boolean);
    if (err) { toast(err, 'error'); return; }

    if ([...idDocFiles, ...eduDocFiles].some(f => !isPdfFile(f))) {
      toast('Uploaded documents must be PDF files', 'error');
      return;
    }

    const education = Array.from(document.querySelectorAll('#edit-employee-form .edu-row')).map(row => ({
      degree: row.querySelector('.edu-degree')?.value.trim() || '',
      institution: row.querySelector('.edu-inst')?.value.trim() || '',
      year: row.querySelector('.edu-year')?.value.trim() || ''
    })).filter(e => e.degree && e.institution && e.year);

    const experience = Array.from(document.querySelectorAll('#edit-employee-form .exp-row')).map(row => ({
      company: row.querySelector('.exp-company')?.value.trim() || '',
      role: row.querySelector('.exp-role')?.value.trim() || '',
      duration: row.querySelector('.exp-duration')?.value.trim() || ''
    })).filter(e => e.company && e.role && e.duration);

    const emp = {
      name: get('ed-name'),
      email: get('ed-email'),
      officeMail: get('ed-officeMail'),
      department: get('ed-dept'),
      designation: get('ed-designation'),
      role: get('ed-role') || 'employee',
      employeeType: get('ed-employeeType'),
      workingLocation: get('ed-workingLocation'),
      mobile: get('ed-mobile'),
      emergencyMobile: get('ed-emergencyMobile'),
      aadhaar: get('ed-aadhaar'),
      pan: get('ed-pan').toUpperCase(),
      pfNo: get('ed-pfNo'),
      uan: get('ed-uan'),
      dob: get('ed-dob'),
      joinDate: get('ed-joinDate'),
      username: get('ed-username'),
      supervisor: get('ed-supervisor'),
      projectName: get('ed-projectName'),
      status: get('ed-status') || 'Active',
      address: {
        street: get('ed-street'),
        city: get('ed-city'),
        state: get('ed-state'),
        pincode: get('ed-pincode')
      },
      education,
      experience,
      passport: {
        number: get('ed-passportNo'),
        expiry: get('ed-passportExpiry')
      },
      asset: get('ed-asset'),
      bankDetails: {
        bankName: get('ed-bankName'),
        accountNumber: get('ed-accNum'),
        ifscCode: get('ed-ifsc').toUpperCase()
      },
      bgv: document.getElementById('ed-bgv')?.checked || false,
      insurance: document.getElementById('ed-insurance')?.checked || false
    };

    const fd = new FormData();
    Object.entries(emp).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        fd.append(key, typeof val === 'object' ? JSON.stringify(val) : String(val));
      }
    });
    idDocFiles.forEach(f => fd.append('idDocuments', f));
    eduDocFiles.forEach(f => fd.append('educationDocuments', f));

    const res = await API.updateEmployeeWithDocs(employeeId, fd);
    if (!res) {
      toast('Failed to update employee', 'error');
      return;
    }

    Store.setEmployees(Store.getEmployees().map(e => e.id === res.id ? res : e));
    closeModal();
    toast('Employee updated successfully', 'success');
    render();
  }

  function detailRow(label, value) {
    const display = value === undefined || value === null || value === '' ? '—' : value;
    return `<div class="detail-item"><span class="detail-label">${label}</span><span class="detail-value">${display}</span></div>`;
  }

  function renderDocDownloads(employeeId, docs, type, label) {
    if (!docs?.length) return `<p class="form-hint">No ${label.toLowerCase()} uploaded.</p>`;
    return `<div class="doc-download-list">${docs.map((doc, i) => {
      const name = typeof doc === 'string' ? doc.split('/').pop() : (doc.name || `Document ${i + 1}`);
      return `<button class="btn btn-secondary btn-sm doc-download-btn" type="button" data-download-emp-doc="${employeeId}" data-doc-type="${type}" data-doc-index="${i}">📥 ${name}</button>`;
    }).join('')}</div>`;
  }

  async function showEmployeeDetail(employeeId) {
    let emp = Store.getEmployees().find(e => e.id === employeeId);
    const fresh = await API.getEmployee(employeeId);
    if (fresh) {
      emp = fresh;
      Store.setEmployees(Store.getEmployees().map(e => e.id === fresh.id ? fresh : e));
    }
    if (!emp) {
      toast('Employee not found', 'error');
      return;
    }

    const addr = emp.address || {};
    const passport = emp.passport || {};
    const educationHtml = (emp.education || []).length
      ? (emp.education || []).map(ed => `<div class="detail-list-item">${ed.degree || '—'} — ${ed.institution || '—'} (${ed.year || '—'})</div>`).join('')
      : '<p class="form-hint">—</p>';
    const experienceHtml = (emp.experience || []).length
      ? (emp.experience || []).map(ex => `<div class="detail-list-item">${ex.role || '—'} at ${ex.company || '—'} (${ex.duration || '—'})</div>`).join('')
      : '<p class="form-hint">—</p>';

    openModal(`Employee Details — ${emp.name}`, `
      <div class="employee-detail">
        <div class="detail-section">
          <h4>Basic Information</h4>
          <div class="detail-grid">
            ${detailRow('Employee ID', emp.employeeId)}
            ${detailRow('Name', emp.name)}
            ${detailRow('Working Location', emp.workingLocation)}
            ${detailRow('Employee Type', emp.employeeType)}
            ${detailRow('Role', Modules.formatRoleName(emp.role))}
            ${detailRow('Department', emp.department)}
            ${detailRow('Designation', emp.designation)}
            ${detailRow('Date of Birth', emp.dob)}
            ${detailRow('Join Date', Modules.formatDate(emp.joinDate))}
            ${detailRow('Status', emp.status)}
            ${detailRow('BGV', emp.bgv ? 'Completed' : 'Pending')}
            ${detailRow('Insurance', emp.insurance ? 'Opted In' : 'Not Opted In')}
          </div>
        </div>
        <div class="detail-section">
          <h4>Contact</h4>
          <div class="detail-grid">
            ${detailRow('Mobile', emp.mobile)}
            ${detailRow('Emergency Mobile', emp.emergencyMobile)}
            ${detailRow('Personal Email', emp.email)}
            ${detailRow('Office Email', emp.officeMail)}
            ${detailRow('Username', emp.username)}
          </div>
        </div>
        <div class="detail-section">
          <h4>Identity &amp; Employment</h4>
          <div class="detail-grid">
            ${detailRow('Aadhaar', emp.aadhaar)}
            ${detailRow('PAN', emp.pan)}
            ${detailRow('PF Number', emp.pfNo)}
            ${detailRow('UAN', emp.uan)}
            ${detailRow('Reporting Manager', emp.supervisor)}
            ${detailRow('Project', emp.projectName)}
          </div>
        </div>
        <div class="detail-section">
          <h4>Address</h4>
          <div class="detail-grid">
            ${detailRow('Street', addr.street)}
            ${detailRow('City', addr.city)}
            ${detailRow('State', addr.state)}
            ${detailRow('Pincode', addr.pincode)}
          </div>
        </div>
        <div class="detail-section">
          <h4>Education</h4>
          ${educationHtml}
        </div>
        <div class="detail-section">
          <h4>Work Experience</h4>
          ${experienceHtml}
        </div>
        <div class="detail-section">
          <h4>Passport &amp; Assets</h4>
          <div class="detail-grid">
            ${detailRow('Passport Number', passport.number)}
            ${detailRow('Passport Expiry', passport.expiry ? Modules.formatDate(passport.expiry) : '—')}
            ${detailRow('Assets', emp.asset)}
          </div>
        </div>
        <div class="detail-section">
          <h4>Documents</h4>
          <p class="form-hint" style="margin-bottom:0.5rem">Aadhaar &amp; PAN</p>
          ${renderDocDownloads(emp.id, emp.idDocuments, 'id', 'ID documents')}
          <p class="form-hint" style="margin:1rem 0 0.5rem">Education</p>
          ${renderDocDownloads(emp.id, emp.educationDocuments, 'education', 'education documents')}
        </div>
      </div>
    `, `
      ${Modules.canAccess(Store.getUser(), 'employees.edit') ? '<button class="btn btn-primary" id="emp-detail-edit" type="button">Edit</button>' : ''}
      <button class="btn btn-secondary" id="emp-detail-close" type="button">Close</button>
    `, 'modal-xl');

    document.getElementById('emp-detail-edit')?.addEventListener('click', () => {
      closeModal();
      showEditEmployeeForm(employeeId);
    });
    document.getElementById('emp-detail-close')?.addEventListener('click', closeModal);
    document.querySelectorAll('[data-download-emp-doc]').forEach(btn => {
      btn.addEventListener('click', () => downloadEmployeeDoc(
        btn.dataset.downloadEmpDoc,
        btn.dataset.docType,
        Number(btn.dataset.docIndex),
        btn.textContent.replace(/^📥\s*/, '').trim()
      ));
    });
  }

  function downloadEmployeeDoc(employeeId, type, index, filename) {
    const url = API.getEmployeeDocUrl(employeeId, type, index);
    fetch(url, { headers: API.authHeader() }).then(r => {
      if (!r.ok) throw new Error('Download failed');
      return r.blob().then(b => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(b);
        a.download = filename || 'document.pdf';
        a.click();
        URL.revokeObjectURL(a.href);
        toast('Document downloaded', 'success');
      });
    }).catch(() => toast('Could not download document', 'error'));
  }

  function downloadLeaveDoc(leaveId, index, filename) {
    const url = API.getLeaveDocUrl(leaveId, index);
    fetch(url, { headers: API.authHeader() }).then(r => {
      if (!r.ok) throw new Error('Download failed');
      return r.blob().then(b => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(b);
        a.download = filename || 'document.pdf';
        a.click();
        URL.revokeObjectURL(a.href);
        toast('Document downloaded', 'success');
      });
    }).catch(() => toast('Could not download document', 'error'));
  }

  async function showEditJobForm(jobId) {
    const job = Store.getJobs().find(j => j.id === jobId);
    if (!job) return;

    const req = '<span class="required">*</span>';
    openModal(`Edit Job — ${job.title}`, `
      <div class="form-group"><label>Job Title ${req}</label><input id="edit-job-title" type="text" value="${escAttr(job.title)}" required /></div>
      <div class="form-group"><label>Department ${req}</label><input id="edit-job-dept" type="text" value="${escAttr(job.department)}" required /></div>
      <div class="form-group"><label>Status ${req}</label>
        <select id="edit-job-status" required>
          <option value="Open" ${job.status === 'Open' ? 'selected' : ''}>Open</option>
          <option value="Closed" ${job.status === 'Closed' ? 'selected' : ''}>Closed</option>
        </select>
      </div>
      <div class="form-group"><label>Description</label><textarea id="edit-job-desc" rows="3">${escAttr(job.description)}</textarea></div>
      <div class="form-group"><label>Requirements</label><textarea id="edit-job-req" rows="2">${escAttr(job.requirements)}</textarea></div>
      <div class="form-group">
        <label>Job Document (PDF)</label>
        <p class="form-hint">Upload a new PDF to replace the current one.</p>
        <input type="file" id="edit-job-pdf" accept=".pdf,application/pdf" />
        <div id="edit-job-pdf-preview" class="selected-docs"></div>
      </div>
    `, `<button class="btn btn-secondary" id="edit-job-cancel" type="button">Cancel</button>
        <button class="btn btn-primary" id="edit-job-save" type="button">Save Changes</button>`);

    document.getElementById('edit-job-cancel').addEventListener('click', closeModal);
    document.getElementById('edit-job-pdf')?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      const el = document.getElementById('edit-job-pdf-preview');
      if (el) el.innerHTML = file ? `<span class="doc-chip">📎 ${file.name}</span>` : '';
    });

    document.getElementById('edit-job-save').addEventListener('click', async () => {
      const title = document.getElementById('edit-job-title').value.trim();
      const department = document.getElementById('edit-job-dept').value.trim();
      const status = document.getElementById('edit-job-status').value;
      const description = document.getElementById('edit-job-desc').value.trim();
      const requirements = document.getElementById('edit-job-req').value.trim();
      const pdfFile = document.getElementById('edit-job-pdf')?.files?.[0];

      if (!title || !department) { toast('Job Title and Department are required', 'error'); return; }
      if (pdfFile && !isPdfFile(pdfFile)) { toast('Selected file must be a PDF', 'error'); return; }

      const fd = new FormData();
      fd.append('title', title);
      fd.append('department', department);
      fd.append('status', status);
      fd.append('description', description);
      fd.append('requirements', requirements);
      if (pdfFile) fd.append('pdf', pdfFile);

      const res = await API.updateJob(jobId, fd);
      if (res) {
        Store.updateJob(jobId, res);
        closeModal();
        toast('Job updated successfully', 'success');
        render();
      }
    });
  }

  function downloadJobPdf(jobId) {
    const job = Store.getJobs().find(j => j.id === jobId);
    if (!job) return;

    // Sending auth header even if public; it won't hurt public access 
    // but ensures logged-in users are identified.
    const headers = Store.getUser() ? API.authHeader() : {};
    fetch(API.getJobPdfUrl(jobId), { headers }).then(r => {
      if (!r.ok) throw new Error('Download failed');
      return r.blob().then(b => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(b);
        a.download = job.pdfFileName || `${job.title.replace(/\s+/g, '-')}-job-details.pdf`;
        a.click();
        URL.revokeObjectURL(a.href);
        toast('Job PDF downloaded', 'success');
      });
    }).catch(() => toast('Could not download job PDF. Re-post the job with a PDF attached.', 'error'));
  }

  function downloadCandidateResume(candId) {
    const cand = Store.getCandidates().find(c => c.id === candId);
    if (!cand || !cand.resumePath) {
      toast('No resume available for this candidate', 'info');
      return;
    }
    const url = `${API.BASE}/candidates/${candId}/resume`;
    fetch(url, { headers: API.authHeader() }).then(r => {
      if (!r.ok) throw new Error();
      return r.blob().then(b => {
        const a = document.createElement('a'); a.href = URL.createObjectURL(b);
        a.download = cand.resumeFileName || 'resume.pdf'; a.click();
      });
    }).catch(() => toast('Could not download resume', 'error'));
  }

  function downloadPayslip(payrollId) {
    const p = Store.getPayrolls().find(x => x.id === payrollId);
    if (!p) return;
    
    const url = `${API.BASE}/payroll/${payrollId}/payslip`;
    const filename = `payslip-${p.month.replace(/\s+/g, '-')}.pdf`;
    
    downloadWithAuth(url, filename);
  }

  function bindPageEvents(user) {
    document.getElementById('sub-tab-select')?.addEventListener('change', (e) => {
      const val = e.target.value;
      const opt = e.target.selectedOptions[0];
      if (opt.disabled) {
        toast('This section is locked for your role', 'error');
        e.target.value = getSubPage(currentPage);
        return;
      }
      currentSubPage[currentPage] = val;
      document.getElementById('page-content').innerHTML =
        Modules.render(currentPage, user, val);
      bindPageEvents(user);
    });

    document.getElementById('btn-apply-leave')?.addEventListener('click', () => showLeaveForm(user));

    document.querySelectorAll('[data-delete-leave]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this leave request?')) return;
        const res = await API.deleteLeave(btn.dataset.deleteLeave);
        if (res) {
          Store.setLeaves(Store.getLeaves().map(l => l.id === res.id ? res : l));
        } else {
          Store.softDeleteLeave(btn.dataset.deleteLeave);
        }
        toast('Leave request marked as deleted');
        render();
      });
    });

    document.querySelectorAll('[data-approve-step]').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          const res = await API.approveLeaveStep(btn.dataset.approveStep, 'Approved');
          if (res) Store.setLeaves(Store.getLeaves().map(l => l.id === res.id ? res : l));
          else Store.approveLeaveStep(btn.dataset.approveStep, user.role, 'Approved');
          toast('Leave approved at your stage', 'success');
          render();
        } catch (e) {
          toast(e.message, 'error');
        }
      });
    });

    document.querySelectorAll('[data-reject-step]').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          const res = await API.approveLeaveStep(btn.dataset.rejectStep, 'Rejected');
          if (res) Store.setLeaves(Store.getLeaves().map(l => l.id === res.id ? res : l));
          else Store.approveLeaveStep(btn.dataset.rejectStep, user.role, 'Rejected');
          toast('Leave rejected', 'error');
          render();
        } catch (e) {
          toast(e.message, 'error');
        }
      });
    });

    document.querySelectorAll('[data-download-job]').forEach(btn => {
      btn.addEventListener('click', () => downloadJobPdf(btn.dataset.downloadJob));
    });

    document.querySelectorAll('[data-edit-job]').forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        showEditJobForm(btn.dataset.editJob);
      };
    });

    document.querySelectorAll('[data-delete-job]').forEach(btn => {
      btn.onclick = async (e) => {
        e.preventDefault();
        if (!confirm('Are you sure you want to delete this job posting?')) return;
        try {
          await API.deleteJob(btn.dataset.deleteJob);
          Store.deleteJob(btn.dataset.deleteJob);
          toast('Job deleted successfully', 'success');
          render();
        } catch (err) {
          toast(err.message, 'error');
        }
      };
    });

    document.querySelectorAll('[data-download-payslip]').forEach(btn => {
      btn.addEventListener('click', () => downloadPayslip(btn.dataset.downloadPayslip));
    });

    document.getElementById('btn-onboard')?.addEventListener('click', () => showOnboardForm());

    document.querySelectorAll('[data-view-employee]').forEach(btn => {
      btn.addEventListener('click', () => showEmployeeDetail(btn.dataset.viewEmployee));
    });

    document.querySelectorAll('[data-edit-employee]').forEach(btn => {
      btn.addEventListener('click', () => showEditEmployeeForm(btn.dataset.editEmployee));
    });

    document.querySelectorAll('[data-download-resume]').forEach(btn => {
      btn.addEventListener('click', () => downloadCandidateResume(btn.dataset.downloadResume));
    });

    document.querySelectorAll('[data-download-leave-doc]').forEach(btn => {
      btn.addEventListener('click', () => downloadLeaveDoc(
        btn.dataset.downloadLeaveDoc,
        Number(btn.dataset.docIndex),
        btn.textContent.replace(/^📥\s*/, '').trim()
      ));
    });

    document.getElementById('btn-post-job')?.addEventListener('click', () => {
      const req = '<span class="required">*</span>';
      openModal('Post Job', `
        <div class="form-group"><label>Job Title ${req}</label><input id="job-title" type="text" placeholder="e.g. Senior Developer" required /></div>
        <div class="form-group"><label>Department ${req}</label><input id="job-dept" type="text" placeholder="Department" required /></div>
        <div class="form-group"><label>Description</label><textarea id="job-desc" rows="3" placeholder="Job description"></textarea></div>
        <div class="form-group"><label>Requirements</label><textarea id="job-req" rows="2" placeholder="Requirements"></textarea></div>
        <div class="form-group">
          <label>Job Document (PDF) ${req}</label>
          <p class="form-hint">Upload the official job description or posting document as a PDF.</p>
          <input type="file" id="job-pdf" accept=".pdf,application/pdf" required />
          <div id="job-pdf-preview" class="selected-docs"></div>
        </div>
      `, `<button class="btn btn-secondary" id="job-cancel" type="button">Cancel</button>
          <button class="btn btn-primary" id="job-save" type="button">Post Job</button>`);
      document.getElementById('job-cancel').addEventListener('click', closeModal);
      document.getElementById('job-pdf')?.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        const el = document.getElementById('job-pdf-preview');
        if (el) el.innerHTML = file ? `<span class="doc-chip">📎 ${file.name}</span>` : '';
      });
      document.getElementById('job-save').addEventListener('click', async () => {
        const title = document.getElementById('job-title').value.trim();
        const department = document.getElementById('job-dept').value.trim();
        const description = document.getElementById('job-desc').value.trim();
        const requirements = document.getElementById('job-req').value.trim();
        const pdfFile = document.getElementById('job-pdf')?.files?.[0];
        if (!title || !department) { toast('Job Title and Department are required', 'error'); return; }
        if (!pdfFile) { toast('Please select a Job Posting PDF', 'error'); return; }
        if (!isPdfFile(pdfFile)) { toast('Selected file must be a PDF', 'error'); return; }

        const fd = new FormData();
        fd.append('title', title);
        fd.append('department', department);
        fd.append('description', description);
        fd.append('requirements', requirements);
        fd.append('status', 'Open');
        fd.append('postedOn', new Date().toISOString().split('T')[0]);
        fd.append('applicants', '0');
        fd.append('pdf', pdfFile);

        try {
          const res = await API.createJobWithPdf(fd);
          if (!res) throw new Error('No response from server');
          Store.addJob(res);
          closeModal();
          toast('Job posted successfully', 'success');
          render();
        } catch (e) {
          toast(`Failed to post job: ${e.message}`, 'error');
        }
      });
    });

    const btnUploadPerf = document.getElementById('btn-upload-perf-template');
    if (btnUploadPerf) {
      btnUploadPerf.onclick = () => {
        openModal('Upload Performance Template', `
          <div class="form-group">
            <label>Template File (PDF)</label>
            <input type="file" id="perf-template-file" accept=".pdf" />
          </div>
        `, `<button class="btn btn-secondary" id="btn-cancel-perf-template">Cancel</button>
            <button class="btn btn-primary" id="btn-save-perf-template">Upload</button>`);

        const cancelBtn = document.getElementById('btn-cancel-perf-template');
        if (cancelBtn) cancelBtn.onclick = closeModal;

        document.getElementById('btn-save-perf-template').onclick = async () => {
          const file = document.getElementById('perf-template-file').files[0];
          if (!file) return toast('Please select a PDF file', 'error');
          const fd = new FormData();
          fd.append('file', file);
          try {
            await API.uploadPerformanceTemplate(fd);
            toast('Template uploaded successfully', 'success');
            closeModal();
            syncFromApi().then(render);
          } catch (e) { toast(e.message, 'error'); }
        };
      };
    }

    const btnSetPerf = document.getElementById('btn-set-performance');
    if (btnSetPerf) {
      btnSetPerf.onclick = () => {
        openModal('Set Performance Goal', `
          <div class="form-group">
            <label>Employee ID</label>
            <input type="text" id="perf-emp-id" placeholder="e.g. SG00012" />
          </div>
          <div class="form-group">
            <label>Employee Name</label>
            <input type="text" id="perf-emp-name" placeholder="e.g. Rahul Sharma" />
          </div>
          <div class="form-group">
            <label>Goal / Performance Title</label>
            <input type="text" id="perf-goal-title" placeholder="e.g. Annual Review 2024" />
          </div>
          <div class="form-group">
            <label>Probation Period Status</label>
            <input type="text" id="perf-probation" placeholder="e.g. 6 Months / Completed" />
          </div>
          <div class="form-group">
            <label>Performance Document (PDF)</label>
            <input type="file" id="perf-doc" accept=".pdf" />
          </div>
        `, `
          <button class="btn btn-secondary" id="btn-cancel-perf-goal">Cancel</button>
          <button class="btn btn-primary" id="btn-save-perf-goal">Create Record</button>
        `);

        const cancelGoalBtn = document.getElementById('btn-cancel-perf-goal');
        if (cancelGoalBtn) cancelGoalBtn.onclick = closeModal;

        document.getElementById('btn-save-perf-goal').onclick = async () => {
          const employeeId = document.getElementById('perf-emp-id').value.trim();
          const employeeName = document.getElementById('perf-emp-name').value.trim();
          const goal = document.getElementById('perf-goal-title').value.trim();
          const probationPeriod = document.getElementById('perf-probation').value.trim();
          const file = document.getElementById('perf-doc').files[0];

          if (!employeeId || !employeeName || !goal || !file) {
            return toast('Employee ID, Name, Goal, and Performance Document are required', 'error');
          }

          const fd = new FormData();
          fd.append('employeeId', employeeId);
          fd.append('employeeName', employeeName);
          fd.append('goal', goal);
          fd.append('probationPeriod', probationPeriod);
          fd.append('progress', '0');
          fd.append('reviewStatus', 'In Progress');
          fd.append('file', file);

          try {
            await API.createPerformance(fd);
            toast('Performance record created', 'success');
            closeModal();
            syncFromApi().then(render);
          } catch (e) { toast(e.message, 'error'); }
        };
      };
    }

    document.querySelectorAll('[data-download-perf-template]').forEach(btn => {
      btn.onclick = () => {
        const url = API.downloadPerformanceTemplateUrl(btn.dataset.downloadPerfTemplate);
        const card = btn.closest('.info-card');
        const name = card ? card.querySelector('h4').textContent.trim() : 'performance-template';
        downloadWithAuth(url, `${name.replace(/\s+/g, '_')}.pdf`);
      };
    });

    document.querySelectorAll('[data-upload-perf-review]').forEach(btn => {
      btn.onclick = () => {
        const goalId = btn.dataset.uploadPerfReview;
        openModal('Upload Completed Review', `
          <div class="form-group">
            <label>Filled Review Form (PDF)</label>
            <input type="file" id="perf-review-file" accept=".pdf" />
          </div>
          <div class="form-group">
            <label>Final Progress (%)</label>
            <input type="number" id="perf-review-progress" min="0" max="100" value="100" />
          </div>
        `, `<button class="btn btn-secondary" id="btn-cancel-perf-review">Cancel</button>
            <button class="btn btn-primary" id="btn-save-perf-review">Submit Review</button>`);

        const cancelReviewBtn = document.getElementById('btn-cancel-perf-review');
        if (cancelReviewBtn) cancelReviewBtn.onclick = closeModal;

        document.getElementById('btn-save-perf-review').onclick = async () => {
          const file = document.getElementById('perf-review-file').files[0];
          const progress = document.getElementById('perf-review-progress').value;
          if (!file) return toast('Please select the completed PDF', 'error');
          const fd = new FormData();
          fd.append('file', file);
          fd.append('progress', progress);
          fd.append('reviewStatus', 'Completed');
          try {
            const res = await API.uploadPerformanceReview(goalId, fd);
            if (res) {
              Store.updatePerformance(goalId, res);
              toast('Review submitted successfully', 'success');
              closeModal();
              render();
            }
          } catch (e) { toast(e.message, 'error'); }
        };
      };
    });

    document.querySelectorAll('[data-view-perf-review]').forEach(btn => {
      btn.onclick = () => {
        const url = API.getPerformanceReviewUrl(btn.dataset.viewPerfReview);
        downloadWithAuth(url, 'performance-review.pdf');
      };
    });

    document.getElementById('btn-process-payroll')?.addEventListener('click', () => {
      const allEmployees = Store.getEmployees();
      const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const currentYear = new Date().getFullYear();
      
      openModal('Upload/Process Payslip', `
        <form id="payroll-upload-form">
          <div class="form-group">
            <label>Select Employee</label>
            <input type="text" id="pay-emp-id" list="pay-emp-list" placeholder="Type to search employee..." required />
            <datalist id="pay-emp-list">
              ${allEmployees.map(e => `<option value="${e.employeeId}">${e.name} (${e.employeeId})</option>`).join('')}
            </datalist>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Month</label>
              <select id="pay-month" required>
                ${months.map(m => `<option>${m} ${currentYear}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Status</label>
              <select id="pay-status">
                <option>Paid</option>
                <option>Processing</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Gross Salary (₹)</label>
              <input type="number" id="pay-gross" placeholder="e.g. 50000" required />
            </div>
            <div class="form-group">
              <label>Net Salary (₹)</label>
              <input type="number" id="pay-net" placeholder="e.g. 45000" required />
            </div>
          </div>
          <div class="form-group">
            <label>Upload Payslip PDF <span class="required">*</span></label>
            <input type="file" id="pay-file" accept=".pdf" required />
          </div>
        </form>
      `, `
        <button class="btn btn-secondary" id="pay-cancel">Cancel</button>
        <button class="btn btn-primary" id="pay-submit">Upload Payslip</button>
      `);

      document.getElementById('pay-cancel').onclick = closeModal;
      document.getElementById('pay-submit').onclick = async () => {
        const empIdInput = document.getElementById('pay-emp-id');
        const fileInput = document.getElementById('pay-file');
        
        if(!empIdInput.value || !fileInput.files[0]) return toast('Employee and PDF file are required', 'error');

        const selectedEmp = allEmployees.find(e => e.employeeId === empIdInput.value);
        if(!selectedEmp) return toast('Please select a valid employee from the list', 'error');

        const fd = new FormData();
        fd.append('employeeId', selectedEmp.employeeId);
        fd.append('employeeName', selectedEmp.name);
        fd.append('month', document.getElementById('pay-month').value);
        fd.append('gross', document.getElementById('pay-gross').value);
        fd.append('net', document.getElementById('pay-net').value);
        fd.append('status', document.getElementById('pay-status').value);
        fd.append('file', fileInput.files[0]);
        
        const res = await API.createPayroll(fd);
        if(res) {
          toast(`Payslip uploaded for ${selectedEmp.name}`, 'success');
          closeModal();
          syncFromApi().then(render);
        }
      };
    });

    const btnUploadForm16 = document.getElementById('btn-upload-form16');
    if (btnUploadForm16) {
      btnUploadForm16.onclick = () => {
        const allEmployees = Store.getEmployees();
        openModal('Upload Form 16', `
          <form id="f16-upload-form">
            <div class="form-group">
              <label>Select Employee</label>
              <input type="text" id="f16-emp-id" list="f16-emp-list" placeholder="Type to search employee..." required />
              <datalist id="f16-emp-list">
                ${allEmployees.map(e => `<option value="${e.employeeId}">${e.name} (${e.employeeId})</option>`).join('')}
              </datalist>
            </div>
            <div class="form-group">
              <label>Financial Year</label>
              <select id="f16-year" required>
                <option>2024-25</option>
                <option>2025-26</option>
              </select>
            </div>
            <div class="form-group">
              <label>Form 16 PDF <span class="required">*</span></label>
              <input type="file" id="f16-file" accept=".pdf" required />
            </div>
          </form>
        `, `
          <button class="btn btn-secondary" id="f16-cancel" type="button">Cancel</button>
          <button class="btn btn-primary" id="f16-upload" type="button">Upload Form 16</button>
        `);

        document.getElementById('f16-cancel').onclick = closeModal;
        document.getElementById('f16-upload').onclick = async () => {
          const empIdInput = document.getElementById('f16-emp-id');
          const fileInput = document.getElementById('f16-file');
          if (!empIdInput.value || !fileInput.files[0]) return toast('Employee and PDF are required', 'error');

          const selectedEmp = allEmployees.find(e => e.employeeId === empIdInput.value);
          if(!selectedEmp) return toast('Please select a valid employee from the list', 'error');

          const fd = new FormData();
          fd.append('employeeId', selectedEmp.employeeId);
          fd.append('employeeName', selectedEmp.name);
          fd.append('financialYear', document.getElementById('f16-year').value);
          fd.append('documentType', 'Form 16');
          fd.append('file', fileInput.files[0]);

          const res = await API.uploadTaxForm(fd);
          if (res) {
            toast('Form 16 uploaded successfully', 'success');
            closeModal();
            syncFromApi().then(render);
          }
        };
      };
    }

    document.querySelectorAll('[data-download-tax-form]').forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.downloadTaxForm;
        const url = API.getTaxFormDownloadUrl(id);
        downloadWithAuth(url, 'Form-16.pdf');
      };
    });

    document.getElementById('btn-add-referral')?.addEventListener('click', () => {
      const openJobs = Store.getJobs().filter(j => j.status === 'Open');
      if (!openJobs.length) return toast('No open positions currently available for referral', 'info');

      openModal('Add Referral', `
        <form id="referral-form">
          <div class="form-group">
            <label>Candidate Name <span class="required">*</span></label>
            <input type="text" id="ref-name" placeholder="Full name of candidate" required />
          </div>
          <div class="form-group">
            <label>Position to Apply For <span class="required">*</span></label>
            <select id="ref-job" required>
              <option value="" disabled selected>Select an open role</option>
              ${openJobs.map(j => `<option value="${escAttr(j.title)}">${escAttr(j.title)} (${escAttr(j.department)})</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Resume (PDF) <span class="required">*</span></label>
            <input type="file" id="ref-resume" accept=".pdf" required />
          </div>
        </form>
      `, `
        <button class="btn btn-secondary" id="ref-cancel" type="button">Cancel</button>
        <button class="btn btn-primary" id="ref-submit" type="button">Submit Referral</button>
      `);

      document.getElementById('ref-cancel').onclick = closeModal;
      document.getElementById('ref-submit').onclick = async () => {
        const name = document.getElementById('ref-name').value.trim();
        const job = document.getElementById('ref-job').value;
        const file = document.getElementById('ref-resume').files[0];

        if (!name || !job || !file) return toast('Please fill in all fields', 'error');
        if (!isPdfFile(file)) return toast('Resume must be a PDF file', 'error');

        const currentUser = Store.getUser();
        const fd = new FormData();
        fd.append('name', name);
        fd.append('job', job);
        fd.append('stage', 'New');
        fd.append('appliedOn', new Date().toISOString().split('T')[0]);
        fd.append('referredBy', currentUser ? `${currentUser.name} (${currentUser.employeeId})` : 'System');
        fd.append('file', file);

        try {
          const res = await API.createCandidateWithResume(fd);
          if (res) {
            toast('Referral submitted successfully!', 'success');
            closeModal();
            syncFromApi().then(render);
          }
        } catch (e) {
          toast(e.message, 'error');
        }
      };
    });
  }
  
  function bindEvents() { // Global events, not page-specific
    const user = Store.getUser();
    if (!user) {
      document.getElementById('show-setup')?.addEventListener('click', () => {
        document.getElementById('login-panel').classList.add('hidden');
        document.getElementById('setup-panel').classList.remove('hidden');
      });
      document.getElementById('show-login')?.addEventListener('click', () => {
        document.getElementById('setup-panel').classList.add('hidden');
        document.getElementById('login-panel').classList.remove('hidden');
      });

      document.getElementById('setup-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('setup-name').value.trim();
        const email = document.getElementById('setup-email').value.trim();
        const gmail = document.getElementById('setup-gmail').value.trim();
        const employeeId = document.getElementById('setup-employeeId').value.trim().toUpperCase();
        const password = document.getElementById('setup-password').value;

        const idErr = Validators.employeeId(employeeId);
        const mailErr = Validators.officeMail(email);
        const gmailErr = Validators.personalEmail(gmail);
        if (idErr) { toast(idErr, 'error'); return; }
        if (mailErr) { toast(mailErr, 'error'); return; }
        if (gmailErr) { toast(gmailErr, 'error'); return; }
        if (password.length < 6) { toast('Password must be at least 6 characters', 'error'); return; }

        try {
          const apiUser = await API.register({ name, email, password, role: 'admin', employeeId });
          Store.clearAllData();
          Store.setUser(apiUser);
          await API.createEmployee({
            employeeId, name, email: gmail, officeMail: email,
            department: 'Admin', role: 'admin', joinDate: new Date().toISOString().split('T')[0]
          });
          currentPage = 'dashboard';
          toast('Admin account created. Welcome!', 'success');
          render();
        } catch (err) {
          toast(err.message, 'error');
        }
      });

      document.getElementById('login-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        try {
          const apiUser = await API.login(email, password);
          if (!apiUser?.token) {
            toast('Invalid email or password', 'error');
            return;
          }
          Store.clearAllData();
          Store.setUser(apiUser);
          currentPage = 'dashboard';
          currentSubPage = {};
          toast('Welcome!', 'success');
          render();
        } catch (err) {
          toast(err.message, 'error');
        }
      });
      return;
    }

    document.querySelectorAll('[data-page]').forEach(btn => {
      btn.addEventListener('click', () => navigate(btn.dataset.page));
    });

    document.getElementById('btn-logout')?.addEventListener('click', () => {
      Store.clearAllData();
      Store.clearUser();
      currentPage = 'dashboard';
      currentSubPage = {};
      toast('Logged out');
      render();
    });

    document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
      if (e.target.id === 'modal-overlay') closeModal();
    });
  }

  function init() { render(); }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => App.init());
