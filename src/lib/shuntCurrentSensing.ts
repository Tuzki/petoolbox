export type ShuntCurrentType = 'dc' | 'ac';
export type ShuntCurrentPolarity = 'unidirectional' | 'bidirectional';
export type ShuntEvaluationStatus = 'valid' | 'review' | 'invalid';
export type ShuntEvaluationHintId =
  | 'continuous-over-peak'
  | 'power-over-rating'
  | 'power-near-rating'
  | 'positive-output-range'
  | 'negative-output-range'
  | 'adc-utilization-low'
  | 'adc-utilization-high'
  | 'parallel-sharing';

export type ShuntCurrentSensingInputs = {
  currentType: ShuntCurrentType;
  currentPolarity: ShuntCurrentPolarity;
  continuousCurrentA: number;
  peakCurrentA: number;
  resistancePerShuntMohm: number;
  parallelQuantity: number;
  ratedPowerPerShuntW: number;
  csaGain: number;
  outputReferenceV: number;
  adcFullScaleV: number;
  adcResolutionBits: 8 | 10 | 12 | 14 | 16;
};

export type ShuntCurrentSensingResult = {
  equivalentResistanceOhms: number;
  equivalentResistanceMohm: number;
  totalContinuousLossW: number;
  powerPerShuntW: number;
  powerUtilizationPercent: number;
  continuousCurrentPerShuntA: number;
  peakCurrentPerShuntA: number;
  peakShuntVoltageV: number;
  peakShuntVoltageMv: number;
  peakTotalPowerW: number;
  sensitivityVA: number;
  sensitivityMvA: number;
  positiveOutputV: number;
  negativeOutputV: number | null;
  adcLsbV: number;
  currentPerLsbA: number;
  currentPerLsbMa: number;
  adcUsagePercent: number;
  status: ShuntEvaluationStatus;
  hints: ShuntEvaluationHintId[];
};

export const defaultShuntCurrentSensingInputs: ShuntCurrentSensingInputs = {
  currentType: 'dc',
  currentPolarity: 'bidirectional',
  continuousCurrentA: 60,
  peakCurrentA: 100,
  resistancePerShuntMohm: 1.0,
  parallelQuantity: 2,
  ratedPowerPerShuntW: 3.0,
  csaGain: 20,
  outputReferenceV: 1.65,
  adcFullScaleV: 3.3,
  adcResolutionBits: 12
};

const adcResolutionOptions = [8, 10, 12, 14, 16] as const;

function finitePositive(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function finiteNonNegative(value: number, fallback: number): number {
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function normalizeResolution(value: number): ShuntCurrentSensingInputs['adcResolutionBits'] {
  return adcResolutionOptions.includes(value as ShuntCurrentSensingInputs['adcResolutionBits'])
    ? (value as ShuntCurrentSensingInputs['adcResolutionBits'])
    : defaultShuntCurrentSensingInputs.adcResolutionBits;
}

export function normalizeShuntCurrentSensingInputs(
  inputs: Partial<ShuntCurrentSensingInputs>
): ShuntCurrentSensingInputs {
  return {
    currentType: inputs.currentType === 'ac' ? 'ac' : 'dc',
    currentPolarity: inputs.currentPolarity === 'unidirectional' ? 'unidirectional' : 'bidirectional',
    continuousCurrentA: Math.round(finiteNonNegative(inputs.continuousCurrentA ?? defaultShuntCurrentSensingInputs.continuousCurrentA, defaultShuntCurrentSensingInputs.continuousCurrentA)),
    peakCurrentA: Math.max(1, Math.round(finitePositive(inputs.peakCurrentA ?? defaultShuntCurrentSensingInputs.peakCurrentA, defaultShuntCurrentSensingInputs.peakCurrentA))),
    resistancePerShuntMohm: finitePositive(inputs.resistancePerShuntMohm ?? defaultShuntCurrentSensingInputs.resistancePerShuntMohm, defaultShuntCurrentSensingInputs.resistancePerShuntMohm),
    parallelQuantity: Math.max(1, Math.round(finitePositive(inputs.parallelQuantity ?? defaultShuntCurrentSensingInputs.parallelQuantity, defaultShuntCurrentSensingInputs.parallelQuantity))),
    ratedPowerPerShuntW: finitePositive(inputs.ratedPowerPerShuntW ?? defaultShuntCurrentSensingInputs.ratedPowerPerShuntW, defaultShuntCurrentSensingInputs.ratedPowerPerShuntW),
    csaGain: Math.max(1, Math.round(finitePositive(inputs.csaGain ?? defaultShuntCurrentSensingInputs.csaGain, defaultShuntCurrentSensingInputs.csaGain))),
    outputReferenceV: Number.isFinite(inputs.outputReferenceV) ? Number(inputs.outputReferenceV) : defaultShuntCurrentSensingInputs.outputReferenceV,
    adcFullScaleV: finitePositive(inputs.adcFullScaleV ?? defaultShuntCurrentSensingInputs.adcFullScaleV, defaultShuntCurrentSensingInputs.adcFullScaleV),
    adcResolutionBits: normalizeResolution(Number(inputs.adcResolutionBits ?? defaultShuntCurrentSensingInputs.adcResolutionBits))
  };
}

export function calculateShuntCurrentSensing(inputs: ShuntCurrentSensingInputs): ShuntCurrentSensingResult {
  const normalized = normalizeShuntCurrentSensingInputs(inputs);
  const equivalentResistanceMohm = normalized.resistancePerShuntMohm / normalized.parallelQuantity;
  const equivalentResistanceOhms = equivalentResistanceMohm / 1000;
  const totalContinuousLossW = normalized.continuousCurrentA ** 2 * equivalentResistanceOhms;
  const powerPerShuntW = totalContinuousLossW / normalized.parallelQuantity;
  const continuousCurrentPerShuntA = normalized.continuousCurrentA / normalized.parallelQuantity;
  const peakCurrentPerShuntA = normalized.peakCurrentA / normalized.parallelQuantity;
  const peakShuntVoltageV = normalized.peakCurrentA * equivalentResistanceOhms;
  const peakTotalPowerW = normalized.peakCurrentA ** 2 * equivalentResistanceOhms;
  const sensitivityVA = equivalentResistanceOhms * normalized.csaGain;
  const positiveOutputV = normalized.outputReferenceV + normalized.peakCurrentA * sensitivityVA;
  const negativeOutputV = normalized.currentPolarity === 'bidirectional'
    ? normalized.outputReferenceV - normalized.peakCurrentA * sensitivityVA
    : null;
  const adcLsbV = normalized.adcFullScaleV / 2 ** normalized.adcResolutionBits;
  const currentPerLsbA = adcLsbV / sensitivityVA;
  const positiveSpanV = positiveOutputV - normalized.outputReferenceV;
  const negativeSpanV = negativeOutputV === null ? 0 : normalized.outputReferenceV - negativeOutputV;
  const adcUsagePercent = normalized.currentPolarity === 'bidirectional'
    ? ((positiveSpanV + negativeSpanV) / normalized.adcFullScaleV) * 100
    : (positiveSpanV / normalized.adcFullScaleV) * 100;

  const invalidHints: ShuntEvaluationHintId[] = [];
  if (normalized.continuousCurrentA > normalized.peakCurrentA) invalidHints.push('continuous-over-peak');
  if (powerPerShuntW > normalized.ratedPowerPerShuntW) invalidHints.push('power-over-rating');
  if (positiveOutputV < 0 || positiveOutputV > normalized.adcFullScaleV) invalidHints.push('positive-output-range');
  if (negativeOutputV !== null && (negativeOutputV < 0 || negativeOutputV > normalized.adcFullScaleV)) invalidHints.push('negative-output-range');

  const reviewHints: ShuntEvaluationHintId[] = [];
  if (powerPerShuntW > normalized.ratedPowerPerShuntW * 0.8 && powerPerShuntW <= normalized.ratedPowerPerShuntW) reviewHints.push('power-near-rating');
  if (adcUsagePercent < 25) reviewHints.push('adc-utilization-low');
  if (adcUsagePercent > 90) reviewHints.push('adc-utilization-high');
  if (normalized.parallelQuantity > 1) reviewHints.push('parallel-sharing');

  return {
    equivalentResistanceOhms,
    equivalentResistanceMohm,
    totalContinuousLossW,
    powerPerShuntW,
    powerUtilizationPercent: (powerPerShuntW / normalized.ratedPowerPerShuntW) * 100,
    continuousCurrentPerShuntA,
    peakCurrentPerShuntA,
    peakShuntVoltageV,
    peakShuntVoltageMv: peakShuntVoltageV * 1000,
    peakTotalPowerW,
    sensitivityVA,
    sensitivityMvA: sensitivityVA * 1000,
    positiveOutputV,
    negativeOutputV,
    adcLsbV,
    currentPerLsbA,
    currentPerLsbMa: currentPerLsbA * 1000,
    adcUsagePercent,
    status: invalidHints.length > 0 ? 'invalid' : reviewHints.length > 0 ? 'review' : 'valid',
    hints: invalidHints.length > 0 ? invalidHints : reviewHints
  };
}
