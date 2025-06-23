module.exports = {
  verbose: true,
  modulePathIgnorePatterns: ['package.json'],
  transform: {
    '^.+\\.(cm)?(t|j)sx?$': 'babel-jest',
  },
  reporters: [],
}
