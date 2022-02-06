module.exports = {
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
  },
  env: {
    jest: true,
  },
  extends: ['../.eslintrc.js'],
}
