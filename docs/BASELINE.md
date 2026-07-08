# Default numerical baseline

This baseline was captured twice in headless Chromium from the extracted runtime engine after the single Worker handoff ordering fix.

## Default input

- Half bridge
- Vin = 360 / 380 / 410 V
- Vo = 12 V
- Io = 55 A
- Light load = 20%
- Overload = 130%
- f0 = 100 kHz
- fs = 30-250 kHz
- Five automatic ratios: 14-18
- 9 k values x 13 Q values = 585 candidates

## Required result

- Total: 585
- Feasible: 539
- Marginal: 11
- Failed / numerical: 35
- Selected top candidate: n = 14, k = 3.5, Q = 0.275 (displayed as 0.28)
- Worst margin: +36.5%
- Default selected corner: Vin,max / 130%
- State-plane SVG contains trajectory paths
- Time-domain SVG contains five waveform paths
- Browser page errors: none

The complete Top 5 and all nine operating-point values are stored in `tests/fixtures/default-v5-baseline.json`.

Small runtime differences are acceptable. Candidate counts, selected candidate, operating branches, and numerical values should not materially change during a packaging-only integration.
