import { humanize } from '@alduino/humanizer/string';

export interface ParamDescriptor {
  name: string;
  value: unknown;
}

function scoreParam(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'boolean') return 1;
  if (Array.isArray(value) || (typeof value === 'object')) return 2;
  return 3; // string or number
}

function renderParamValue(name: string, value: unknown): string {
  const humanName = humanize(name).toLowerCase();

  if (value === null || value === undefined) {
    return `${humanName}: not provided`;
  }
  if (typeof value === 'boolean') {
    return value ? humanName : `not ${humanName}`;
  }
  if (typeof value === 'string') {
    return value === '' ? `${humanName}: empty` : `${humanName} "${value}"`;
  }
  if (typeof value === 'number') {
    return `${humanName} ${value}`;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return `no ${humanName}`;
    if (value.length <= 3) return `${humanName} [${value.map(v => JSON.stringify(v)).join(', ')}]`;
    return `${value.length} ${humanName}`;
  }
  // object
  const keys = Object.keys(value as object);
  if (keys.length === 0) return `empty ${humanName}`;
  if (keys.length <= 2) {
    const entries = keys.map(k => `${k}: ${JSON.stringify((value as Record<string, unknown>)[k])}`).join(', ');
    return `${humanName} {${entries}}`;
  }
  return `${humanName} with ${keys.length} fields`;
}

function joinParts(parts: string[]): string {
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

export function buildParamString(params: ParamDescriptor[]): string {
  if (params.length === 0) return '';

  let top: ParamDescriptor[];
  let remaining = 0;

  if (params.length <= 3) {
    // All fit — preserve original order
    top = params;
  } else {
    // Select top 3 by significance score, then by original position
    const scored = params.map((p, originalIndex) => ({ ...p, score: scoreParam(p.value), originalIndex }));
    scored.sort((a, b) => {
      const scoreDiff = b.score - a.score;
      return scoreDiff !== 0 ? scoreDiff : a.originalIndex - b.originalIndex;
    });
    top = scored.slice(0, 3);
    remaining = params.length - 3;
  }

  const parts = top.map(p => renderParamValue(p.name, p.value));
  const joined = joinParts(parts);

  if (remaining > 0) {
    return `${joined} and ${remaining} more option${remaining === 1 ? '' : 's'}`;
  }
  return joined;
}

/**
 * Builds a human-readable step title from a class name, method name, and runtime parameters.
 *
 * Format: "<Humanized class>: <humanized method> using <params>"
 *
 * @example
 * buildHumanStepTitle('LoginPage', 'fillCredentials', [])
 * // → "Login page: fill credentials"
 *
 * @example
 * buildHumanStepTitle('LoginPage', 'login', [
 *   { name: 'username', value: 'admin@test.com' },
 *   { name: 'password', value: 'secret' },
 * ])
 * // → 'Login page: login using username "admin@test.com" and password "secret"'
 */
export function buildHumanStepTitle(
  className: string,
  methodName: string,
  params: ParamDescriptor[]
): string {
  const humanClass = humanize(className);
  const humanMethod = humanize(methodName).toLowerCase();
  const base = `${humanClass}: ${humanMethod}`;

  const paramStr = buildParamString(params);
  return paramStr ? `${base} using ${paramStr}` : base;
}

/**
 * Builds a human-readable step title from a custom name and runtime parameters.
 *
 * Format: "<custom name> using <params>"
 *
 * @example
 * buildCustomStepTitle('Proceed to payment', [
 *   { name: 'orderId', value: 'ord_99' },
 *   { name: 'retry', value: false },
 * ])
 * // → 'Proceed to payment using order id "ord_99" and not retry'
 */
export function buildCustomStepTitle(customName: string, params: ParamDescriptor[]): string {
  const paramStr = buildParamString(params);
  return paramStr ? `${customName} using ${paramStr}` : customName;
}

/**
 * Extracts parameter names from a function's source code via toString().
 * Handles camelCase, default values and rest params; skips destructured params.
 */
export function extractParamNames(fn: (...args: unknown[]) => unknown): string[] {
  const fnStr = fn.toString();
  const match = fnStr.match(/\(([^)]*)\)/);
  if (!match || !match[1].trim()) return [];

  return match[1]
    .split(',')
    .map(param => {
      const name = param
        .trim()
        .replace(/^\.\.\./, '') // rest params
        .split(/[\s=]/)[0]      // default values
        .trim();
      // Skip destructured params ({ ... } or [ ... ])
      return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name) ? name : null;
    })
    .filter((name): name is string => name !== null && name.length > 0);
}
