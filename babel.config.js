// This file is only used by jest.runner.config.js, when running the
// test-runner. The tool itself uses typescript's compilation instead.
module.exports = {
  presets: [['@exercism/babel-preset-javascript', { corejs: '3.44' }]],
  plugins: [],
}
