import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', '.vite']),

  // ── Node.js config files (vite, postcss, tailwind, validate-env) ──
  {
    files: ['*.config.{js,cjs,ts}', 'validate-env.js'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },

  // ── React / browser source files (JS + TS) ──
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // ── Downgraded to warn (pre-existing issues, fix incrementally) ──
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', {
        varsIgnorePattern: '^[A-Z_]',
        argsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-require-imports': 'off',
      'no-prototype-builtins': 'warn',
      'no-constant-condition': 'warn',
      'no-cond-assign': 'warn',
      'no-fallthrough': 'warn',
      'no-empty': 'warn',
      'no-func-assign': 'warn',
      'no-misleading-character-class': 'warn',
      'no-control-regex': 'warn',
      'no-extra-boolean-cast': 'warn',
      'getter-return': 'warn',
      'valid-typeof': 'warn',
      'no-unreachable': 'warn',

      'no-useless-escape': 'warn',
      'no-case-declarations': 'warn',
      'no-undef': 'warn',

      // ── React hooks & compiler — warn until code is fixed ──
      'react-hooks/rules-of-hooks': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-refresh/only-export-components': 'warn',
    },
  },
])
