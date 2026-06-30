export type SignalSourceMode = 'resistor-divider' | 'voltage-output';
export type RcFilterStatus = 'GOOD BALANCE' | 'FILTER TOO WEAK' | 'FILTER TOO SLOW' | 'TARGET CONFLICT';
export type RcFilterSeverity = 'good' | 'warn' | 'bad';

export type SensingRcFilterInputs = {
  sourceMode: SignalSourceMode;
  upperResistanceKohms: number;
  lowerResistanceKohms: number;
  outputResistanceOhms: number;
  filterResistanceKohms: number;
  filterCapacitancePf: number;
  signalFrequencyKhz: number;
  noiseFrequencyMhz: number;
  maxAllowedSignalLossDb: number;
  desiredNoiseAttenuationDb: number;
};

export type FrequencyResponse = {
  ratio: number;
  gainDb: number;
  phaseDeg: number;
};

export type TimeResponse = {
  tauSeconds: number;
  riseTime1090Seconds: number;
  settlingTime1PercentSeconds: number;
  settlingTimePoint1PercentSeconds: number;
};

export type SensingRcFilterResult = {
  sourceResistanceOhms: number;
  totalResistanceOhms: number;
  cutoffFrequencyHz: number;
  signalFrequencyHz: number;
  noiseFrequencyHz: number;
  signalResponse: FrequencyResponse;
  noiseResponse: FrequencyResponse;
  timeResponse: TimeResponse;
  signalPass: boolean;
  noisePass: boolean;
  status: RcFilterStatus;
  severity: RcFilterSeverity;
  statusCopy: string;
  actionText: string;
};

export const defaultSensingRcFilterInputs: SensingRcFilterInputs = {
  sourceMode: 'resistor-divider',
  upperResistanceKohms: 100,
  lowerResistanceKohms: 4.99,
  outputResistanceOhms: 100,
  filterResistanceKohms: 1,
  filterCapacitancePf: 22,
  signalFrequencyKhz: 10,
  noiseFrequencyMhz: 100,
  maxAllowedSignalLossDb: 0.5,
  desiredNoiseAttenuationDb: 20
};

export function parallelResistance(firstOhms: number, secondOhms: number): number {
  if (!(firstOhms > 0) || !(secondOhms > 0)) return 0;
  return (firstOhms * secondOhms) / (firstOhms + secondOhms);
}

export function calculateCutoffFrequency(totalResistanceOhms: number, capacitanceFarads: number): number {
  if (!(totalResistanceOhms > 0) || !(capacitanceFarads > 0)) return 0;
  return 1 / (2 * Math.PI * totalResistanceOhms * capacitanceFarads);
}

export function calculateRcResponse(frequencyHz: number, cutoffFrequencyHz: number): FrequencyResponse {
  if (!(frequencyHz >= 0) || !(cutoffFrequencyHz > 0)) {
    return { ratio: 1, gainDb: 0, phaseDeg: 0 };
  }

  const normalizedFrequency = frequencyHz / cutoffFrequencyHz;
  const ratio = 1 / Math.sqrt(1 + normalizedFrequency * normalizedFrequency);
  return {
    ratio,
    gainDb: 20 * Math.log10(Math.max(ratio, 1e-300)),
    phaseDeg: -Math.atan(normalizedFrequency) * 180 / Math.PI
  };
}

export function calculateTimeResponse(totalResistanceOhms: number, capacitanceFarads: number): TimeResponse {
  const tauSeconds = totalResistanceOhms > 0 && capacitanceFarads > 0 ? totalResistanceOhms * capacitanceFarads : 0;
  return {
    tauSeconds,
    riseTime1090Seconds: 2.2 * tauSeconds,
    settlingTime1PercentSeconds: 4.6 * tauSeconds,
    settlingTimePoint1PercentSeconds: 6.9 * tauSeconds
  };
}

export function evaluateRcFilterDesign(inputs: SensingRcFilterInputs): SensingRcFilterResult {
  const sourceResistanceOhms = calculateSourceResistance(inputs);
  const filterResistanceOhms = safePositive(inputs.filterResistanceKohms) * 1_000;
  const filterCapacitanceFarads = safePositive(inputs.filterCapacitancePf) * 1e-12;
  const totalResistanceOhms = sourceResistanceOhms + filterResistanceOhms;
  const cutoffFrequencyHz = calculateCutoffFrequency(totalResistanceOhms, filterCapacitanceFarads);
  const signalFrequencyHz = safePositive(inputs.signalFrequencyKhz) * 1_000;
  const noiseFrequencyHz = safePositive(inputs.noiseFrequencyMhz) * 1_000_000;
  const signalResponse = calculateRcResponse(signalFrequencyHz, cutoffFrequencyHz);
  const noiseResponse = calculateRcResponse(noiseFrequencyHz, cutoffFrequencyHz);
  const maxAllowedSignalLossDb = Math.max(safePositive(inputs.maxAllowedSignalLossDb), 0);
  const desiredNoiseAttenuationDb = Math.max(safePositive(inputs.desiredNoiseAttenuationDb), 0);
  const signalPass = Math.abs(signalResponse.gainDb) <= maxAllowedSignalLossDb + 1e-12;
  const noisePass = Math.abs(noiseResponse.gainDb) >= desiredNoiseAttenuationDb - 1e-12;
  const statusInfo = evaluateStatus(signalPass, noisePass);

  return {
    sourceResistanceOhms,
    totalResistanceOhms,
    cutoffFrequencyHz,
    signalFrequencyHz,
    noiseFrequencyHz,
    signalResponse,
    noiseResponse,
    timeResponse: calculateTimeResponse(totalResistanceOhms, filterCapacitanceFarads),
    signalPass,
    noisePass,
    ...statusInfo
  };
}

export function formatEngineering(value: number, unit: string, significantDigits = 3): string {
  if (!Number.isFinite(value)) return '-';
  if (value === 0) return `0 ${unit}`.trim();

  const absValue = Math.abs(value);
  const prefixes = [
    { threshold: 1e9, factor: 1e9, prefix: 'G' },
    { threshold: 1e6, factor: 1e6, prefix: 'M' },
    { threshold: 1e3, factor: 1e3, prefix: 'k' },
    { threshold: 1, factor: 1, prefix: '' },
    { threshold: 1e-3, factor: 1e-3, prefix: 'm' },
    { threshold: 1e-6, factor: 1e-6, prefix: 'µ' },
    { threshold: 1e-9, factor: 1e-9, prefix: 'n' },
    { threshold: 1e-12, factor: 1e-12, prefix: 'p' }
  ];
  const selected = prefixes.find((prefix) => absValue >= prefix.threshold) ?? prefixes[prefixes.length - 1];
  const scaled = value / selected.factor;
  const integerDigits = Math.floor(Math.log10(Math.max(Math.abs(scaled), 1))) + 1;
  const decimals = Math.max(0, significantDigits - integerDigits);
  return `${scaled.toFixed(decimals)} ${selected.prefix}${unit}`.trim();
}

export function calculateSourceResistance(inputs: SensingRcFilterInputs): number {
  if (inputs.sourceMode === 'voltage-output') return safePositive(inputs.outputResistanceOhms);
  return parallelResistance(safePositive(inputs.upperResistanceKohms) * 1_000, safePositive(inputs.lowerResistanceKohms) * 1_000);
}

function evaluateStatus(signalPass: boolean, noisePass: boolean): Pick<SensingRcFilterResult, 'status' | 'severity' | 'statusCopy' | 'actionText'> {
  if (signalPass && noisePass) {
    return {
      status: 'GOOD BALANCE',
      severity: 'good',
      statusCopy: 'The useful signal is preserved while the selected noise frequency is attenuated.',
      actionText: 'The current RC values meet both targets.'
    };
  }

  if (signalPass && !noisePass) {
    return {
      status: 'FILTER TOO WEAK',
      severity: 'warn',
      statusCopy: 'The useful signal is preserved, but noise attenuation is below the selected target.',
      actionText: 'Increase the filter resistor or capacitor, then verify that useful-signal attenuation and phase delay remain acceptable.'
    };
  }

  if (!signalPass && noisePass) {
    return {
      status: 'FILTER TOO SLOW',
      severity: 'bad',
      statusCopy: 'Noise attenuation is sufficient, but the useful signal is attenuated too much.',
      actionText: 'Reduce the filter resistor or capacitor to move the cutoff frequency higher.'
    };
  }

  return {
    status: 'TARGET CONFLICT',
    severity: 'bad',
    statusCopy: 'The current values satisfy neither the useful-signal-loss target nor the desired noise-attenuation target.',
    actionText: 'The selected signal and noise frequencies may be too close for a single-pole RC filter. Consider a higher-order filter, synchronous sampling, or digital filtering.'
  };
}

function safePositive(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}
