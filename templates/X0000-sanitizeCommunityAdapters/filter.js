'use strict';

async function test(context) {
    return context.owner === 'iobroker-community-adapters';
}

module.exports = { test };
