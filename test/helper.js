
const assert = require('assert');

function depJs(path) {
  return require(`../src/js/${path}`);
}

function depMockJs(path) {
  return require(`./mock/${path}`);
}

function assertEqual(actual, expected) {
  assert.strictEqual(actual, expected);
}

function assertNotEqual(actual, expected) {
  if (actual !== expected) {
    assert(true);
  } else {
    assert.fail(`${actual}(actual) is not expected to equal ${expected}`);
  }
}

function assertMatch(value, regExp) {
  if (value.match(regExp)) {
    assert(true);
  } else {
    assert.fail(`${value} is not match ${regExp}`);
  }
}

function assertTure(value) {
  if (value === true) {
    assert(true);
  } else {
    assert.fail(`${value} is not true`);
  }
}

function assertFalse(value) {
  if (value === false) {
    assert(true);
  } else {
    assert.fail(`${value} is not false`);
  }
}

module.exports = {
  depJs: depJs,
  depMockJs: depMockJs,

  /* asserts */
  assertEqual: assertEqual,
  assertNotEqual: assertNotEqual,
  assertMatch: assertMatch,
  assertTrue: assertTure,
  assertFalse: assertFalse,
};
