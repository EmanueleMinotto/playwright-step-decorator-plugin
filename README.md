# playwright-step-decorator-plugin

A TypeScript `@step` decorator that wraps Playwright Page Object Model methods in
[`test.step()`](https://playwright.dev/docs/api/class-test#test-step) and automatically
generates human-readable step titles — plus an ESLint rule to enforce consistent usage
across your test suite.

## Installation

```bash
npm install playwright-step-decorator-plugin
```

Peer dependencies:

```bash
npm install --save-dev @playwright/test
# optional — only needed for the ESLint rule
npm install --save-dev eslint
```

## Usage

### `@step` decorator

The decorator wraps any async Page Object Model method in `test.step()`, generating a
descriptive title from the class name, method name, and the **actual runtime argument
values** — all without any manual naming.

```ts
import { step } from 'playwright-step-decorator-plugin';

class LoginPage {
  constructor(private readonly page: Page) {}

  // Bare usage — fully automatic title
  @step
  async login(username: string, password: string) {
    await this.page.fill('#username', username);
    await this.page.fill('#password', password);
    await this.page.click('#submit');
  }
  // → 'Login page: login using username "admin@acme.com" and password "s3cr3t"'

  // Custom step name — params are still appended
  @step('Sign in to the application')
  async signIn(username: string) {
    // ...
  }
  // → 'Sign in to the application using username "admin@acme.com"'

  // Options only — humanizer still runs, but step is boxed
  @step({ box: true, timeout: 10_000 })
  async fillForm(firstName: string, lastName: string) {
    // ...
  }
  // → 'Login page: fill form using first name "Ada" and last name "Lovelace"'

  // Custom name + options
  @step('Reset password', { box: true })
  async resetPassword(email: string) {
    // ...
  }
  // → 'Reset password using email "ada@example.com"'

  // Disable the humanizer entirely — raw "ClassName.methodName", no params
  @step({ noHumanizer: true })
  async internalReset() {
    // ...
  }
  // → 'LoginPage.internalReset'
}
```

### `StepOptions`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `box` | `boolean` | `false` | Box the step so errors point to the call site ([docs](https://playwright.dev/docs/api/class-test#test-step)) |
| `timeout` | `number` | — | Maximum step duration in milliseconds |
| `noHumanizer` | `boolean` | `false` | Skip humanization; use `ClassName.methodName` as-is with no params |

### How the humanizer builds step titles

The step title is assembled at **call time** using real argument values:

```
"<Humanized class name>: <humanized method name> using <top-3 params>"
```

Parameter rules:
- At most **3 parameters** are shown; the rest are collapsed into `"and N more options"`.
- Parameters are ranked by value type: strings/numbers (highest) → arrays/objects → booleans → null/undefined (lowest).
- Each value is rendered concisely: strings are quoted, booleans become plain names or `"not <name>"`, arrays show their items (up to 3), and large objects are summarised as `"with N fields"`.

```ts
// searchProducts("laptop", {brand:"apple"}, "price", 1, 20)
// → 'Search page: search products using query "laptop", sort by "price" and page 1 and 2 more options'

// bulkAddItems([1,2,3], null, {giftWrap:true, note:"birthday"})
// → 'Cart page: bulk add items using item ids [1, 2, 3], coupon: not provided and options {giftWrap: true, note: "birthday"}'
```

---

## Why the humanizer matters for debugging

When a Playwright test fails, you open the HTML report or the trace viewer and look for
the step that broke. Without explicit names, steps show the raw method call —
`LoginPage.fillCredentials` — which is opaque to everyone except the developer who wrote
it. With the humanizer you get **"Login page: fill credentials using username
"admin@acme.com" and password "s3cr3t""** — a sentence that tells you exactly which page,
which action, and which data were involved, before you even open the trace.

**Concrete benefits:**

1. **Instant triage.** The failing step title reads like a sentence.
   Non-technical stakeholders in a report can understand at a glance what went wrong
   without decoding PascalCase identifiers.

2. **Parameters in the title.** The humanizer captures runtime values so the step title
   contains the actual data (`userId "u_42"`, `role "admin"`) rather than placeholder
   names. You know exactly which input triggered the failure.

3. **Consistency without discipline.** Manual naming drifts: one developer writes
   `"Login as user"`, another writes `"loginPage.login"`. The decorator produces a
   uniform format across the entire codebase automatically.

4. **Better trace viewer UX.** Playwright's trace viewer nests steps visually.
   Human-readable titles make the step tree self-documenting, reducing the time spent
   hunting for the right frame.

5. **Regression signal.** When a humanized step title changes between runs (because a
   parameter changed), it stands out immediately in diff-based report tools.

---

## ESLint rule — `require-step-decorator`

Enforce that every public method on a POM class is decorated with `@step`.

### Setup (ESLint flat config)

```js
// eslint.config.js
import { eslintPlugin } from 'playwright-step-decorator-plugin';

export default [
  eslintPlugin.configs.recommended,
  // or configure manually:
  {
    plugins: { 'playwright-step-decorator': eslintPlugin },
    rules: {
      'playwright-step-decorator/require-step-decorator': 'error',
    },
  },
];
```

### Import (ESLint plugin only)

```js
import eslintPlugin from 'playwright-step-decorator-plugin/eslint-plugin';
```

### Rule options

```js
{
  'playwright-step-decorator/require-step-decorator': ['error', {
    // Regex to identify POM classes by name.
    // Default: "(Page|Component|Widget|Fragment)$"
    pomPattern: '(Page|Component|Widget|Fragment)$',

    // Name of the decorator to look for.
    // Default: "step"
    decoratorName: 'step',
  }]
}
```

### What the rule checks

- Matches classes whose name (or whose parent class name) satisfies `pomPattern`.
- Reports any **public, non-constructor, non-accessor** method that is missing the
  `@step` decorator.
- Private methods (`private` modifier or `#name`), getters, setters, and constructors
  are excluded.

```ts
// ✅ OK
class LoginPage {
  @step
  async login(username: string) { ... }
}

// ❌ Error: Method "login" in POM class "LoginPage" must be decorated with @step.
class LoginPage {
  async login(username: string) { ... }
}
```

---

## Separate entry points

```ts
// Full package (decorator + ESLint plugin)
import { step, eslintPlugin } from 'playwright-step-decorator-plugin';

// Decorator only
import { step } from 'playwright-step-decorator-plugin/decorator';

// ESLint plugin only
import eslintPlugin from 'playwright-step-decorator-plugin/eslint-plugin';
```

---

## Requirements

- TypeScript 5.0+ (Stage 3 decorators — no `experimentalDecorators` flag needed)
- `@playwright/test` ≥ 1.40
- Node.js ≥ 18

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). We follow
[Conventional Commits](https://www.conventionalcommits.org/).

## License

[MIT](LICENSE)
