export const PASSWORD_RULES = [
  { test: (p) => p.length >= 10, label: "At least 10 characters" },
  { test: (p) => /[A-Z]/.test(p), label: "One uppercase letter" },
  { test: (p) => /[a-z]/.test(p), label: "One lowercase letter" },
  { test: (p) => /[0-9]/.test(p), label: "One number" },
  { test: (p) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~]/.test(p), label: "One special character" },
];
