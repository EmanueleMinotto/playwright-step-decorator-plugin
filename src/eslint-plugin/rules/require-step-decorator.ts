import { AST_NODE_TYPES, ESLintUtils, TSESTree } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  name =>
    `https://github.com/EmanueleMinotto/playwright-step-decorator-plugin/blob/main/docs/rules/${name}.md`
);

type MessageIds = 'missingStepDecorator';

type Options = [
  {
    pomPattern?: string;
    decoratorName?: string;
  },
];

function matchesPattern(name: string | undefined, pattern: RegExp): boolean {
  return name !== undefined && pattern.test(name);
}

function getSuperClassName(node: TSESTree.ClassDeclaration | TSESTree.ClassExpression): string | undefined {
  if (!node.superClass) return undefined;
  if (node.superClass.type === AST_NODE_TYPES.Identifier) {
    return node.superClass.name;
  }
  return undefined;
}

function hasDecorator(
  decorators: TSESTree.Decorator[] | undefined,
  decoratorName: string
): boolean {
  if (!decorators || decorators.length === 0) return false;
  return decorators.some(d => {
    const expr = d.expression;
    if (expr.type === AST_NODE_TYPES.Identifier) {
      return expr.name === decoratorName;
    }
    if (
      expr.type === AST_NODE_TYPES.CallExpression &&
      expr.callee.type === AST_NODE_TYPES.Identifier
    ) {
      return expr.callee.name === decoratorName;
    }
    return false;
  });
}

export const requireStepDecorator = createRule<Options, MessageIds>({
  name: 'require-step-decorator',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Enforce the @step decorator on all public methods of Playwright Page Object Model classes',
    },
    messages: {
      missingStepDecorator:
        'Method "{{ methodName }}" in POM class "{{ className }}" must be decorated with @{{ decoratorName }}.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          pomPattern: {
            type: 'string',
            description:
              'Regex pattern to identify POM classes by name. Defaults to "(Page|Component|Widget|Fragment)$".',
          },
          decoratorName: {
            type: 'string',
            description: 'Name of the required decorator. Defaults to "step".',
          },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{}],
  create(context) {
    const options = context.options[0] ?? {};
    const pomPattern = new RegExp(options.pomPattern ?? '(Page|Component|Widget|Fragment)$');
    const decoratorName = options.decoratorName ?? 'step';

    function checkClass(node: TSESTree.ClassDeclaration | TSESTree.ClassExpression): void {
      const className =
        node.type === AST_NODE_TYPES.ClassDeclaration ? node.id?.name : node.id?.name;
      const superClassName = getSuperClassName(node);

      const isPom =
        matchesPattern(className, pomPattern) || matchesPattern(superClassName, pomPattern);

      if (!isPom) return;

      for (const member of node.body.body) {
        if (member.type !== AST_NODE_TYPES.MethodDefinition) continue;

        // Skip constructor, private methods (#name), static methods, and accessors
        if (member.kind === 'constructor') continue;
        if (member.accessibility === 'private' || member.accessibility === 'protected') continue;
        if (member.key.type === AST_NODE_TYPES.PrivateIdentifier) continue;
        if (member.kind === 'get' || member.kind === 'set') continue;

        const methodName =
          member.key.type === AST_NODE_TYPES.Identifier ? member.key.name : '<computed>';

        if (!hasDecorator(member.decorators, decoratorName)) {
          context.report({
            node: member,
            messageId: 'missingStepDecorator',
            data: {
              methodName,
              className: className ?? '<anonymous>',
              decoratorName,
            },
          });
        }
      }
    }

    return {
      ClassDeclaration: checkClass,
      ClassExpression: checkClass,
    };
  },
});
