import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import ts from 'typescript';

const root = process.cwd();
const source = readFileSync(join(root, 'src', 'lib', 'sensingRcFilter.ts'), 'utf8');
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
    strict: true
  }
}).outputText;
const moduleUrl = `data:text/javascript;base64,${Buffer.from(transpiled).toString('base64')}`;
const rc = await import(moduleUrl);

function closeTo(actual, expected, tolerance = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} was not within ${tolerance} of ${expected}`);
}

test('divider source resistance uses parallel resistor formula', () => {
  closeTo(rc.parallelResistance(100_000, 4_990), (100_000 * 4_990) / (100_000 + 4_990));
  assert.equal(rc.parallelResistance(100_000, 0), 0);
});

test('cutoff frequency uses first-order RC formula', () => {
  const totalResistance = 5_752.357367368321;
  const capacitance = 22e-12;
  closeTo(rc.calculateCutoffFrequency(totalResistance, capacitance), 1 / (2 * Math.PI * totalResistance * capacitance));
});

test('response at cutoff is -3.0103 dB and -45 degrees', () => {
  const response = rc.calculateRcResponse(1000, 1000);
  closeTo(response.gainDb, -3.010299956639812, 1e-12);
  closeTo(response.phaseDeg, -45, 1e-12);
});

test('time response uses tau multipliers', () => {
  const response = rc.calculateTimeResponse(1000, 22e-12);
  closeTo(response.tauSeconds, 22e-9);
  closeTo(response.riseTime1090Seconds, 2.2 * 22e-9);
  closeTo(response.settlingTime1PercentSeconds, 4.6 * 22e-9);
  closeTo(response.settlingTimePoint1PercentSeconds, 6.9 * 22e-9);
});

test('default design evaluates to good-balance', () => {
  const result = rc.evaluateRcFilterDesign(rc.defaultSensingRcFilterInputs);
  assert.equal(result.status, 'good-balance');
  assert.equal(result.actionCode, 'values-meet-targets');
  assert.equal(result.signalPass, true);
  assert.equal(result.noisePass, true);
  assert.ok(Number.isFinite(result.cutoffFrequencyHz));
});

test('dB formatter removes negative zero without hiding real attenuation', () => {
  assert.equal(rc.formatDb(-0.0049), '0.00 dB');
  assert.equal(rc.formatDb(-38.014), '-38.01 dB');
});

test('required number parser rejects empty and non-finite input', () => {
  assert.equal(rc.parseRequiredNumber(''), null);
  assert.equal(rc.parseRequiredNumber('   '), null);
  assert.equal(rc.parseRequiredNumber('not a number'), null);
  assert.equal(rc.parseRequiredNumber('Infinity'), null);
  assert.equal(rc.parseRequiredNumber('10.5'), 10.5);
});

test('filter input validation rejects zero frequency and accepts default values', () => {
  assert.equal(rc.isValidFilterInput(rc.defaultSensingRcFilterInputs), true);
  assert.equal(rc.isValidFilterInput({ ...rc.defaultSensingRcFilterInputs, signalFrequencyKhz: 0 }), false);
  assert.equal(rc.isValidFilterInput({ ...rc.defaultSensingRcFilterInputs, noiseFrequencyMhz: 0 }), false);
  assert.equal(rc.isValidFilterInput({ ...rc.defaultSensingRcFilterInputs, filterCapacitancePf: 0 }), false);
});

test('status evaluation detects weak, slow, and conflicting filters', () => {
  const weak = rc.evaluateRcFilterDesign({ ...rc.defaultSensingRcFilterInputs, filterCapacitancePf: 0.1 });
  const slow = rc.evaluateRcFilterDesign({ ...rc.defaultSensingRcFilterInputs, filterCapacitancePf: 100_000 });
  const conflict = rc.evaluateRcFilterDesign({
    ...rc.defaultSensingRcFilterInputs,
    signalFrequencyKhz: 100,
    noiseFrequencyMhz: 0.101,
    filterCapacitancePf: 10,
    maxAllowedSignalLossDb: 0.001,
    desiredNoiseAttenuationDb: 80
  });

  assert.equal(weak.status, 'filter-too-weak');
  assert.equal(weak.actionCode, 'increase-rc');
  assert.equal(slow.status, 'filter-too-slow');
  assert.equal(slow.actionCode, 'reduce-rc');
  assert.equal(conflict.status, 'target-conflict');
  assert.equal(conflict.actionCode, 'targets-conflict');
});
