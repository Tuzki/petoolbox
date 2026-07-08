import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import ts from 'typescript';

const root = process.cwd();
const sourcePath = join(root, 'src', 'lib', 'voltageSensing.ts');
const source = readFileSync(sourcePath, 'utf8');
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
    strict: true
  }
}).outputText;
const moduleUrl = `data:text/javascript;base64,${Buffer.from(transpiled).toString('base64')}`;
const voltageSensing = await import(moduleUrl);

const defaultInputs = {
  maximumInputVoltage: 800,
  adcReferenceVoltage: 2.5,
  adcResolutionBits: 10,
  resistorSeries: 'E24',
  resistorSize: '0805',
  upperResistorCount: 6,
  topology: 'single-lower'
};

function closeTo(actual, expected, tolerance = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} was not within ${tolerance} of ${expected}`);
}

function assertFinitePositiveResult(result) {
  for (const [key, value] of Object.entries(result)) {
    if (typeof value !== 'number') continue;
    assert.equal(Number.isFinite(value), true, `${key} must be finite`);
    if (!['valueFitErrorPercent'].includes(key)) assert.ok(value > 0, `${key} must be positive`);
  }
}

test('standard resistor series include expected E24 and E96 decade values', () => {
  const e24 = voltageSensing.standardResistorValues('E24');
  const e96 = voltageSensing.standardResistorValues('E96');

  assert.equal(e24.includes(120_000), true);
  assert.equal(e24.includes(620_000), true);
  assert.equal(e96.includes(8_660), true);
  assert.equal(e96.includes(17_400), true);
  assert.equal(e24.every((value) => value > 0), true);
  assert.equal(e96.every((value) => value > 0), true);
});

test('default parameters generate a valid single-lower design from actual selected values', () => {
  const result = voltageSensing.calculateVoltageSensingDesign(defaultInputs);
  const rUpperTotal = result.upperEachOhms * defaultInputs.upperResistorCount;
  const rLowerEquivalent = result.lowerEachOhms;
  const maxCode = 2 ** defaultInputs.adcResolutionBits - 1;
  const expectedVadc = defaultInputs.maximumInputVoltage * rLowerEquivalent / (rUpperTotal + rLowerEquivalent);
  const expectedCurrent = defaultInputs.maximumInputVoltage / (rUpperTotal + rLowerEquivalent);
  const targetVadc = voltageSensing.TARGET_ADC_UTILIZATION * defaultInputs.adcReferenceVoltage;
  const fitErrorPercent = ((expectedVadc - targetVadc) / targetVadc) * 100;

  assertFinitePositiveResult(result);
  closeTo(result.upperTotalOhms, rUpperTotal);
  closeTo(result.lowerEquivalentOhms, rLowerEquivalent);
  closeTo(result.adcVoltage, expectedVadc);
  assert.equal(result.adcMaxCode, maxCode);
  assert.equal(result.adcCode, Math.round((expectedVadc / defaultInputs.adcReferenceVoltage) * maxCode));
  assert.ok(result.adcCode <= result.adcMaxCode);
  closeTo(result.inputResolutionVPerCount, (defaultInputs.adcReferenceVoltage / maxCode) * ((rUpperTotal + rLowerEquivalent) / rLowerEquivalent));
  closeTo(result.dividerCurrentA, expectedCurrent);
  closeTo(result.dividerPowerW, defaultInputs.maximumInputVoltage * expectedCurrent);
  closeTo(result.upperVoltageEachV, (defaultInputs.maximumInputVoltage - expectedVadc) / defaultInputs.upperResistorCount);
  closeTo(result.upperPowerEachW, expectedCurrent * expectedCurrent * result.upperEachOhms);
  closeTo(result.lowerPowerEachW, expectedVadc * expectedVadc / result.lowerEachOhms);
  closeTo(result.valueFitErrorPercent, fitErrorPercent);
  closeTo(result.nominalAccuracyPercent, 100 - Math.abs(fitErrorPercent));
  assert.notEqual(result.checks.find((check) => check.id === 'upper-voltage')?.status, 'fail');
  assert.ok(result.upperVoltageEachV <= voltageSensing.resistorPackageRatings[defaultInputs.resistorSize].workingVoltageV);
  assert.equal(result.checks.some((check) => check.status === 'fail'), false);
});

test('parallel-lower mode uses physical resistor value for each lower resistor power', () => {
  const inputs = { ...defaultInputs, topology: 'parallel-lower' };
  const result = voltageSensing.calculateVoltageSensingDesign(inputs);
  const rUpperTotal = result.upperEachOhms * inputs.upperResistorCount;
  const rLowerEquivalent = result.lowerEachOhms / 2;
  const expectedVadc = inputs.maximumInputVoltage * rLowerEquivalent / (rUpperTotal + rLowerEquivalent);
  const expectedLowerPowerEach = expectedVadc * expectedVadc / result.lowerEachOhms;
  const expectedLowerPowerTotal = 2 * expectedLowerPowerEach;

  assertFinitePositiveResult(result);
  closeTo(result.upperTotalOhms, rUpperTotal);
  closeTo(result.lowerEquivalentOhms, rLowerEquivalent);
  closeTo(result.adcVoltage, expectedVadc);
  closeTo(result.lowerPowerEachW, expectedLowerPowerEach);
  closeTo(expectedLowerPowerTotal, expectedVadc * expectedVadc / result.lowerEquivalentOhms);
  assert.ok(result.adcVoltage < inputs.adcReferenceVoltage);
  assert.ok(result.adcCode <= result.adcMaxCode);
});

test('invalid inputs return field-level validation errors before calculation', () => {
  const errors = voltageSensing.validateVoltageSensingInputs({
    ...defaultInputs,
    maximumInputVoltage: 0,
    adcReferenceVoltage: Number.NaN,
    upperResistorCount: 31
  });

  assert.match(errors.join(' '), /maximum-input-must-be-positive/);
  assert.match(errors.join(' '), /adc-reference-must-be-positive/);
  assert.match(errors.join(' '), /upper-resistor-count-out-of-range/);
  assert.throws(() => voltageSensing.calculateVoltageSensingDesign({ ...defaultInputs, maximumInputVoltage: 0 }), /maximum-input-must-be-positive/);
});
