export type EnvironmentName = "local" | "integration" | "production";
export type FeatureFlagName = "generateSimpleEnabled";

export interface FeatureFlagsConfig {
  generateSimpleEnabled: boolean;
}

const ENV_NAME_ALIASES: Record<string, EnvironmentName> = {
  local: "local",
  integration: "integration",
  prod: "production",
  production: "production",
};

const FEATURE_FLAGS_BY_ENV: Record<EnvironmentName, FeatureFlagsConfig> = {
  local: {
    generateSimpleEnabled: true,
  },
  integration: {
    generateSimpleEnabled: true,
  },
  production: {
    generateSimpleEnabled: true,
  },
};

export function resolveEnvironmentName(rawEnvName: string | undefined): EnvironmentName {
  if (!rawEnvName) {
    throw new Error("ENV_NAME is required to resolve feature flags.");
  }

  const normalized = rawEnvName.trim().toLowerCase();
  const resolved = ENV_NAME_ALIASES[normalized];
  if (!resolved) {
    throw new Error(`Unsupported ENV_NAME: ${rawEnvName}`);
  }

  return resolved;
}

export function getFeatureFlags(envName: string | undefined): FeatureFlagsConfig {
  return FEATURE_FLAGS_BY_ENV[resolveEnvironmentName(envName)];
}

export function isFeatureEnabled(flag: FeatureFlagName, envName: string | undefined): boolean {
  return getFeatureFlags(envName)[flag];
}

export function getEnvNameFromRuntime(): string | undefined {
  const processEnvName = typeof process !== "undefined" ? process.env?.ENV_NAME : undefined;
  const metaEnv = typeof import.meta !== "undefined" ? import.meta.env : undefined;

  return processEnvName ?? metaEnv?.PUBLIC_ENV_NAME ?? metaEnv?.ENV_NAME;
}
