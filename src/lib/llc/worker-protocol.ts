import type { GainEnvelopeCurve, LLCCandidateResult, LLCDesignConfig, WaveformPoint } from "./types";

export type LLCWorkerRequest =
  | { type: "search"; jobId: string; config: LLCDesignConfig; ratios: number[] }
  | { type: "cancel"; jobId: string }
  | { type: "gain-envelope"; jobId: string; config: LLCDesignConfig; candidate: LLCCandidateResult; vinV: number }
  | { type: "waveform"; jobId: string; config: LLCDesignConfig; candidate: LLCCandidateResult; operatingPointIndex: number };

export type LLCWorkerResponse =
  | { type: "progress"; jobId: string; completed: number; total: number; label: string }
  | { type: "search-complete"; jobId: string; elapsedMs: number; candidates: LLCCandidateResult[] }
  | { type: "gain-envelope-complete"; jobId: string; curves: GainEnvelopeCurve[] }
  | { type: "waveform-complete"; jobId: string; points: WaveformPoint[] }
  | { type: "cancelled"; jobId: string }
  | { type: "error"; jobId: string; message: string };
