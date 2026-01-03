import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import securitylint from 'eslint-plugin-security';
import prettierConfig from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  securitylint.configs.recommended,
  prettierConfig,
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        projectService: {
          allowDefaultProject: ['*.mts', '*.js'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['**/*.test.{js,ts}', '**/__tests__/**/*.{js,ts}'],
    rules: {
      'security/detect-object-injection': 'off',
    },
  },
];
