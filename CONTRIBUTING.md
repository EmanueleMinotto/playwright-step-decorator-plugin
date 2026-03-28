# Contributing

Thank you for your interest in contributing! This project follows
[Conventional Commits](https://www.conventionalcommits.org/) and automates
releases based on commit messages.

## Getting started

```bash
git clone https://github.com/EmanueleMinotto/playwright-step-decorator-plugin.git
cd playwright-step-decorator-plugin
npm install
```

## Development workflow

1. Fork the repository and create a feature branch:
   ```bash
   git checkout -b feat/your-feature
   ```
2. Make your changes.
3. Run the checks locally:
   ```bash
   npm run typecheck
   npm run lint
   npm test
   npm run build
   ```
4. Commit using Conventional Commits (see below).
5. Push and open a pull request against `main`.

## Commit message format

```
<type>[optional scope]: <short description>

[optional body]

[optional footer(s)]
```

### Types

| Type | When to use |
|------|-------------|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation changes only |
| `style` | Formatting, missing semicolons, etc. (no logic change) |
| `refactor` | Code change that is neither a fix nor a feature |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `build` | Build system or dependency changes |
| `ci` | CI/CD configuration changes |
| `chore` | Other changes that don't modify `src` or `test` files |

### Examples

```
feat(decorator): add noHumanizer option

fix(eslint-plugin): correctly detect class expressions

docs: add ESLint flat config example to README

feat!: rename StepOptions.skipHumanize to noHumanizer

BREAKING CHANGE: the skipHumanize option has been renamed to noHumanizer
```

## Versioning

Versions are derived automatically from commit types:

- `feat:` → minor version bump
- `fix:` → patch version bump
- `BREAKING CHANGE:` in footer or `!` after type → major version bump

## Pull request checklist

- [ ] All existing tests pass (`npm test`)
- [ ] New behaviour is covered by tests
- [ ] TypeScript compiles without errors (`npm run typecheck`)
- [ ] Lint passes (`npm run lint`)
- [ ] Documentation updated if needed

## Reporting issues

Please open an issue at
<https://github.com/EmanueleMinotto/playwright-step-decorator-plugin/issues>
and include a minimal reproducible example.
