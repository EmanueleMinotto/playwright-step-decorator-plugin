import { describe, expect, it, vi } from 'vitest';
import { step } from '../../src/decorator/index.js';

// Mock @playwright/test so we can test without a real Playwright runner
vi.mock('@playwright/test', () => ({
  test: {
    step: vi.fn((title: string, body: () => Promise<unknown>) => {
      // Store the call and execute the body
      return body();
    }),
  },
}));

import { test as playwrightTest } from '@playwright/test';
const mockedStep = playwrightTest.step as ReturnType<typeof vi.fn>;

describe('@step decorator', () => {
  beforeEach(() => {
    mockedStep.mockClear();
    mockedStep.mockImplementation((_title: string, body: () => Promise<unknown>) => body());
  });

  it('generates humanized title from class + method name (bare usage)', async () => {
    class LoginPage {
      @step
      async login(username: string, password: string) {
        return `${username}:${password}`;
      }
    }

    const page = new LoginPage();
    await page.login('admin', 'secret');

    expect(mockedStep).toHaveBeenCalledOnce();
    expect(mockedStep.mock.calls[0][0]).toBe(
      'Login page: login using username "admin" and password "secret"'
    );
  });

  it('uses custom name when provided as first argument', async () => {
    class CheckoutPage {
      @step('Place order')
      async submitOrder(orderId: string) {
        return orderId;
      }
    }

    await new CheckoutPage().submitOrder('ord_42');

    expect(mockedStep.mock.calls[0][0]).toBe('Place order using order id "ord_42"');
  });

  it('passes options (box, timeout) to test.step', async () => {
    class ProfilePage {
      @step({ box: true, timeout: 5000 })
      async updateAvatar(file: string) {
        return file;
      }
    }

    await new ProfilePage().updateAvatar('/img/avatar.png');

    expect(mockedStep).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Function),
      { box: true, timeout: 5000 }
    );
  });

  it('uses raw ClassName.method when noHumanizer is true', async () => {
    class AdminPage {
      @step({ noHumanizer: true })
      async deleteUser(userId: string) {
        return userId;
      }
    }

    await new AdminPage().deleteUser('u_1');

    expect(mockedStep.mock.calls[0][0]).toBe('AdminPage.deleteUser');
  });

  it('generates title from no-arg method', async () => {
    class DashboardPage {
      @step
      async logout() {
        return true;
      }
    }

    await new DashboardPage().logout();

    expect(mockedStep.mock.calls[0][0]).toBe('Dashboard page: logout');
  });

  it('preserves the return value of the original method', async () => {
    class SearchPage {
      @step
      async getResult() {
        return 42;
      }
    }

    const result = await new SearchPage().getResult();
    expect(result).toBe(42);
  });

  it('combines custom name with options', async () => {
    class CartPage {
      @step('Add to cart', { box: true })
      async addItem(productId: string) {
        return productId;
      }
    }

    await new CartPage().addItem('prod_1');

    expect(mockedStep.mock.calls[0][0]).toBe('Add to cart using product id "prod_1"');
    expect(mockedStep).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Function),
      { box: true, timeout: undefined }
    );
  });

  it('accepts options as sole argument (no custom name)', async () => {
    class SettingsPage {
      @step({ timeout: 3000 })
      async saveSettings(key: string) {
        return key;
      }
    }

    await new SettingsPage().saveSettings('theme');

    expect(mockedStep.mock.calls[0][0]).toBe('Settings page: save settings using key "theme"');
    expect(mockedStep).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Function),
      { box: undefined, timeout: 3000 }
    );
  });
});
