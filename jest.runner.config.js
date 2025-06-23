module.exports = {
  verbose: true,
  modulePathIgnorePatterns: ['package.json'],
  transform: {
    '^.+\\.[js|cjs|mjs|jsx]$': 'babel-jest',
  },
  reporters: [],
}
