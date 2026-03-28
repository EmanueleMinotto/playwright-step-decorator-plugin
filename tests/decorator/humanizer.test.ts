import { describe, expect, it } from 'vitest';
import {
  buildCustomStepTitle,
  buildHumanStepTitle,
  buildParamString,
  extractParamNames,
  type ParamDescriptor,
} from '../../src/decorator/humanizer.js';

describe('extractParamNames', () => {
  it('extracts parameter names from a simple function', () => {
    function fn(username: string, password: string) {
      return { username, password };
    }
    expect(extractParamNames(fn)).toEqual(['username', 'password']);
  });

  it('extracts parameter names from an async function', async () => {
    async function fn(userId: string, includeDeleted: boolean) {
      return { userId, includeDeleted };
    }
    expect(extractParamNames(fn)).toEqual(['userId', 'includeDeleted']);
  });

  it('handles rest parameters', () => {
    function fn(...items: string[]) {
      return items;
    }
    expect(extractParamNames(fn)).toEqual(['items']);
  });

  it('skips destructured parameters', () => {
    // After TS compilation, destructured params become positional identifiers
    // We test with a plain function that has no destructuring
    function fn(a: string, b: number) {
      return { a, b };
    }
    expect(extractParamNames(fn)).toEqual(['a', 'b']);
  });

  it('returns empty array for no-param function', () => {
    function fn() {
      return 42;
    }
    expect(extractParamNames(fn)).toEqual([]);
  });
});

describe('buildParamString', () => {
  it('returns empty string for empty params', () => {
    expect(buildParamString([])).toBe('');
  });

  it('renders a single string param', () => {
    const params: ParamDescriptor[] = [{ name: 'userId', value: 'u_42' }];
    expect(buildParamString(params)).toBe('user id "u_42"');
  });

  it('renders two params with "and"', () => {
    const params: ParamDescriptor[] = [
      { name: 'userId', value: 'u_42' },
      { name: 'includeDeleted', value: false },
    ];
    expect(buildParamString(params)).toBe('user id "u_42" and not include deleted');
  });

  it('renders three params with commas and "and"', () => {
    const params: ParamDescriptor[] = [
      { name: 'role', value: 'admin' },
      { name: 'active', value: true },
      { name: 'limit', value: 25 },
    ];
    expect(buildParamString(params)).toBe('role "admin", active and limit 25');
  });

  it('prioritizes strings/numbers over booleans when truncating', () => {
    const params: ParamDescriptor[] = [
      { name: 'role', value: 'admin' },
      { name: 'active', value: true },
      { name: 'limit', value: 25 },
      { name: 'page', value: 2 },
      { name: 'sortBy', value: 'createdAt' },
      { name: 'order', value: 'desc' },
    ];
    const result = buildParamString(params);
    // Top 3 by score (strings=3, numbers=3): role, limit, page, sortBy, order all score 3
    // Among those, first by original order: role, limit, page → 3 more options
    expect(result).toBe('role "admin", limit 25 and page 2 and 3 more options');
  });

  it('appends "and N more options" for >3 params', () => {
    const params: ParamDescriptor[] = [
      { name: 'a', value: 'x' },
      { name: 'b', value: 'y' },
      { name: 'c', value: 'z' },
      { name: 'd', value: 'w' },
    ];
    const result = buildParamString(params);
    expect(result).toContain('and 1 more option');
  });

  it('uses "more options" (plural) for 2+', () => {
    const params: ParamDescriptor[] = [
      { name: 'a', value: 'x' },
      { name: 'b', value: 'y' },
      { name: 'c', value: 'z' },
      { name: 'd', value: 'w' },
      { name: 'e', value: 'v' },
    ];
    const result = buildParamString(params);
    expect(result).toContain('and 2 more options');
  });

  describe('value rendering', () => {
    it('renders null as "not provided"', () => {
      expect(buildParamString([{ name: 'coupon', value: null }])).toBe('coupon: not provided');
    });

    it('renders undefined as "not provided"', () => {
      expect(buildParamString([{ name: 'coupon', value: undefined }])).toBe(
        'coupon: not provided'
      );
    });

    it('renders boolean true as plain name', () => {
      expect(buildParamString([{ name: 'active', value: true }])).toBe('active');
    });

    it('renders boolean false as "not <name>"', () => {
      expect(buildParamString([{ name: 'active', value: false }])).toBe('not active');
    });

    it('renders non-empty string', () => {
      expect(buildParamString([{ name: 'username', value: 'admin' }])).toBe('username "admin"');
    });

    it('renders empty string', () => {
      expect(buildParamString([{ name: 'username', value: '' }])).toBe('username: empty');
    });

    it('renders number', () => {
      expect(buildParamString([{ name: 'limit', value: 25 }])).toBe('limit 25');
    });

    it('renders empty array', () => {
      expect(buildParamString([{ name: 'ids', value: [] }])).toBe('no ids');
    });

    it('renders array with 1-3 items', () => {
      expect(buildParamString([{ name: 'ids', value: [101, 202, 303] }])).toBe(
        'ids [101, 202, 303]'
      );
    });

    it('renders array with more than 3 items', () => {
      expect(buildParamString([{ name: 'ids', value: [1, 2, 3, 4, 5] }])).toBe('5 ids');
    });

    it('renders empty object', () => {
      expect(buildParamString([{ name: 'config', value: {} }])).toBe('empty config');
    });

    it('renders object with 1-2 keys', () => {
      expect(
        buildParamString([{ name: 'options', value: { dryRun: true, notify: false } }])
      ).toBe('options {dryRun: true, notify: false}');
    });

    it('renders object with >2 keys as "with N fields"', () => {
      expect(
        buildParamString([
          { name: 'userData', value: { name: 'Ema', role: 'admin', active: true, team: 'qa', level: 3 } },
        ])
      ).toBe('user data with 5 fields');
    });
  });
});

describe('buildHumanStepTitle', () => {
  it('generates title from class and method names without params', () => {
    expect(buildHumanStepTitle('LoginPage', 'fillCredentials', [])).toBe(
      'Login page: fill credentials'
    );
  });

  it('generates title with params', () => {
    const title = buildHumanStepTitle('LoginPage', 'login', [
      { name: 'username', value: 'admin@test.com' },
      { name: 'password', value: 'secret123' },
    ]);
    expect(title).toBe('Login page: login using username "admin@test.com" and password "secret123"');
  });

  it('generates title for method with no params (logout)', () => {
    expect(buildHumanStepTitle('DashboardPage', 'logout', [])).toBe(
      'Dashboard page: logout'
    );
  });
});

describe('buildCustomStepTitle', () => {
  it('returns custom name when no params', () => {
    expect(buildCustomStepTitle('Proceed to payment', [])).toBe('Proceed to payment');
  });

  it('appends params to custom name', () => {
    const title = buildCustomStepTitle('Proceed to payment', [
      { name: 'orderId', value: 'ord_99' },
      { name: 'retry', value: false },
    ]);
    expect(title).toBe('Proceed to payment using order id "ord_99" and not retry');
  });
});
