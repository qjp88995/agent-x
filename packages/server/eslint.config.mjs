import js from '@eslint/js';
import globals from 'globals';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'src/generated'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.node,
    },
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            ['^@nestjs/'],
            ['^@?\\w'],
            ['^@/'],
            ['^\\.\\./|^\\./'],
          ],
        },
      ],
      'simple-import-sort/exports': 'error',
    },
  },
);
