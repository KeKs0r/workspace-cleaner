module.exports = function (wallaby) {
  return {
    files: [
      'src/**/*.js',
      { pattern: 'test/testUtil.js', instrument: false },
      { pattern: 'test/fixtures/**/*', instrument: false },
      { pattern: 'test/fixtures/**/.DS_STORE', instrument: false }
    ],

    tests: [
      'test/*.spec.js',
      'test/**/*.spec.js'
    ],
    testFramework: 'ava',
    env: {
      type: 'node'
    },
    workers: {
          recycle: true
    },
    delays: {
      run: 500
    },
    debug: true
    // for node.js tests you need to set env property as well
    // https://wallabyjs.com/docs/integration/node.htm^l
  };
};