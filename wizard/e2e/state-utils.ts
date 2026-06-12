import { defaultConfig } from '../src/config/defaults';
import type { WizardConfig } from '../src/config/schema';

const BASE64_URL_PAD_REGEX = /=+$/;

function base64UrlEncode(value: string): string {
  const base64 = Buffer.from(value, 'utf-8').toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(BASE64_URL_PAD_REGEX, '');
}

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

function cloneDefaults(): WizardConfig {
  return JSON.parse(JSON.stringify(defaultConfig)) as WizardConfig;
}

function mergeDeep<T extends Record<string, unknown>>(target: T, source?: DeepPartial<T>): T {
  if (!source) return target;
  const result = { ...target } as Record<string, unknown>;
  for (const key of Object.keys(source)) {
    const sourceValue = source[key as keyof DeepPartial<T>];
    const targetValue = target[key as keyof T];
    if (
      sourceValue &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      targetValue &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue)
    ) {
      result[key] = mergeDeep(
        targetValue as Record<string, unknown>,
        sourceValue as Record<string, unknown>,
      );
    } else if (sourceValue !== undefined) {
      result[key] = sourceValue as unknown;
    }
  }
  return result as T;
}

export function buildWizardState(overrides?: DeepPartial<WizardConfig>): string {
  const base = cloneDefaults();
  const merged = mergeDeep(base, overrides as DeepPartial<WizardConfig>);
  const json = JSON.stringify(merged);
  return base64UrlEncode(json);
}

export function buildWizardUrl(overrides?: DeepPartial<WizardConfig>): string {
  const encoded = buildWizardState(overrides);
  return `/?wizard=${encoded}`;
}
