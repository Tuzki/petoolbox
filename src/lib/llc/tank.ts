import type { LLCDesignConfig, TankParameters } from "./types";

export function calculateTankParameters(
  config: Pick<LLCDesignConfig, "vo" | "io" | "f0Hz">,
  n: number,
  k: number,
  q: number,
): TankParameters {
  const loadResistance = config.vo / config.io;
  const racOhm = (8 / Math.PI ** 2) * n ** 2 * loadResistance;
  const zrOhm = q * racOhm;
  const omega0 = 2 * Math.PI * config.f0Hz;
  const lrH = zrOhm / omega0;
  const crF = 1 / (omega0 * zrOhm);
  const lmH = k * lrH;
  return { n, k, q, racOhm, zrOhm, lrH, lmH, crF };
}
