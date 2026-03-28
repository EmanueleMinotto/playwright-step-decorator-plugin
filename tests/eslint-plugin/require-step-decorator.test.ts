import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import { requireStepDecorator } from '../../src/eslint-plugin/rules/require-step-decorator.js';

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: {
    parserOptions: {
      ecmaFeatures: { experimentalDecorators: false },
    },
  },
});

tester.run('require-step-decorator', requireStepDecorator, {
  valid: [
    // POM method with @step (bare)
    {
      code: `
        import { step } from 'playwright-step-decorator-plugin';
        class LoginPage {
          @step
          async login(username: string) {}
        }
      `,
    },
    // POM method with @step(...) factory
    {
      code: `
        import { step } from 'playwright-step-decorator-plugin';
        class SearchPage {
          @step('Search products')
          async search(query: string) {}
        }
      `,
    },
    // Non-POM class — no requirement
    {
      code: `
        class UserService {
          async getUser(id: string) {}
        }
      `,
    },
    // Constructor is excluded
    {
      code: `
        class LoginPage {
          constructor(private page: unknown) {}
        }
      `,
    },
    // Private method excluded
    {
      code: `
        class LoginPage {
          @step
          async login() {}

          private async helper() {}
        }
      `,
    },
    // Getter/setter excluded
    {
      code: `
        class LoginPage {
          @step
          async login() {}

          get url() { return ''; }
        }
      `,
    },
    // Custom pomPattern option
    {
      code: `
        class UserHelper {
          async doThing() {}
        }
      `,
      options: [{ pomPattern: 'Page$' }],
    },
    // Custom decoratorName option
    {
      code: `
        class LoginPage {
          @testStep
          async login() {}
        }
      `,
      options: [{ decoratorName: 'testStep' }],
    },
  ],

  invalid: [
    // POM method missing @step
    {
      code: `
        class LoginPage {
          async login(username: string) {}
        }
      `,
      errors: [
        {
          messageId: 'missingStepDecorator',
          data: { methodName: 'login', className: 'LoginPage', decoratorName: 'step' },
        },
      ],
    },
    // Multiple missing decorators
    {
      code: `
        class SearchPage {
          async search(query: string) {}
          async clearFilters() {}
        }
      `,
      errors: [
        {
          messageId: 'missingStepDecorator',
          data: { methodName: 'search', className: 'SearchPage', decoratorName: 'step' },
        },
        {
          messageId: 'missingStepDecorator',
          data: { methodName: 'clearFilters', className: 'SearchPage', decoratorName: 'step' },
        },
      ],
    },
    // Extends a POM class
    {
      code: `
        class BasePage {}
        class AuthPage extends BasePage {
          async fillForm() {}
        }
      `,
      errors: [
        {
          messageId: 'missingStepDecorator',
          data: { methodName: 'fillForm', className: 'AuthPage', decoratorName: 'step' },
        },
      ],
    },
    // Custom pomPattern match
    {
      code: `
        class UserHelper {
          async doThing() {}
        }
      `,
      options: [{ pomPattern: 'Helper$' }],
      errors: [
        {
          messageId: 'missingStepDecorator',
          data: { methodName: 'doThing', className: 'UserHelper', decoratorName: 'step' },
        },
      ],
    },
    // Component class
    {
      code: `
        class NavComponent {
          async clickLink(text: string) {}
        }
      `,
      errors: [
        {
          messageId: 'missingStepDecorator',
          data: { methodName: 'clickLink', className: 'NavComponent', decoratorName: 'step' },
        },
      ],
    },
  ],
});
