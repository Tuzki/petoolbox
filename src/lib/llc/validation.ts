import type { LLCDesignConfig } from "./types";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateLLCConfig(config: LLCDesignConfig): ValidationResult {
  const errors: string[] = [];
  const positiveValues: Array<[string, number]> = [
    ["Vin,min", config.vinMin], ["Vin,typ", config.vinTyp], ["Vin,max", config.vinMax],
    ["Vo", config.vo], ["Io", config.io], ["f0", config.f0Hz],
    ["fs,min", config.fsMinHz], ["fs,max", config.fsMaxHz],
  ];

  for (const [name, value] of positiveValues) {
    if (!Number.isFinite(value) || value <= 0) errors.push(`${name} must be a positive finite number.`);
  }
  if (!(config.vinMin <= config.vinTyp && config.vinTyp <= config.vinMax)) {
    errors.push("Input voltage must satisfy Vin,min ≤ Vin,typ ≤ Vin,max.");
  }
  if (config.fsMinHz >= config.fsMaxHz) errors.push("fs,min must be below fs,max.");
  if (!(config.lightLoadRatio > 0 && config.lightLoadRatio <= 1)) {
    errors.push("Light-load ratio must be in the interval (0, 1].");
  }
  if (config.overloadRatio < 1) errors.push("Overload ratio must be at least 1.");
  if (config.transformerRatios.length !== 5) errors.push("Exactly five transformer ratios are required.");
  if (config.kValues.length !== 9) errors.push("Exactly nine k values are required.");
  if (config.qValues.length !== 13) errors.push("Exactly thirteen Q values are required.");
  return { valid: errors.length === 0, errors };
}
