// Test helper: load an instrument (and tuning) the way the app does.  const CB = require('./loadinst')('cigarbox','openD')
const fs = require('fs');
module.exports = function (inst, tuning) {
  globalThis.CB = {};
  globalThis.localStorage = { getItem: k => k === 'stringbench.instrument' ? (inst || 'guitar') : (tuning && k === 'stringbench.tuning.' + inst ? tuning : null), setItem() {} };
  fs.readdirSync(__dirname + '/instruments').filter(f => f !== 'select.js').forEach(f => require('./instruments/' + f));
  require('./instruments/select.js');
  return globalThis.CB;
};
