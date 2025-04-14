import globals from 'globals';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  // Main config for JS and TS files
  {
    files: ['**/*.{js,ts}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parser: tseslint.parser, // TypeScript parser
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'commonjs',
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      prettier: prettierPlugin,
    },
    extends: [js.configs.recommended, ...tseslint.configs.recommended, prettierConfig],
    rules: {
      'no-console': 'off', // Turn off since using winston
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      'prettier/prettier': 'error',
    },
  },
  // Ignores
  {
    ignores: ['node_modules/**', 'dist/**', 'logs/**', '*.log'],
  }
);
