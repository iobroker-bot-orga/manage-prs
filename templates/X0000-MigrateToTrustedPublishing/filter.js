ommunity-adapters//
// select all adapter which have set
// - common.adminUI.config === json or
// - common.adminUI.custom === json 
//

'use strict';

async function init(context) {
    context.report = [];
}

async function test(context) {
    return (context.owner === `mcm4iob` || context.owner === `iobroker-community-adapters` );
}

async function finalize(context) {
    return;
}

exports.init=init;
exports.test=test;
exports.finalize=finalize;
