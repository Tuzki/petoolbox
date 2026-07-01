export type PrimaryBridge = "half" | "full";
export type SecondaryRectifier = "fullwave";
export type CandidateStatus = "feasible" | "marginal" | "failed" | "numerical";
export type LimitingFactor = "F↓" | "F↑" | "I" | "V" | "Z" | "N";

export interface LLCDesignConfig {
  bridge: PrimaryBridge;
  secondary: SecondaryRectifier;
  vinMin: number;
  vinTyp: number;
  vinMax: number;
  vo: number;
  io: number;
  lightLoadRatio: number;
  overloadRatio: number;
  f0Hz: number;
  fsMinHz: number;
  fsMaxHz: number;
  transformerRatios: number[];
  kValues: number[];
  qValues: number[];
}

export interface TankParameters {
  n: number;
  k: number;
  q: number;
  racOhm: number;
  zrOhm: number;
  lrH: number;
  lmH: number;
  crF: number;
}

export interface OperatingPointResult {
  valid: boolean;
  vinV: number;
  loadRatio: number;
  fsHz?: number;
  normalizedFrequency?: number;
  branch?: string;
  resonantCurrentPeakA?: number;
  resonantCurrentRmsA?: number;
  resonantCapacitorPeakV?: number;
  commutationCurrentA?: number;
  freeIntervalPercent?: number;
  residual?: number;
  reason?: string;
}

export interface CandidateSummary {
  fsMinHz: number;
  fsMaxHz: number;
  resonantCurrentPeakA: number;
  resonantCurrentRmsA: number;
  resonantCapacitorPeakV: number;
  minimumCommutationCurrentA: number;
  maximumResidual: number;
}

export interface LLCCandidateResult extends TankParameters {
  id: string;
  status: CandidateStatus;
  limitingFactor: LimitingFactor;
  minimumMargin: number;
  reasons: string[];
  summary: CandidateSummary;
  operatingPoints: OperatingPointResult[];
  rank?: number;
}

export interface GainEnvelopePoint {
  fsHz: number;
  gain: number;
  residual: number;
  valid: boolean;
}

export interface GainEnvelopeCurve {
  loadRatio: number;
  points: GainEnvelopePoint[];
}

export interface WaveformPoint {
  timeS: number;
  resonantCapacitorVoltageV: number;
  resonantCurrentA: number;
  magnetizingCurrentA: number;
  rectifiedOutputCurrentA: number;
  bridgeVoltageV: number;
  mode: -1 | 0 | 1;
  edge?: boolean;
  event?: boolean;
}
