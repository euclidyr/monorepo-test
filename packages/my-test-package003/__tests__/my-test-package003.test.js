'use strict';

const myTestPackage003 = require('..');
const assert = require('assert').strict;

assert.strictEqual(myTestPackage003(), 'Hello from myTestPackage003');
console.info('myTestPackage003 tests passed');
