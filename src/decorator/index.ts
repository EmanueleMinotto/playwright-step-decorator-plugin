import { test } from '@playwright/test';
import {
  buildCustomStepTitle,
  buildHumanStepTitle,
  extractParamNames,
  type ParamDescriptor,
} from './humanizer.js';
import type { StepOptions } from './types.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyMethod = (this: any, ...args: unknown[]) => unknown;
type StepDecorator = (target: AnyMethod, context: ClassMethodDecoratorContext) => AnyMethod;

function isDecoratorContext(v: unknown): v is ClassMethodDecoratorContext {
  return typeof v === 'object' && v !== null && (v as ClassMethodDecoratorContext).kind === 'method';
}

function isStepOptions(v: unknown): v is StepOptions {
  if (typeof v !== 'object' || v === null) return false;
  const allowedKeys = new Set(['box', 'timeout', 'noHumanizer']);
  return Object.keys(v).every(k => allowedKeys.has(k));
}

function applyStep(
  target: AnyMethod,
  context: ClassMethodDecoratorContext,
  customName: string | undefined,
  opts: StepOptions
): AnyMethod {
  const paramNames = extractParamNames(target);

  return function (this: any, ...args: unknown[]): unknown {
    let stepTitle: string;

    if (opts.noHumanizer) {
      stepTitle = `${this.constructor.name}.${String(context.name)}`;
    } else {
      const params: ParamDescriptor[] = paramNames.map((name, i) => ({ name, value: args[i] }));

      if (customName !== undefined) {
        stepTitle = buildCustomStepTitle(customName, params);
      } else {
        stepTitle = buildHumanStepTitle(
          this.constructor.name,
          String(context.name),
          params
        );
      }
    }

    return test.step(stepTitle, () => target.call(this, ...args), {
      box: opts.box,
      timeout: opts.timeout,
    });
  };
}

/**
 * Decorator that wraps a Page Object Model method in a `test.step()` call,
 * automatically generating a human-readable step title.
 *
 * @example Bare usage — humanizes class + method name + runtime params
 * ```ts
 * class LoginPage {
 *   @step
 *   async login(username: string, password: string) { ... }
 * }
 * // → 'Login page: login using username "admin" and password "secret"'
 * ```
 *
 * @example Custom step name — params are still appended
 * ```ts
 * class CheckoutPage {
 *   @step('Proceed to payment')
 *   async submitOrder(orderId: string) { ... }
 * }
 * // → 'Proceed to payment using order id "ord_99"'
 * ```
 *
 * @example Options only — humanizes with box + timeout
 * ```ts
 * class ProfilePage {
 *   @step({ box: true, timeout: 10_000 })
 *   async updateAvatar(file: string) { ... }
 * }
 * ```
 *
 * @example Custom name + options
 * ```ts
 * class CartPage {
 *   @step('Add item to cart', { box: true })
 *   async addItem(product: Product) { ... }
 * }
 * ```
 *
 * @example Disable humanizer — raw "ClassName.methodName", no params
 * ```ts
 * class AdminPage {
 *   @step({ noHumanizer: true })
 *   async deleteUser(userId: string) { ... }
 * }
 * // → 'AdminPage.deleteUser'
 * ```
 */
export function step(target: AnyMethod, context: ClassMethodDecoratorContext): AnyMethod;
export function step(name: string, options?: StepOptions): StepDecorator;
export function step(options: StepOptions): StepDecorator;
export function step(): StepDecorator;
export function step(
  nameOrOptionsOrTarget?: string | StepOptions | AnyMethod,
  contextOrOptions?: ClassMethodDecoratorContext | StepOptions
): AnyMethod | StepDecorator {
  // Case 1: @step (bare, no parentheses)
  if (typeof nameOrOptionsOrTarget === 'function' && isDecoratorContext(contextOrOptions)) {
    return applyStep(nameOrOptionsOrTarget, contextOrOptions, undefined, {});
  }

  // Cases 2–4: @step(...) factory
  const customName =
    typeof nameOrOptionsOrTarget === 'string' ? nameOrOptionsOrTarget : undefined;

  const opts: StepOptions =
    typeof nameOrOptionsOrTarget === 'object' && nameOrOptionsOrTarget !== null && isStepOptions(nameOrOptionsOrTarget)
      ? nameOrOptionsOrTarget
      : isStepOptions(contextOrOptions)
        ? (contextOrOptions as StepOptions)
        : {};

  return (target: AnyMethod, context: ClassMethodDecoratorContext): AnyMethod =>
    applyStep(target, context, customName, opts);
}

export type { StepOptions } from './types.js';
