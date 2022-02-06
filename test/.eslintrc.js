module.exports = {
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
  },
  env: {
    jest: true,
  },
  plugins: ['jest'],
  extends: ['../.eslintrc', 'plugin:jest/recommended'],
}
