export type RCSnubberStatus = 'pass' | 'review' | 'fail';
export const rcSnubberErrorCodes = ['positive-inputs', 'frequency-order', 'events', 'derating-limit', 'numerical', 'power-rating-invalid', 'power-rating-fail', 'voltage-rating-invalid', 'voltage-rating-fail'] as const;
export const rcSnubberWarningCodes = ['shift-too-small', 'shift-sensitive', 'power-rating-missing', 'power-derating', 'voltage-rating-missing', 'voltage-derating', 'settling', 'pulse-rating', 'measurement-parasitics'] as const;

export type RCSnubberInputs = {
  f0MHz: number; cTestPf: number; f1MHz: number; deltaVV: number;
  switchingFrequencyKhz: number; eventsPerCycle: 1 | 2; capacitorMultiplier: number;
  resistorMultiplier: number; resistorRatedPowerW?: number; capacitorVoltageRatingV?: number;
  powerDeratingLimit: number; voltageDeratingLimit: number;
};

export const defaultRCSnubberInputs: RCSnubberInputs = {
  f0MHz: 19.2, cTestPf: 100, f1MHz: 12, deltaVV: 100, switchingFrequencyKhz: 100,
  eventsPerCycle: 2, capacitorMultiplier: 3, resistorMultiplier: 1,
  powerDeratingLimit: 0.6, voltageDeratingLimit: 0.8
};

const E24 = [1,1.1,1.2,1.3,1.5,1.6,1.8,2,2.2,2.4,2.7,3,3.3,3.6,3.9,4.3,4.7,5.1,5.6,6.2,6.8,7.5,8.2,9.1];
const CAP = [1,1.2,1.5,1.8,2,2.2,2.7,3.3,3.9,4.7,5.6,6.8,8.2];

export function nearestSeriesValue(value: number, base: number[]): number {
  if (!(value > 0) || !Number.isFinite(value)) return NaN;
  const decade = 10 ** Math.floor(Math.log10(value));
  const candidates = [-1,0,1].flatMap((shift) => base.map((entry) => entry * decade * 10 ** shift));
  return candidates.reduce((best, candidate) => Math.abs(candidate - value) < Math.abs(best - value) ? candidate : best);
}
export const nearestE24 = (ohms: number) => nearestSeriesValue(ohms, E24);
export const nearestStandardCapacitancePf = (pf: number) => nearestSeriesValue(pf, CAP);

export function calculateRCSnubber(input: RCSnubberInputs) {
  const required = [input.f0MHz,input.cTestPf,input.f1MHz,input.deltaVV,input.switchingFrequencyKhz,input.eventsPerCycle,input.capacitorMultiplier,input.resistorMultiplier,input.powerDeratingLimit,input.voltageDeratingLimit];
  const errors: string[] = [];
  const warnings: string[] = [];
  if (required.some((v) => !Number.isFinite(v) || v <= 0)) errors.push('positive-inputs');
  if (input.powerDeratingLimit > 1 || input.voltageDeratingLimit > 1) errors.push('derating-limit');
  if (input.f1MHz >= input.f0MHz) errors.push('frequency-order');
  if (input.eventsPerCycle !== 1 && input.eventsPerCycle !== 2) errors.push('events');
  if (errors.length) return { status: 'fail' as const, errors, warnings };
  const f0 = input.f0MHz * 1e6, ctest = input.cTestPf * 1e-12, fsw = input.switchingFrequencyKhz * 1e3;
  const ratio = input.f0MHz / input.f1MHz, denominator = ratio ** 2 - 1;
  if (!(denominator > 0)) return { status: 'fail' as const, errors: ['frequency-order'], warnings };
  const cp = ctest / denominator;
  const lp = 1 / ((2 * Math.PI * f0) ** 2 * cp);
  const lpAlternate = denominator / ((2 * Math.PI * f0) ** 2 * ctest);
  const z0 = Math.sqrt(lp / cp);
  const csRaw = input.capacitorMultiplier * cp;
  const rsRaw = input.resistorMultiplier * z0;
  const cs = nearestStandardCapacitancePf(csRaw * 1e12) * 1e-12;
  const rs = nearestE24(rsRaw);
  const eventEnergy = 0.5 * cs * input.deltaVV ** 2;
  const rawEventEnergy = 0.5 * csRaw * input.deltaVV ** 2;
  const eventsPerSecond = input.eventsPerCycle * fsw;
  const averageLoss = eventEnergy * eventsPerSecond;
  const peakCurrent = input.deltaVV / rs;
  const peakPower = input.deltaVV ** 2 / rs;
  const rmsCurrent = Math.sqrt(averageLoss / rs);
  const tau = rs * cs, eventInterval = 1 / eventsPerSecond, settlingRatio = 5 * tau / eventInterval;
  const values = [ratio,cp,lp,lpAlternate,z0,csRaw,rsRaw,cs,rs,eventEnergy,averageLoss,peakCurrent,peakPower,rmsCurrent,tau,eventInterval,settlingRatio];
  if (values.some((v) => !Number.isFinite(v) || v <= 0)) errors.push('numerical');
  if (ratio < 1.2) warnings.push('shift-too-small'); else if (ratio < 1.5) warnings.push('shift-sensitive');
  if (input.resistorRatedPowerW == null) warnings.push('power-rating-missing');
  else if (!(input.resistorRatedPowerW > 0)) errors.push('power-rating-invalid');
  else if (averageLoss > input.resistorRatedPowerW) errors.push('power-rating-fail');
  else if (averageLoss / input.resistorRatedPowerW > input.powerDeratingLimit) warnings.push('power-derating');
  if (input.capacitorVoltageRatingV == null) warnings.push('voltage-rating-missing');
  else if (!(input.capacitorVoltageRatingV > 0)) errors.push('voltage-rating-invalid');
  else if (input.deltaVV > input.capacitorVoltageRatingV) errors.push('voltage-rating-fail');
  else if (input.deltaVV / input.capacitorVoltageRatingV > input.voltageDeratingLimit) warnings.push('voltage-derating');
  if (settlingRatio >= 0.8) warnings.push('settling');
  warnings.push('pulse-rating', 'measurement-parasitics');
  const informational = new Set(['pulse-rating', 'measurement-parasitics']);
  const status: RCSnubberStatus = errors.length ? 'fail' : warnings.some((warning) => !informational.has(warning)) ? 'review' : 'pass';
  return { status, errors, warnings, ratio, cp, lp, lpAlternate, z0, csRaw, rsRaw, cs, rs,
    originalPeriod: 1/f0, shiftedPeriod: 1/(input.f1MHz*1e6), eventEnergy, rawEventEnergy,
    eventsPerSecond, averageLoss, peakCurrent, peakPower, rmsCurrent, tau, eventInterval, settlingRatio,
    candidates: [0.5,0.75,1,1.25].map((factor) => ({ factor, raw: factor*z0, standard: nearestE24(factor*z0) })) };
}
