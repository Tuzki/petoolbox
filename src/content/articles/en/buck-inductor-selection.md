---
title: "How to Select an Inductor for a Buck Converter"
articleId: "buck-inductor-selection"
description: "A practical method for selecting inductance, ripple current, saturation current, and current rating for a buck converter."
category: "converter-design"
primaryTool: "buck-inductor-ripple-calculator"
relatedTools:
  - "output-capacitor-calculator"
  - "buck-converter-designer"
publishedAt: 2026-06-27
updatedAt: 2026-06-27
draft: false
---

Selecting a buck inductor starts with ripple current, then moves to current limits, losses, size, and temperature. This template article keeps the method visible without becoming a full design note.

<figure class="buck-diagram" aria-label="Simplified buck converter power stage">
  <svg viewBox="0 0 680 220" role="img" aria-labelledby="buck-diagram-title">
    <title id="buck-diagram-title">Simplified buck converter power stage</title>
    <line x1="48" y1="80" x2="136" y2="80" />
    <rect x="136" y="48" width="58" height="64" rx="3" />
    <line x1="194" y1="80" x2="282" y2="80" />
    <path d="M282 80c12-32 36-32 48 0s36 32 48 0 36-32 48 0" />
    <line x1="426" y1="80" x2="574" y2="80" />
    <line x1="500" y1="80" x2="500" y2="150" />
    <line x1="474" y1="150" x2="526" y2="150" />
    <line x1="482" y1="164" x2="518" y2="164" />
    <line x1="574" y1="80" x2="574" y2="150" />
    <rect x="552" y="150" width="44" height="18" rx="2" />
    <line x1="48" y1="168" x2="620" y2="168" />
    <text x="48" y="58">VIN</text>
    <text x="139" y="39">SW</text>
    <text x="330" y="54">L</text>
    <text x="486" y="194">COUT</text>
    <text x="552" y="194">LOAD</text>
    <text x="575" y="58">VOUT</text>
  </svg>
</figure>

## Start with ripple current

Inductor ripple current is usually selected as a fraction of full-load output current. A common first-pass range is 20% to 40%, then the design is checked against transient response, losses, and available parts.

### Buck inductor ripple formula

<div class="formula-scroll">
  <p class="formula">Delta I<sub>L</sub> = (V<sub>OUT</sub> x (V<sub>IN</sub> - V<sub>OUT</sub>)) / (L x f<sub>SW</sub> x V<sub>IN</sub>)</p>
</div>

This continuous-conduction approximation is useful for sizing the first candidate inductor.

## Key parameters

<div class="table-scroll">
  <table>
    <thead>
      <tr>
        <th>Parameter</th>
        <th>What to check</th>
        <th>Practical note</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Inductance</td>
        <td>Ripple current target</td>
        <td>Higher inductance lowers ripple but slows current slew.</td>
      </tr>
      <tr>
        <td>Saturation current</td>
        <td>Peak inductor current</td>
        <td>Use margin above worst-case peak current.</td>
      </tr>
      <tr>
        <td>RMS current rating</td>
        <td>Thermal stress</td>
        <td>Check rating at the expected board temperature.</td>
      </tr>
      <tr>
        <td>DCR</td>
        <td>Conduction loss</td>
        <td>Lower DCR improves efficiency but may increase size.</td>
      </tr>
    </tbody>
  </table>
</div>

## Simple example

Assume VIN = 24 V, VOUT = 5 V, switching frequency = 400 kHz, and L = 10 uH.

Using the formula above:

<div class="formula-scroll">
  <p class="formula">Delta I<sub>L</sub> = (5 x (24 - 5)) / (10 uH x 400 kHz x 24) = 0.99 A</p>
</div>

For a 3 A output rail, that is about 33% ripple current, which is a reasonable starting point for many compact buck designs.

> **Design note:** Check the peak inductor current across input voltage, load transient, current-limit tolerance, and temperature. Saturation behavior can be soft or abrupt depending on the core material.

## Choose current ratings

The peak current is approximately output current plus half the ripple current. RMS current is close to load current in many buck designs, but thermal validation still matters because DCR loss increases with temperature.

### What to verify before release

- Inductor saturation current exceeds peak current with margin.
- RMS current rating supports the board temperature target.
- Core loss is acceptable at the selected ripple current and switching frequency.
- The control loop remains stable with the selected output filter.

## Conclusion

Start with a ripple-current target, calculate inductance, then select a real part using saturation current, RMS rating, DCR, core loss, package size, and thermal margin. The linked tool entry will become the calculator for the first sizing pass.

## Related tools

Use the sidebar or mobile tool card to open the Buck Inductor Ripple Calculator when it is available.
