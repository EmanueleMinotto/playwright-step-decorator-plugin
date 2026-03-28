import { requireStepDecorator } from './rules/require-step-decorator.js';

const plugin = {
  meta: {
    name: 'playwright-step-decorator',
    version: '0.1.0',
  },
  rules: {
    'require-step-decorator': requireStepDecorator,
  },
  configs: {} as Record<string, unknown>,
};

plugin.configs['recommended'] = {
  plugins: {
    'playwright-step-decorator': plugin,
  },
  rules: {
    'playwright-step-decorator/require-step-decorator': 'error',
  },
};

export default plugin;
