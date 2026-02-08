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
  { key: 'VITE_REVENUECAT_API_KEY', description: 'In-App Purchase API Key', required: false },
];

// Use explicit references so Vite injects these keys into the production bundle.
const envValues = {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  VITE_SUPABASE_PROJECT_ID: import.meta.env.VITE_SUPABASE_PROJECT_ID,
  VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
  VITE_REVENUECAT_API_KEY: import.meta.env.VITE_REVENUECAT_API_KEY,
} as const;

export interface ValidationResult {
  isValid: boolean;
  missingRequired: { key: string; description: string }[];
  missingRecommended: { key: string; description: string }[];
}

export function validateEnv(): ValidationResult {
  const missingRequired: { key: string; description: string }[] = [];
  const missingRecommended: { key: string; description: string }[] = [];

  for (const envVar of envVars) {
    const value = envValues[envVar.key as keyof typeof envValues];
    if (!value || value.trim() === '') {
      if (envVar.required) {
        missingRequired.push({ key: envVar.key, description: envVar.description });
      } else {
        missingRecommended.push({ key: envVar.key, description: envVar.description });
      }
    }
  }

  // RevenueCat is critical for native iOS/Android builds (in-app purchases)
  const isNativeBuild = typeof window !== 'undefined' && !!(window as Record<string, unknown>).Capacitor;
  const rcKey = envValues.VITE_REVENUECAT_API_KEY;
  if (isNativeBuild && (!rcKey || rcKey.trim() === '')) {
    missingRequired.push({ key: 'VITE_REVENUECAT_API_KEY', description: 'In-App Purchase API Key (required for native builds)' });
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
