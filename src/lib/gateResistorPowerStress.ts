export type GateLoadMode = 'qg' | 'cg';
export type GateDriveMode = 'single' | 'split';
export type GateResistorPackage = '0603' | '0805' | '1206' | '1210';
export type GateStressStatus = 'pass' | 'review' | 'fail';

export type GateResistorBankInputs = {
  resistorOhms: number;
  parallelCount: number;
  packageCode: GateResistorPackage;
};

export type GateResistorPowerStressInputs = {
  loadMode: GateLoadMode;
  totalGateChargeNc: number;
  equivalentGateCapacitanceNf: number;
  switchingFrequencyKhz: number;
  turnOnGateVoltageV: number;
  turnOffGateVoltageV: number;
  driverSourceResistanceOhms: number;
  driverSinkResistanceOhms: number;
  internalGateResistanceOhms: number;
  driveMode: GateDriveMode;
  turnOnBank: GateResistorBankInputs;
  turnOffBank: GateResistorBankInputs;
};

export type GateResistorBankResult = {
  titleKey: 'single' | 'turn-on' | 'turn-off';
  selectedResistanceOhms: number;
  parallelCount: number;
  packageCode: GateResistorPackage;
  effectiveResistanceOhms: number;
  totalBankLossW: number;
  lossPerResistorW: number;
  energyPerResistorJ: number;
  initialInstantaneousPowerPerResistorW: number;
  typicalPackageRatingW: number;
  designLimitW: number;
  ratedPowerLoading: number;
  designLimitUtilization: number;
  status: GateStressStatus;
};

export type GateResistorPowerStressResult = {
  deltaGateVoltageV: number;
  equivalentGateChargeC: number;
  equivalentGateChargeNc: number;
  energyPerCycleJ: number;
  totalGateDrivePowerW: number;
  averageSupplyCurrentA: number;
  initialChargeCurrentA: number;
  initialDischargeCurrentA: number;
  turnOnLoopResistanceOhms: number;
  turnOffLoopResistanceOhms: number;
  turnOnBankLossW: number;
  turnOffBankLossW: number;
  externalResistorLossW: number;
  driverOutputStageLossW: number;
  internalGateResistanceLossW: number;
  lossBalanceErrorW: number;
  overallStatus: GateStressStatus;
  banks: GateResistorBankResult[];
};

export const gateResistorPackagePowerW: Record<GateResistorPackage, number> = {
  '0603': 0.10,
  '0805': 0.125,
  '1206': 0.25,
  '1210': 0.50
};

export const defaultGateResistorPowerStressInputs: GateResistorPowerStressInputs = {
  loadMode: 'qg',
  totalGateChargeNc: 82,
  equivalentGateCapacitanceNf: 3.9,
  switchingFrequencyKhz: 100,
  turnOnGateVoltageV: 18,
  turnOffGateVoltageV: -3,
  driverSourceResistanceOhms: 1.2,
  driverSinkResistanceOhms: 0.7,
  internalGateResistanceOhms: 1.5,
  driveMode: 'split',
  turnOnBank: {
    resistorOhms: 10,
    parallelCount: 2,
    packageCode: '0805'
  },
  turnOffBank: {
    resistorOhms: 3.3,
    parallelCount: 1,
    packageCode: '0805'
  }
};

export const gateResistorPackageOptions = Object.keys(gateResistorPackagePowerW) as GateResistorPackage[];

export function buildGateResistorE24Values(): number[] {
  const base = [1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0, 3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1];
  const values = new Set<number>();
  for (const decade of [1, 10, 100]) {
    for (const entry of base) {
      const value = Number((entry * decade).toFixed(2));
      if (value >= 1 && value <= 200) values.add(value);
    }
  }
  return [...values].sort((a, b) => a - b);
}

export const gateResistorE24Values = buildGateResistorE24Values();

function nearestResistorValue(value: number): number {
  if (gateResistorE24Values.includes(value)) return value;
  return gateResistorE24Values.reduce((best, candidate) => Math.abs(candidate - value) < Math.abs(best - value) ? candidate : best, gateResistorE24Values[0]);
}

function finitePositive(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function finiteNonNegative(value: number, fallback: number): number {
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function normalizeParallelCount(value: number): number {
  return Math.min(5, Math.max(1, Math.round(finitePositive(value, 1))));
}

function normalizePackage(value: unknown): GateResistorPackage {
  return gateResistorPackageOptions.includes(value as GateResistorPackage) ? (value as GateResistorPackage) : '0805';
}

function normalizeBank(bank: Partial<GateResistorBankInputs> | undefined, fallback: GateResistorBankInputs): GateResistorBankInputs {
  return {
    resistorOhms: nearestResistorValue(finitePositive(bank?.resistorOhms ?? fallback.resistorOhms, fallback.resistorOhms)),
    parallelCount: normalizeParallelCount(bank?.parallelCount ?? fallback.parallelCount),
    packageCode: normalizePackage(bank?.packageCode ?? fallback.packageCode)
  };
}

export function normalizeGateResistorPowerStressInputs(
  inputs: Partial<GateResistorPowerStressInputs>
): GateResistorPowerStressInputs {
  const normalized: GateResistorPowerStressInputs = {
    loadMode: inputs.loadMode === 'cg' ? 'cg' : 'qg',
    totalGateChargeNc: finitePositive(inputs.totalGateChargeNc ?? defaultGateResistorPowerStressInputs.totalGateChargeNc, defaultGateResistorPowerStressInputs.totalGateChargeNc),
    equivalentGateCapacitanceNf: finitePositive(inputs.equivalentGateCapacitanceNf ?? defaultGateResistorPowerStressInputs.equivalentGateCapacitanceNf, defaultGateResistorPowerStressInputs.equivalentGateCapacitanceNf),
    switchingFrequencyKhz: finitePositive(inputs.switchingFrequencyKhz ?? defaultGateResistorPowerStressInputs.switchingFrequencyKhz, defaultGateResistorPowerStressInputs.switchingFrequencyKhz),
    turnOnGateVoltageV: Number.isFinite(inputs.turnOnGateVoltageV) ? Number(inputs.turnOnGateVoltageV) : defaultGateResistorPowerStressInputs.turnOnGateVoltageV,
    turnOffGateVoltageV: Number.isFinite(inputs.turnOffGateVoltageV) ? Number(inputs.turnOffGateVoltageV) : defaultGateResistorPowerStressInputs.turnOffGateVoltageV,
    driverSourceResistanceOhms: finiteNonNegative(inputs.driverSourceResistanceOhms ?? defaultGateResistorPowerStressInputs.driverSourceResistanceOhms, defaultGateResistorPowerStressInputs.driverSourceResistanceOhms),
    driverSinkResistanceOhms: finiteNonNegative(inputs.driverSinkResistanceOhms ?? defaultGateResistorPowerStressInputs.driverSinkResistanceOhms, defaultGateResistorPowerStressInputs.driverSinkResistanceOhms),
    internalGateResistanceOhms: finiteNonNegative(inputs.internalGateResistanceOhms ?? defaultGateResistorPowerStressInputs.internalGateResistanceOhms, defaultGateResistorPowerStressInputs.internalGateResistanceOhms),
    driveMode: inputs.driveMode === 'single' ? 'single' : 'split',
    turnOnBank: normalizeBank(inputs.turnOnBank, defaultGateResistorPowerStressInputs.turnOnBank),
    turnOffBank: normalizeBank(inputs.turnOffBank, defaultGateResistorPowerStressInputs.turnOffBank)
  };
  if (normalized.turnOnGateVoltageV <= normalized.turnOffGateVoltageV) {
    normalized.turnOnGateVoltageV = defaultGateResistorPowerStressInputs.turnOnGateVoltageV;
    normalized.turnOffGateVoltageV = defaultGateResistorPowerStressInputs.turnOffGateVoltageV;
  }
  if (normalized.driveMode === 'single') normalized.turnOffBank = { ...normalized.turnOnBank };
  return normalized;
}

export function validateGateResistorPowerStressInputs(inputs: GateResistorPowerStressInputs): string[] {
  const errors: string[] = [];
  if (!(inputs.switchingFrequencyKhz > 0)) errors.push('switching-frequency-must-be-positive');
  if (!(inputs.turnOnGateVoltageV > inputs.turnOffGateVoltageV)) errors.push('turn-on-voltage-must-exceed-turn-off-voltage');
  if (inputs.loadMode === 'qg' && !(inputs.totalGateChargeNc > 0)) errors.push('gate-charge-must-be-positive');
  if (inputs.loadMode === 'cg' && !(inputs.equivalentGateCapacitanceNf > 0)) errors.push('gate-capacitance-must-be-positive');
  if (inputs.driverSourceResistanceOhms < 0) errors.push('driver-source-resistance-cannot-be-negative');
  if (inputs.driverSinkResistanceOhms < 0) errors.push('driver-sink-resistance-cannot-be-negative');
  if (inputs.internalGateResistanceOhms < 0) errors.push('internal-gate-resistance-cannot-be-negative');
  for (const [prefix, bank] of [['turn-on', inputs.turnOnBank], ['turn-off', inputs.turnOffBank]] as const) {
    if (!gateResistorE24Values.includes(bank.resistorOhms)) errors.push(`${prefix}-resistor-must-use-e24-value`);
    if (!(bank.parallelCount >= 1 && bank.parallelCount <= 5)) errors.push(`${prefix}-parallel-count-out-of-range`);
  }
  return errors;
}

function statusFromRatedLoading(ratedPowerLoading: number): GateStressStatus {
  if (ratedPowerLoading > 0.20) return 'fail';
  if (ratedPowerLoading > 0.15) return 'review';
  return 'pass';
}

function worstStatus(statuses: GateStressStatus[]): GateStressStatus {
  const rank: Record<GateStressStatus, number> = { pass: 0, review: 1, fail: 2 };
  return statuses.reduce((worst, status) => rank[status] > rank[worst] ? status : worst, 'pass' as GateStressStatus);
}

function makeBankResult(args: {
  titleKey: GateResistorBankResult['titleKey'];
  bank: GateResistorBankInputs;
  effectiveResistanceOhms: number;
  totalBankLossW: number;
  lossPerResistorW: number;
  energyPerResistorJ: number;
  initialInstantaneousPowerPerResistorW: number;
}): GateResistorBankResult {
  const typicalPackageRatingW = gateResistorPackagePowerW[args.bank.packageCode];
  const designLimitW = typicalPackageRatingW * 0.20;
  const ratedPowerLoading = args.lossPerResistorW / typicalPackageRatingW;
  const designLimitUtilization = args.lossPerResistorW / designLimitW;
  return {
    titleKey: args.titleKey,
    selectedResistanceOhms: args.bank.resistorOhms,
    parallelCount: args.bank.parallelCount,
    packageCode: args.bank.packageCode,
    effectiveResistanceOhms: args.effectiveResistanceOhms,
    totalBankLossW: args.totalBankLossW,
    lossPerResistorW: args.lossPerResistorW,
    energyPerResistorJ: args.energyPerResistorJ,
    initialInstantaneousPowerPerResistorW: args.initialInstantaneousPowerPerResistorW,
    typicalPackageRatingW,
    designLimitW,
    ratedPowerLoading,
    designLimitUtilization,
    status: statusFromRatedLoading(ratedPowerLoading)
  };
}

export function calculateGateResistorPowerStress(
  rawInputs: GateResistorPowerStressInputs
): GateResistorPowerStressResult {
  const inputs = normalizeGateResistorPowerStressInputs(rawInputs);
  const errors = validateGateResistorPowerStressInputs(inputs);
  if (errors.length > 0) throw new Error(errors.join(','));

  const deltaGateVoltageV = inputs.turnOnGateVoltageV - inputs.turnOffGateVoltageV;
  const switchingFrequencyHz = inputs.switchingFrequencyKhz * 1000;
  const equivalentGateChargeC = inputs.loadMode === 'qg'
    ? inputs.totalGateChargeNc * 1e-9
    : inputs.equivalentGateCapacitanceNf * 1e-9 * deltaGateVoltageV;
  const energyPerCycleJ = equivalentGateChargeC * deltaGateVoltageV;
  const totalGateDrivePowerW = energyPerCycleJ * switchingFrequencyHz;
  const averageSupplyCurrentA = equivalentGateChargeC * switchingFrequencyHz;
  const halfCycleEnergyJ = energyPerCycleJ / 2;

  const turnOnEffectiveResistanceOhms = inputs.turnOnBank.resistorOhms / inputs.turnOnBank.parallelCount;
  const turnOffEffectiveResistanceOhms = inputs.turnOffBank.resistorOhms / inputs.turnOffBank.parallelCount;
  const turnOnLoopResistanceOhms = inputs.driverSourceResistanceOhms + inputs.internalGateResistanceOhms + turnOnEffectiveResistanceOhms;
  const turnOffLoopResistanceOhms = inputs.driverSinkResistanceOhms + inputs.internalGateResistanceOhms + turnOffEffectiveResistanceOhms;
  const initialChargeCurrentA = deltaGateVoltageV / turnOnLoopResistanceOhms;
  const initialDischargeCurrentA = deltaGateVoltageV / turnOffLoopResistanceOhms;

  const turnOnBankEnergyJ = halfCycleEnergyJ * turnOnEffectiveResistanceOhms / turnOnLoopResistanceOhms;
  const turnOffBankEnergyJ = halfCycleEnergyJ * turnOffEffectiveResistanceOhms / turnOffLoopResistanceOhms;
  const turnOnBankLossW = turnOnBankEnergyJ * switchingFrequencyHz;
  const turnOffBankLossW = turnOffBankEnergyJ * switchingFrequencyHz;

  const turnOnEachCurrentA = initialChargeCurrentA / inputs.turnOnBank.parallelCount;
  const turnOffEachCurrentA = initialDischargeCurrentA / inputs.turnOffBank.parallelCount;
  const turnOnPulsePowerEachW = turnOnEachCurrentA ** 2 * inputs.turnOnBank.resistorOhms;
  const turnOffPulsePowerEachW = turnOffEachCurrentA ** 2 * inputs.turnOffBank.resistorOhms;

  const driverOutputStageLossW =
    halfCycleEnergyJ * (inputs.driverSourceResistanceOhms / turnOnLoopResistanceOhms) * switchingFrequencyHz +
    halfCycleEnergyJ * (inputs.driverSinkResistanceOhms / turnOffLoopResistanceOhms) * switchingFrequencyHz;
  const internalGateResistanceLossW =
    halfCycleEnergyJ * (inputs.internalGateResistanceOhms / turnOnLoopResistanceOhms) * switchingFrequencyHz +
    halfCycleEnergyJ * (inputs.internalGateResistanceOhms / turnOffLoopResistanceOhms) * switchingFrequencyHz;
  const externalResistorLossW = turnOnBankLossW + turnOffBankLossW;

  const banks = inputs.driveMode === 'single'
    ? [
        makeBankResult({
          titleKey: 'single',
          bank: inputs.turnOnBank,
          effectiveResistanceOhms: turnOnEffectiveResistanceOhms,
          totalBankLossW: externalResistorLossW,
          lossPerResistorW: externalResistorLossW / inputs.turnOnBank.parallelCount,
          energyPerResistorJ: (turnOnBankEnergyJ + turnOffBankEnergyJ) / inputs.turnOnBank.parallelCount,
          initialInstantaneousPowerPerResistorW: Math.max(turnOnPulsePowerEachW, turnOffPulsePowerEachW)
        })
      ]
    : [
        makeBankResult({
          titleKey: 'turn-on',
          bank: inputs.turnOnBank,
          effectiveResistanceOhms: turnOnEffectiveResistanceOhms,
          totalBankLossW: turnOnBankLossW,
          lossPerResistorW: turnOnBankLossW / inputs.turnOnBank.parallelCount,
          energyPerResistorJ: turnOnBankEnergyJ / inputs.turnOnBank.parallelCount,
          initialInstantaneousPowerPerResistorW: turnOnPulsePowerEachW
        }),
        makeBankResult({
          titleKey: 'turn-off',
          bank: inputs.turnOffBank,
          effectiveResistanceOhms: turnOffEffectiveResistanceOhms,
          totalBankLossW: turnOffBankLossW,
          lossPerResistorW: turnOffBankLossW / inputs.turnOffBank.parallelCount,
          energyPerResistorJ: turnOffBankEnergyJ / inputs.turnOffBank.parallelCount,
          initialInstantaneousPowerPerResistorW: turnOffPulsePowerEachW
        })
      ];

  return {
    deltaGateVoltageV,
    equivalentGateChargeC,
    equivalentGateChargeNc: equivalentGateChargeC * 1e9,
    energyPerCycleJ,
    totalGateDrivePowerW,
    averageSupplyCurrentA,
    initialChargeCurrentA,
    initialDischargeCurrentA,
    turnOnLoopResistanceOhms,
    turnOffLoopResistanceOhms,
    turnOnBankLossW,
    turnOffBankLossW,
    externalResistorLossW,
    driverOutputStageLossW,
    internalGateResistanceLossW,
    lossBalanceErrorW: totalGateDrivePowerW - externalResistorLossW - driverOutputStageLossW - internalGateResistanceLossW,
    overallStatus: worstStatus(banks.map((bank) => bank.status)),
    banks
  };
}
