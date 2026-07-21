// `key` maps to an i18n label under the `common` namespace (used by the public
// Register page); `label` is the English fallback used by the in-app user forms.
export const PASSWORD_RULES = [
  { key: "pwdLen", test: (p) => p.length >= 10, label: "At least 10 characters" },
  { key: "pwdUpper", test: (p) => /[A-Z]/.test(p), label: "One uppercase letter" },
  { key: "pwdLower", test: (p) => /[a-z]/.test(p), label: "One lowercase letter" },
  { key: "pwdNumber", test: (p) => /[0-9]/.test(p), label: "One number" },
  { key: "pwdSpecial", test: (p) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~]/.test(p), label: "One special character" },
];
