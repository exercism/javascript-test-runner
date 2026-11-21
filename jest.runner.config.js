module.exports = {
  verbose: true,
  modulePathIgnorePatterns: ['package.json'],
  transform: {
    '^.+\\.[t|j]sx?$': '<rootDir>/jest.transformer.js',
  },
  reporters: [],
}
