export type ResistorSeries = 'E24' | 'E96';
export type ResistorSize = '0402' | '0603' | '0805' | '1206' | '1210';
export type DividerTopology = 'single-lower' | 'parallel-lower';
export type CheckStatus = 'pass' | 'review' | 'fail';

export type VoltageSensingInputs = {
  maximumInputVoltage: number;
  adcReferenceVoltage: number;
  adcResolutionBits: 8 | 10 | 12 | 14;
  resistorSeries: ResistorSeries;
  resistorSize: ResistorSize;
  upperResistorCount: number;
  topology: DividerTopology;
};

export type PackageRating = {
  powerW: number;
  workingVoltageV: number;
};

export type EngineeringCheck = {
  id: string;
  messageCode: 'adc-headroom' | 'upper-voltage' | 'upper-power' | 'lower-power';
  status: CheckStatus;
  values: Record<string, number | string>;
};

export type VoltageSensingResult = {
  upperEachOhms: number;
  upperTotalOhms: number;
  lowerEachOhms: number;
  lowerEquivalentOhms: number;
  adcVoltage: number;
  adcCode: number;
  adcMaxCode: number;
  adcUtilization: number;
  scalingRatio: number;
  nominalAccuracyPercent: number;
  valueFitErrorPercent: number;
  inputResolutionVPerCount: number;
  dividerCurrentA: number;
  dividerPowerW: number;
  upperVoltageEachV: number;
  upperPowerEachW: number;
  lowerPowerEachW: number;
  checks: EngineeringCheck[];
  firmwareCode: string;
};

type Candidate = Omit<VoltageSensingResult, 'checks' | 'firmwareCode'> & {
  score: number;
};

export const TARGET_ADC_UTILIZATION = 0.9;

export const resistorPackageRatings: Record<ResistorSize, PackageRating> = {
  '0402': { powerW: 0.063, workingVoltageV: 50 },
  '0603': { powerW: 0.1, workingVoltageV: 75 },
  '0805': { powerW: 0.125, workingVoltageV: 150 },
  '1206': { powerW: 0.25, workingVoltageV: 200 },
  '1210': { powerW: 0.5, workingVoltageV: 200 }
};

const E24_BASE = [10, 11, 12, 13, 15, 16, 18, 20, 22, 24, 27, 30, 33, 36, 39, 43, 47, 51, 56, 62, 68, 75, 82, 91];
const E96_BASE = [
  100, 102, 105, 107, 110, 113, 115, 118, 121, 124, 127, 130, 133, 137, 140, 143,
  147, 150, 154, 158, 162, 165, 169, 174, 178, 182, 187, 191, 196, 200, 205, 210,
  215, 221, 226, 232, 237, 243, 249, 255, 261, 267, 274, 280, 287, 294, 301, 309,
  316, 324, 332, 340, 348, 357, 365, 374, 383, 392, 402, 412, 422, 432, 442, 453,
  464, 475, 487, 499, 511, 523, 536, 549, 562, 576, 590, 604, 619, 634, 649, 665,
  681, 698, 715, 732, 750, 768, 787, 806, 825, 845, 866, 887, 909, 931, 953, 976
];

export function validateVoltageSensingInputs(inputs: VoltageSensingInputs): string[] {
  const errors: string[] = [];

  if (!(inputs.maximumInputVoltage > 0)) errors.push('maximum-input-must-be-positive');
  if (!(inputs.adcReferenceVoltage > 0)) errors.push('adc-reference-must-be-positive');
  if (![8, 10, 12, 14].includes(inputs.adcResolutionBits)) errors.push('adc-resolution-unsupported');
  if (!['E24', 'E96'].includes(inputs.resistorSeries)) errors.push('resistor-series-unsupported');
  if (!Object.hasOwn(resistorPackageRatings, inputs.resistorSize)) errors.push('resistor-size-unsupported');
  if (!Number.isInteger(inputs.upperResistorCount) || inputs.upperResistorCount < 1 || inputs.upperResistorCount > 30) {
    errors.push('upper-resistor-count-out-of-range');
  }
  if (!['single-lower', 'parallel-lower'].includes(inputs.topology)) errors.push('topology-unsupported');

  return errors;
}

export function calculateVoltageSensingDesign(inputs: VoltageSensingInputs): VoltageSensingResult {
  const errors = validateVoltageSensingInputs(inputs);
  if (errors.length > 0) {
    throw new Error(errors.join(','));
  }

  const candidate = findBestCandidate(inputs);
  if (!candidate) {
    throw new Error('no-practical-combination');
  }

  const checks = buildEngineeringChecks(candidate, inputs.resistorSize);
  const firmwareCode = `const float VIN_PER_COUNT = ${candidate.inputResolutionVPerCount.toFixed(8)}f;\nfloat vin = (float)adc_code * VIN_PER_COUNT;`;

  return { ...candidate, checks, firmwareCode };
}

export function standardResistorValues(series: ResistorSeries, minOhms = 100, maxOhms = 100_000_000): number[] {
  const base = series === 'E96' ? E96_BASE.map((value) => value / 10) : E24_BASE;
  const values = new Set<number>();

  for (let decade = -1; decade <= 7; decade += 1) {
    const multiplier = 10 ** decade;
    for (const baseValue of base) {
      const value = baseValue * multiplier;
      if (value >= minOhms && value <= maxOhms) values.add(Number(value.toPrecision(10)));
    }
  }

  return [...values].sort((a, b) => a - b);
}

export function formatResistance(ohms: number): string {
  if (ohms >= 1_000_000) return `${stripTrailingZeros(ohms / 1_000_000)} MΩ`;
  if (ohms >= 1_000) return `${stripTrailingZeros(ohms / 1_000)} kΩ`;
  return `${stripTrailingZeros(ohms)} Ω`;
}

export function formatVoltage(volts: number): string {
  if (volts >= 100) return `${volts.toFixed(1)} V`;
  if (volts >= 10) return `${volts.toFixed(2)} V`;
  return `${volts.toFixed(3)} V`;
}

export function formatCurrent(amps: number): string {
  if (amps >= 1) return `${amps.toFixed(3)} A`;
  if (amps >= 0.001) return `${(amps * 1_000).toFixed(2)} mA`;
  return `${(amps * 1_000_000).toFixed(1)} µA`;
}

export function formatPower(watts: number): string {
  if (watts >= 1) return `${watts.toFixed(2)} W`;
  if (watts >= 0.001) return `${(watts * 1_000).toFixed(1)} mW`;
  return `${(watts * 1_000_000).toFixed(1)} µW`;
}

export function formatResolution(voltsPerCount: number): string {
  if (voltsPerCount >= 1) return `${voltsPerCount.toFixed(3)} V/LSB`;
  if (voltsPerCount >= 0.001) return `${(voltsPerCount * 1_000).toFixed(2)} mV/LSB`;
  return `${(voltsPerCount * 1_000_000).toFixed(2)} µV/LSB`;
}

function findBestCandidate(inputs: VoltageSensingInputs): Candidate | null {
  const values = standardResistorValues(inputs.resistorSeries);
  const targetAdcVoltage = TARGET_ADC_UTILIZATION * inputs.adcReferenceVoltage;
  const lowerDivider = inputs.topology === 'parallel-lower' ? 2 : 1;
  const packageRating = resistorPackageRatings[inputs.resistorSize];
  let best: Candidate | null = null;

  for (const lowerEachOhms of values) {
    if (lowerEachOhms < 1_000 || lowerEachOhms > 1_000_000) continue;

    const lowerEquivalentOhms = lowerEachOhms / lowerDivider;
    const idealUpperEach = (lowerEquivalentOhms * (inputs.maximumInputVoltage / targetAdcVoltage - 1)) / inputs.upperResistorCount;
    if (!(idealUpperEach > 0)) continue;

    for (const upperIndex of nearbyValueIndexes(values, idealUpperEach, 5)) {
      const upperEachOhms = values[upperIndex];
      const upperTotalOhms = upperEachOhms * inputs.upperResistorCount;
      const totalOhms = upperTotalOhms + lowerEquivalentOhms;
      const dividerCurrentA = inputs.maximumInputVoltage / totalOhms;
      const adcVoltage = dividerCurrentA * lowerEquivalentOhms;

      if (!(adcVoltage > 0) || adcVoltage >= inputs.adcReferenceVoltage) continue;

      const adcMaxCode = 2 ** inputs.adcResolutionBits - 1;
      const adcCode = Math.round((adcVoltage / inputs.adcReferenceVoltage) * adcMaxCode);
      const adcUtilization = adcVoltage / inputs.adcReferenceVoltage;
      const scalingRatio = inputs.maximumInputVoltage / adcVoltage;
      const targetError = (adcVoltage - targetAdcVoltage) / targetAdcVoltage;
      const inputResolutionVPerCount = (inputs.adcReferenceVoltage / adcMaxCode) * ((upperTotalOhms + lowerEquivalentOhms) / lowerEquivalentOhms);
      const upperVoltageEachV = (inputs.maximumInputVoltage - adcVoltage) / inputs.upperResistorCount;
      const upperPowerEachW = dividerCurrentA * dividerCurrentA * upperEachOhms;
      const lowerPowerEachW = (adcVoltage * adcVoltage) / lowerEquivalentOhms / lowerDivider;
      const dividerPowerW = inputs.maximumInputVoltage * dividerCurrentA;
      const lowerPreference = Math.abs(Math.log10(lowerEquivalentOhms / 10_000));
      const upperVoltagePenalty = Math.max(0, upperVoltageEachV / (packageRating.workingVoltageV * 0.8) - 1);
      const upperPowerPenalty = Math.max(0, upperPowerEachW / (packageRating.powerW * 0.6) - 1);
      const lowerPowerPenalty = Math.max(0, lowerPowerEachW / (packageRating.powerW * 0.6) - 1);
      const score =
        Math.abs(targetError) * 100_000 +
        lowerPreference * 2 +
        upperVoltagePenalty * 5_000 +
        upperPowerPenalty * 5_000 +
        lowerPowerPenalty * 5_000 +
        Math.abs(adcUtilization - TARGET_ADC_UTILIZATION) * 100;

      const candidate: Candidate = {
        score,
        upperEachOhms,
        upperTotalOhms,
        lowerEachOhms,
        lowerEquivalentOhms,
        adcVoltage,
        adcCode,
        adcMaxCode,
        adcUtilization,
        scalingRatio,
        nominalAccuracyPercent: Math.max(0, 100 - Math.abs(targetError * 100)),
        valueFitErrorPercent: targetError * 100,
        inputResolutionVPerCount,
        dividerCurrentA,
        dividerPowerW,
        upperVoltageEachV,
        upperPowerEachW,
        lowerPowerEachW
      };

      if (!best || candidate.score < best.score) best = candidate;
    }
  }

  return best;
}

function buildEngineeringChecks(result: Candidate, resistorSize: ResistorSize): EngineeringCheck[] {
  const packageRating = resistorPackageRatings[resistorSize];
  const adcHasHeadroom = result.adcUtilization < 0.95;
  const upperVoltageRatio = result.upperVoltageEachV / packageRating.workingVoltageV;
  const upperPowerRatio = result.upperPowerEachW / packageRating.powerW;
  const lowerPowerRatio = result.lowerPowerEachW / packageRating.powerW;

  return [
    {
      id: 'adc-headroom',
      messageCode: 'adc-headroom',
      status: adcHasHeadroom ? 'pass' : 'review',
      values: { adcVoltage: result.adcVoltage, adcUtilization: result.adcUtilization }
    },
    {
      id: 'upper-voltage',
      messageCode: 'upper-voltage',
      status: statusFromRatio(upperVoltageRatio, 0.8, 1),
      values: { upperVoltageEachV: result.upperVoltageEachV, resistorSize, workingVoltageV: packageRating.workingVoltageV }
    },
    {
      id: 'upper-power',
      messageCode: 'upper-power',
      status: statusFromRatio(upperPowerRatio, 0.6, 1),
      values: { upperPowerEachW: result.upperPowerEachW, resistorSize, powerW: packageRating.powerW }
    },
    {
      id: 'lower-power',
      messageCode: 'lower-power',
      status: statusFromRatio(lowerPowerRatio, 0.6, 1),
      values: { lowerPowerEachW: result.lowerPowerEachW, dividerCurrentA: result.dividerCurrentA }
    }
  ];
}

function statusFromRatio(ratio: number, reviewAt: number, failAt: number): CheckStatus {
  if (ratio > failAt) return 'fail';
  if (ratio > reviewAt) return 'review';
  return 'pass';
}

function nearbyValueIndexes(values: number[], target: number, radius: number): number[] {
  let low = 0;
  let high = values.length;

  while (low < high) {
    const middle = (low + high) >> 1;
    if (values[middle] < target) low = middle + 1;
    else high = middle;
  }

  const indexes: number[] = [];
  for (let index = low - radius; index <= low + radius; index += 1) {
    if (index >= 0 && index < values.length) indexes.push(index);
  }

  return indexes;
}

function stripTrailingZeros(value: number): string {
  if (value >= 100) return value.toFixed(0);
  if (value >= 10) return value.toFixed(1).replace(/\.0$/, '');
  return value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}
