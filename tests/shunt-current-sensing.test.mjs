import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import ts from 'typescript';

const root = process.cwd();
const sourcePath = join(root, 'src', 'lib', 'shuntCurrentSensing.ts');
const source = readFileSync(sourcePath, 'utf8');
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
    strict: true
  }
}).outputText;
const moduleUrl = `data:text/javascript;base64,${Buffer.from(transpiled).toString('base64')}`;
const shunt = await import(moduleUrl);

function closeTo(actual, expected, tolerance = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} was not within ${tolerance} of ${expected}`);
}

test('default shunt sensing case matches the v3 reference values', () => {
  const result = shunt.calculateShuntCurrentSensing(shunt.defaultShuntCurrentSensingInputs);

  closeTo(result.equivalentResistanceMohm, 0.5);
  closeTo(result.peakShuntVoltageMv, 50);
  closeTo(result.totalContinuousLossW, 1.8);
  closeTo(result.powerPerShuntW, 0.9);
  closeTo(result.continuousCurrentPerShuntA, 30);
  closeTo(result.peakCurrentPerShuntA, 50);
  closeTo(result.positiveOutputV, 2.65);
  closeTo(result.negativeOutputV, 0.65);
  closeTo(result.sensitivityMvA, 10);
  closeTo(result.adcUsagePercent, 60.60606060606061);
  closeTo(result.currentPerLsbMa, 80.56640625);
  assert.equal(result.status, 'review');
  assert.deepEqual(result.hints, ['parallel-sharing']);
});

test('single and multiple shunt banks use equivalent resistance and equal sharing formulas', () => {
  const single = shunt.calculateShuntCurrentSensing({
    ...shunt.defaultShuntCurrentSensingInputs,
    parallelQuantity: 1,
    ratedPowerPerShuntW: 5
  });
  closeTo(single.equivalentResistanceMohm, 1);
  closeTo(single.powerPerShuntW, 3.6);
  closeTo(single.continuousCurrentPerShuntA, 60);
  closeTo(single.peakCurrentPerShuntA, 100);

  const fourWay = shunt.calculateShuntCurrentSensing({
    ...shunt.defaultShuntCurrentSensingInputs,
    parallelQuantity: 4
  });
  closeTo(fourWay.equivalentResistanceMohm, 0.25);
  closeTo(fourWay.powerPerShuntW, 0.225);
  closeTo(fourWay.continuousCurrentPerShuntA, 15);
  closeTo(fourWay.peakCurrentPerShuntA, 25);
  assert.equal(fourWay.status, 'review');
  assert.equal(fourWay.hints.includes('parallel-sharing'), true);
});

test('status precedence marks hard electrical limits invalid', () => {
  assert.equal(shunt.calculateShuntCurrentSensing({
    ...shunt.defaultShuntCurrentSensingInputs,
    continuousCurrentA: 120,
    peakCurrentA: 100
  }).status, 'invalid');

  assert.equal(shunt.calculateShuntCurrentSensing({
    ...shunt.defaultShuntCurrentSensingInputs,
    ratedPowerPerShuntW: 0.5
  }).hints.includes('power-over-rating'), true);

  assert.equal(shunt.calculateShuntCurrentSensing({
    ...shunt.defaultShuntCurrentSensingInputs,
    csaGain: 50
  }).hints.includes('positive-output-range'), true);
});

test('review hints cover ADC usage and high power utilization', () => {
  const lowAdc = shunt.calculateShuntCurrentSensing({
    ...shunt.defaultShuntCurrentSensingInputs,
    csaGain: 1,
    parallelQuantity: 1,
    ratedPowerPerShuntW: 5
  });
  assert.equal(lowAdc.status, 'review');
  assert.deepEqual(lowAdc.hints, ['adc-utilization-low']);

  const highAdc = shunt.calculateShuntCurrentSensing({
    ...shunt.defaultShuntCurrentSensingInputs,
    csaGain: 30
  });
  assert.equal(highAdc.status, 'review');
  assert.equal(highAdc.hints.includes('adc-utilization-high'), true);

  const highPower = shunt.calculateShuntCurrentSensing({
    ...shunt.defaultShuntCurrentSensingInputs,
    ratedPowerPerShuntW: 1
  });
  assert.equal(highPower.status, 'review');
  assert.equal(highPower.hints.includes('power-near-rating'), true);
});

test('normalization rounds integer fields and preserves selected modes', () => {
  const normalized = shunt.normalizeShuntCurrentSensingInputs({
    currentType: 'ac',
    currentPolarity: 'unidirectional',
    continuousCurrentA: 60.4,
    peakCurrentA: 100.6,
    parallelQuantity: 2.7,
    csaGain: 20.4,
    adcResolutionBits: 14
  });

  assert.equal(normalized.currentType, 'ac');
  assert.equal(normalized.currentPolarity, 'unidirectional');
  assert.equal(normalized.continuousCurrentA, 60);
  assert.equal(normalized.peakCurrentA, 101);
  assert.equal(normalized.parallelQuantity, 3);
  assert.equal(normalized.csaGain, 20);
  assert.equal(normalized.adcResolutionBits, 14);

  const result = shunt.calculateShuntCurrentSensing(normalized);
  assert.equal(result.negativeOutputV, null);
});
