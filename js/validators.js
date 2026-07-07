const Validators = (() => {
  const patterns = {
    employeeId: /^SG00[A-Za-z0-9]+$/,
    officeMail: /^[a-zA-Z0-9._%+-]+@simbiotiktech\.com$/,
    personalEmail: /^[a-zA-Z0-9._%+-]+@gmail\.com$/,
    pan: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
    aadhaar: /^[0-9]{12}$/,
    uan: /^[0-9]{12}$/,
    mobile: /^[6-9][0-9]{9}$/,
    bankAccount: /^[0-9]{9,18}$/,
    ifsc: /^[A-Z]{4}0[A-Z0-9]{6}$/
  };

  function test(pattern, value, label) {
    if (!value?.trim()) return `${label} is required`;
    if (!pattern.test(value.trim())) return `Invalid ${label}`;
    return null;
  }

  function calculateAge(value) {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
      age -= 1;
    }
    return age;
  }

  function age(value, label, minAge = 18) {
    if (!value?.trim()) return `${label} is required`;
    const ageValue = calculateAge(value);
    if (ageValue === null) return `Invalid ${label}`;
    if (ageValue < minAge) return 'Employee must be at least 18 years old to be onboarded.';
    return null;
  }

  return {
    employeeId: (v) => test(patterns.employeeId, v, 'Employee ID (format: SG00xxx)'),
    officeMail: (v) => test(patterns.officeMail, v, 'Office Mail (@simbiotiktech.com)'),
    personalEmail: (v) => test(patterns.personalEmail, v, 'Personal Email (Gmail)'),
    pan: (v) => test(patterns.pan, v.toUpperCase(), 'PAN Number'),
    aadhaar: (v) => test(patterns.aadhaar, v.replace(/\s/g, ''), 'Aadhaar Number'),
    uan: (v) => test(patterns.uan, v.replace(/\s/g, ''), 'UAN Number'),
    pf: (v) => {
      const val = v?.trim().toUpperCase();
      if (!val) return 'PF Number is required';
      if (val.length < 10 || val.length > 22) return 'Invalid PF Number';
      return null;
    },
    mobile: (v) => test(patterns.mobile, v.replace(/\s/g, ''), 'Mobile Number'),
    bankAccount: (v) => test(patterns.bankAccount, v.replace(/\s/g, ''), 'Account Number'),
    ifsc: (v) => test(patterns.ifsc, v.toUpperCase(), 'IFSC Code'),
    age,
    calculateAge,
    required: (v, label) => (!v?.trim() ? `${label} is required` : null)
  };
})();
