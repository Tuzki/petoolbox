import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import ts from 'typescript';

const root = process.cwd();
const sourcePath = join(root, 'src', 'lib', 'gateResistorPowerStress.ts');
const source = readFileSync(sourcePath, 'utf8');
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
    strict: true
  }
}).outputText;
const moduleUrl = `data:text/javascript;base64,${Buffer.from(transpiled).toString('base64')}`;
const gate = await import(moduleUrl);

function closeTo(actual, expected, tolerance = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} was not within ${tolerance} of ${expected}`);
}

test('E24 resistor values cover 1 to 200 ohms and exclude larger values', () => {
  assert.equal(gate.gateResistorE24Values[0], 1);
  assert.equal(gate.gateResistorE24Values.includes(3.9), true);
  assert.equal(gate.gateResistorE24Values.includes(10), true);
  assert.equal(gate.gateResistorE24Values.includes(200), true);
  assert.equal(gate.gateResistorE24Values.some((value) => value > 200), false);
});

test('default split-mode result matches demo v3 baseline and conserves energy', () => {
  const result = gate.calculateGateResistorPowerStress(gate.defaultGateResistorPowerStressInputs);
  const [on, off] = result.banks;

  closeTo(result.deltaGateVoltageV, 21);
  closeTo(result.equivalentGateChargeNc, 82);
  closeTo(result.energyPerCycleJ, 1.722e-6);
  closeTo(result.totalGateDrivePowerW, 0.1722);
  closeTo(result.averageSupplyCurrentA, 0.0082);
  closeTo(result.initialChargeCurrentA, 2.727272727272727);
  closeTo(result.initialDischargeCurrentA, 3.8181818181818183);

  closeTo(on.effectiveResistanceOhms, 5);
  closeTo(on.totalBankLossW, 0.05590909090909091);
  closeTo(on.lossPerResistorW, 0.027954545454545455);
  closeTo(on.energyPerResistorJ, 279.54545454545456e-9);
  closeTo(on.initialInstantaneousPowerPerResistorW, 18.59504132231405);
  closeTo(on.typicalPackageRatingW, 0.125);
  closeTo(on.designLimitW, 0.025);
  closeTo(on.ratedPowerLoading, 0.22363636363636366);
  closeTo(on.designLimitUtilization, 1.1181818181818182);
  assert.equal(on.status, 'fail');

  closeTo(off.effectiveResistanceOhms, 3.3);
  closeTo(off.totalBankLossW, 0.05166);
  closeTo(off.lossPerResistorW, 0.05166);
  closeTo(off.energyPerResistorJ, 516.6e-9);
  closeTo(off.initialInstantaneousPowerPerResistorW, 48.10909090909092);
  closeTo(off.ratedPowerLoading, 0.41328);
  closeTo(off.designLimitUtilization, 2.0664);
  assert.equal(off.status, 'fail');

  closeTo(result.externalResistorLossW, 0.10756909090909091);
  closeTo(result.driverOutputStageLossW, 0.024376363636363637);
  closeTo(result.internalGateResistanceLossW, 0.04025454545454545);
  closeTo(result.totalGateDrivePowerW, result.externalResistorLossW + result.driverOutputStageLossW + result.internalGateResistanceLossW, 1e-15);
  closeTo(result.lossBalanceErrorW, 0, 1e-15);
});

test('single-resistor mode combines charge and discharge loss into one physical bank', () => {
  const result = gate.calculateGateResistorPowerStress({
    ...gate.defaultGateResistorPowerStressInputs,
    loadMode: 'cg',
    equivalentGateCapacitanceNf: 3.9,
    switchingFrequencyKhz: 99,
    turnOnGateVoltageV: 17.9,
    turnOffGateVoltageV: -2.8,
    driverSourceResistanceOhms: 0.1,
    driverSinkResistanceOhms: 0.1,
    internalGateResistanceOhms: 1.5,
    driveMode: 'single',
    turnOnBank: { resistorOhms: 3.9, parallelCount: 1, packageCode: '0603' },
    turnOffBank: { resistorOhms: 10, parallelCount: 2, packageCode: '0805' }
  });
  const [bank] = result.banks;

  closeTo(result.equivalentGateChargeNc, 80.73);
  closeTo(result.energyPerCycleJ, 1.671111e-6);
  closeTo(result.totalGateDrivePowerW, 0.165440 - 0.000000011, 2e-8);
  closeTo(bank.effectiveResistanceOhms, 3.9);
  closeTo(bank.totalBankLossW, 0.11731199219999998, 1e-12);
  assert.notEqual(Math.round(bank.totalBankLossW * 1e6) / 1000, 58.66);
  closeTo(bank.lossPerResistorW, 0.11731199219999998, 1e-12);
  closeTo(bank.ratedPowerLoading, 1.1731199219999997, 1e-12);
  closeTo(bank.designLimitUtilization, 5.865599609999999, 1e-12);
  closeTo(bank.initialInstantaneousPowerPerResistorW, 55.243338842975206);
  closeTo(bank.energyPerResistorJ, 1.184969618181818e-6);
  assert.equal(bank.status, 'fail');
  assert.equal(result.banks.length, 1);
});

test('parallel pulse power uses per-resistor current rather than total bank current', () => {
  const result = gate.calculateGateResistorPowerStress({
    ...gate.defaultGateResistorPowerStressInputs,
    turnOnBank: { resistorOhms: 10, parallelCount: 5, packageCode: '1210' }
  });
  const [on] = result.banks;
  const expectedEach = (result.initialChargeCurrentA / 5) ** 2 * 10;
  const incorrectTotalCurrent = result.initialChargeCurrentA ** 2 * 10;
  closeTo(on.initialInstantaneousPowerPerResistorW, expectedEach);
  assert.ok(incorrectTotalCurrent / on.initialInstantaneousPowerPerResistorW > 24.9);
});

test('package ratings, parallel counts, and status boundaries are normalized and classified', () => {
  assert.deepEqual(gate.gateResistorPackagePowerW, {
    '0603': 0.10,
    '0805': 0.125,
    '1206': 0.25,
    '1210': 0.50
  });
  assert.equal(gate.normalizeGateResistorPowerStressInputs({
    turnOnBank: { resistorOhms: 9.99, parallelCount: 9, packageCode: '1210' }
  }).turnOnBank.parallelCount, 5);

  const pass = gate.calculateGateResistorPowerStress({
    ...gate.defaultGateResistorPowerStressInputs,
    switchingFrequencyKhz: 30,
    turnOnBank: { resistorOhms: 10, parallelCount: 2, packageCode: '1210' },
    turnOffBank: { resistorOhms: 3.3, parallelCount: 1, packageCode: '1210' }
  });
  assert.equal(pass.overallStatus, 'pass');

  const review = gate.calculateGateResistorPowerStress({
    ...gate.defaultGateResistorPowerStressInputs,
    switchingFrequencyKhz: 60,
    turnOnBank: { resistorOhms: 10, parallelCount: 2, packageCode: '0603' },
    turnOffBank: { resistorOhms: 3.3, parallelCount: 1, packageCode: '1210' }
  });
  assert.equal(review.banks[0].status, 'review');

  const fail = gate.calculateGateResistorPowerStress({
    ...gate.defaultGateResistorPowerStressInputs,
    switchingFrequencyKhz: 75,
    turnOnBank: { resistorOhms: 10, parallelCount: 2, packageCode: '0603' },
    turnOffBank: { resistorOhms: 3.3, parallelCount: 1, packageCode: '1210' }
  });
  assert.equal(fail.banks[0].status, 'fail');
});

test('validation rejects invalid voltage, load, frequency, and resistance inputs', () => {
  const errors = gate.validateGateResistorPowerStressInputs({
    ...gate.defaultGateResistorPowerStressInputs,
    totalGateChargeNc: 0,
    switchingFrequencyKhz: 0,
    turnOnGateVoltageV: -2,
    turnOffGateVoltageV: 12,
    driverSinkResistanceOhms: -0.1
  });
  assert.equal(errors.includes('switching-frequency-must-be-positive'), true);
  assert.equal(errors.includes('turn-on-voltage-must-exceed-turn-off-voltage'), true);
  assert.equal(errors.includes('gate-charge-must-be-positive'), true);
  assert.equal(errors.includes('driver-sink-resistance-cannot-be-negative'), true);
});
