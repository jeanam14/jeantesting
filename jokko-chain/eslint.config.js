// ESLint configuration for the whole monorepo (flat config).
//
// Two goals beyond style:
//  1. Safety: type-aware rules that catch real bugs in async, money-moving code
//     (floating promises, unsafe `any`, misused promises).
//  2. Documentation: every exported function, class, method, interface and type must carry a
//     TSDoc comment (CLAUDE.md → "Engineering standard" → "Everything documented").
import js from '@eslint/js';
import jsdoc from 'eslint-plugin-jsdoc';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/coverage/**',
      'design/**',
      'docs/**',
      '**/drizzle/**',
      '**/*.config.js',
      '**/*.config.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  jsdoc.configs['flat/recommended-typescript-error'],
  {
    rules: {
      // --- Documentation (enforced, not aspirational) ---
      'jsdoc/require-jsdoc': [
        'error',
        {
          publicOnly: true,
          require: {
            FunctionDeclaration: true,
            ClassDeclaration: true,
            MethodDefinition: true,
            ArrowFunctionExpression: false,
            FunctionExpression: false,
          },
          contexts: ['TSInterfaceDeclaration', 'TSTypeAliasDeclaration', 'TSEnumDeclaration'],
        },
      ],
      // Parameters are documented in prose; types already carry the rest.
      'jsdoc/require-param': 'off',
      'jsdoc/require-returns': 'off',
      'jsdoc/require-throws': 'off',
      'jsdoc/tag-lines': 'off',

      // --- Safety ---
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      eqeqeq: ['error', 'always'],
      // Money is never a float (CLAUDE.md "Cross-cutting technical rules"). Parsing user or
      // provider amounts must go through @jokko/core money helpers.
      'no-restricted-globals': [
        'error',
        { name: 'parseFloat', message: 'Use @jokko/core money helpers: money is never a float.' },
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'Number',
          property: 'parseFloat',
          message: 'Use @jokko/core money helpers: money is never a float.',
        },
        {
          object: 'Math',
          property: 'random',
          message: 'Use crypto.randomBytes / crypto.randomUUID for anything security-relevant.',
        },
      ],
    },
  },
  {
    // NestJS classes rely on decorators and DI; empty constructors and extraneous classes are
    // normal there. Tests may use non-null assertions for brevity.
    files: ['**/*.spec.ts', '**/*.test.ts', '**/test/**/*.ts'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/unbound-method': 'off',
      'jsdoc/require-jsdoc': 'off',
    },
  },
);
