import { wizardConfigSchema } from '../config/schema';
import type { WizardConfig } from '../config/schema';
import { defaultConfig } from '../config/defaults';
import { deepSafeCopy, isDangerousKey } from './escaping';

const SHARE_PARAM = 'wizard';
const MAX_ENCODED_LENGTH = 4000;
const MAX_DECODED_BYTES = 16000;

/**
 * Base64url encode (URL-safe: no +, / or padding in output).
 */
function base64UrlEncode(str: string): string {
  const base64 = btoa(unescape(encodeURIComponent(str)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Decode base64 or base64url to string.
 * Handles URL corruption: spaces in query string (from +) are restored to +.
 */
function base64Decode(encoded: string): string {
  const normalized = encoded.replace(/ /g, '+').replace(/-/g, '+').replace(/_/g, '/');
  const pad = normalized.length % 4;
  const base64 = pad ? normalized + '===='.slice(0, 4 - pad) : normalized;
  try {
    const binary = atob(base64);
    try {
      return decodeURIComponent(escape(binary));
    } catch {
      return binary;
    }
  } catch {
    return '';
  }
}

/** Top-level keys that are discriminated unions; we pass through raw shape so all variants (e.g. postgres) are preserved. */
const DISCRIMINATED_UNION_KEYS = new Set(['storage', 'cache']);

/**
 * Recursively merge only keys that exist on the default object.
 * Prevents prototype pollution and unknown keys.
 * Discriminated union keys (storage, cache) are passed through from raw so postgres/dynamodb/redis variants are preserved.
 */
function sanitizeShape<T>(raw: unknown, defaults: T): T {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return defaults;
  }
  const obj = raw as Record<string, unknown>;
  const result = { ...defaults } as Record<string, unknown>;
  const defaultKeys = defaults as Record<string, unknown>;
  for (const key of Object.keys(defaultKeys)) {
    // Skip dangerous keys at all levels
    if (isDangerousKey(key)) continue;

    const defaultVal = defaultKeys[key];
    const rawVal = obj[key];
    if (rawVal === undefined) continue;
    if (DISCRIMINATED_UNION_KEYS.has(key)) {
      if (typeof rawVal === 'object' && rawVal !== null && !Array.isArray(rawVal)) {
        // Use recursive deep safe copy to protect against nested prototype pollution
        result[key] = deepSafeCopy(rawVal as Record<string, unknown>);
      }
      continue;
    }
    if (typeof defaultVal === 'object' && defaultVal !== null && !Array.isArray(defaultVal)) {
      if (typeof rawVal === 'object' && rawVal !== null && !Array.isArray(rawVal)) {
        result[key] = sanitizeShape(rawVal, defaultVal);
      }
    } else {
      result[key] = rawVal;
    }
  }
  return result as T;
}

/**
 * Build a share URL for the current origin with the given config encoded in the query string.
 */
export function buildShareUrl(config: WizardConfig): string {
  const json = JSON.stringify(config);
  const encoded = base64UrlEncode(json);
  if (encoded.length > MAX_ENCODED_LENGTH) {
    return getCurrentWizardUrl();
  }
  const url = new URL(getCurrentWizardUrl());
  url.searchParams.set(SHARE_PARAM, encoded);
  return url.toString();
}

/**
 * Parse and sanitize config from the current page URL.
 * Returns null if no param, invalid payload, or validation fails.
 */
export function parseShareUrl(): WizardConfig | null {
  if (typeof window === 'undefined') return null;
  const url = new URL(window.location.href);
  const encoded = url.searchParams.get(SHARE_PARAM);
  if (!encoded || encoded.length > MAX_ENCODED_LENGTH) {
    return null;
  }

  const json = base64Decode(encoded);
  if (!json) return null;

  if (new Blob([json]).size > MAX_DECODED_BYTES) return null;

  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return null;
  }

  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }

  const sanitized = sanitizeShape(raw, defaultConfig);
  const result = wizardConfigSchema.safeParse(sanitized);
  if (result.success) {
    return result.data;
  }
  return null;
}

/**
 * Base URL of the wizard (current origin + pathname, no search).
 */
export function getCurrentWizardUrl(): string {
  return window.location.origin + window.location.pathname;
}
