import type { LLCDesignConfig } from "./types";

export const DEFAULT_K_VALUES = [3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7] as const;
export const DEFAULT_Q_VALUES = [
  0.2, 0.225, 0.25, 0.275, 0.3, 0.325, 0.35,
  0.375, 0.4, 0.425, 0.45, 0.475, 0.5,
] as const;

export function getAutomaticRatios(
  vinTypV: number,
  voV: number,
  bridge: LLCDesignConfig["bridge"],
): number[] {
  const rawCenter = bridge === "half" ? vinTypV / (2 * voV) : vinTypV / voV;
  const center = Math.max(3, Math.round(rawCenter));
  return [center - 2, center - 1, center, center + 1, center + 2];
}

export const DEFAULT_LLC_CONFIG: LLCDesignConfig = {
  bridge: "half",
  secondary: "fullwave",
  vinMin: 360,
  vinTyp: 380,
  vinMax: 410,
  vo: 12,
  io: 55,
  lightLoadRatio: 0.2,
  overloadRatio: 1.3,
  f0Hz: 100_000,
  fsMinHz: 30_000,
  fsMaxHz: 250_000,
  transformerRatios: [14, 15, 16, 17, 18],
  kValues: [...DEFAULT_K_VALUES],
  qValues: [...DEFAULT_Q_VALUES],
};
