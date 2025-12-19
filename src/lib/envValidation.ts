interface EnvVar {
  key: string;
  description: string;
  required: boolean;
}

const envVars: EnvVar[] = [
  { key: 'VITE_SUPABASE_URL', description: 'Backend API URL', required: true },
  { key: 'VITE_SUPABASE_PUBLISHABLE_KEY', description: 'Backend Public Key', required: true },
  { key: 'VITE_SUPABASE_PROJECT_ID', description: 'Project Identifier', required: false },
  { key: 'VITE_SENTRY_DSN', description: 'Error Monitoring DSN', required: false },
];

export interface ValidationResult {
  isValid: boolean;
  missingRequired: { key: string; description: string }[];
  missingRecommended: { key: string; description: string }[];
}

export function validateEnv(): ValidationResult {
  const missingRequired: { key: string; description: string }[] = [];
  const missingRecommended: { key: string; description: string }[] = [];

  for (const envVar of envVars) {
    const value = (import.meta.env as Record<string, string | undefined>)[envVar.key];
    if (!value || value.trim() === '') {
      if (envVar.required) {
        missingRequired.push({ key: envVar.key, description: envVar.description });
      } else {
        missingRecommended.push({ key: envVar.key, description: envVar.description });
      }
    }
  }

  return {
    isValid: missingRequired.length === 0,
    missingRequired,
    missingRecommended,
  };
}

export function logEnvWarnings(result: ValidationResult): void {
  if (import.meta.env.DEV && result.missingRecommended.length > 0) {
    console.warn(
      '⚠️ Missing recommended environment variables:',
      result.missingRecommended.map((v) => `${v.key} (${v.description})`).join(', ')
    );
  }
}
