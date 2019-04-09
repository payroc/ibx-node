"use strict";
// MOCHA
const mocha = require("mocha");
const afterEach = mocha.afterEach;
const beforeEach = mocha.beforeEach;
const describe = mocha.describe;
const it = mocha.it;

// CHAI
const assert = require('chai').assert;
const expect = require('chai').expect;

describe('IBX Core', function () {
    const IBXCore = require('../ibx-core');

    beforeEach(function () {
    });

    afterEach(function () {
    });

    describe('sanity check()', function () {
        it('A nonesense test for now', function (done) {
            done()
        });
    });
});

