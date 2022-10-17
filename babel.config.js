// This file is only used by jest.runner.config.js, when running the
// test-runner. The tool itself uses typescript's compilation instead.
module.exports = {
  presets: [
    [
      require('@babel/preset-env'),
      {
        targets: {
          node: 'current',
        },
        useBuiltIns: 'usage',
        corejs: '3.25',
      },
    ],
  ],
  plugins: [],
}
