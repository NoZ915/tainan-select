import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      // 不加分號
      semi: 'off',
      '@typescript-eslint/semi': ['error', 'never'],

      // 單引號
      quotes: 'off',
      '@typescript-eslint/quotes': ['error', 'single', { avoidEscape: true }],

      // JSX 屬性引號使用單引號
      'jsx-quotes': ['error', 'prefer-single'],
    },
  },
)

