'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { ensurePrTitlePrefix } = require('../prTitle');

test('adds the bot prefix to a title rewritten by a template', () => {
    assert.equal(
        ensurePrTitlePrefix('Dynamically generated title'),
        '[iobroker-bot] Dynamically generated title',
    );
});

test('does not duplicate the bot prefix', () => {
    assert.equal(
        ensurePrTitlePrefix('[iobroker-bot] Existing title'),
        '[iobroker-bot] Existing title',
    );
});

test('trims whitespace around the title', () => {
    assert.equal(
        ensurePrTitlePrefix('  Dynamic title  '),
        '[iobroker-bot] Dynamic title',
    );
});
