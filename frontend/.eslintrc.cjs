module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['@typescript-eslint', 'react-hooks', 'react-refresh'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', 'node_modules'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    'no-unused-vars': 'off',
    'no-empty': 'off',
    'no-constant-condition': 'off',
    'prefer-const': 'off',
    'react-hooks/exhaustive-deps': 'off',
    'react-refresh/only-export-components': 'off',
  },
  overrides: [
    {
      files: [
        'src/pages/Admin/QuizCreator/**/*.tsx',
        'src/pages/Admin/Quizzes/**/*.tsx',
        'src/hooks/useCloudinaryUpload.ts',
        'src/services/apiClient.ts',
        'src/services/quizService.ts',
        'src/services/uploadService.ts',
      ],
      rules: {
        '@typescript-eslint/no-unused-vars': ['error', {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        }],
      },
    },
  ],
};
