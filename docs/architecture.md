# PE Toolbox Architecture

## Purpose and product model

PE Toolbox (PETB) is a lightweight website shell containing a growing set of power-electronics engineering tools. The shell supplies product-level concerns such as navigation, localization, SEO, and global visual tokens. The engineering tools remain highly independent inside that shell.

The primary module boundary is one complete engineering tool. An input field, result card, warning panel, table, plot, or other small UI element is not the primary architecture boundary. Before changing a tool, read comparable implemented tools and the repository conventions that connect them to the site.

The product has three main tool classes:

- **Engineering calculators** solve one bounded task directly. Current examples cover voltage sensing and ADC scaling, sensing RC filters, shunt current sensing, gate-resistor power and stress, and first-pass RC snubber design.
- **Topology designers** support a broader power-stage design workflow. Buck, Boost, Flyback, PFC, and LLC belong to this class. Depending on the topology, a designer may include specification entry, candidate search, operating-point analysis, component stress, design-space exploration, waveforms, and advanced analysis. The LLC Resonant Converter Designer is the current implemented example of this larger structure.
- **Controller designers** support power-stage modeling, compensation-network design, frequency-domain analysis, and stability evaluation. Controller entries currently present in the tool registry are marked as coming soon; the rules in this document define how implementations should fit PETB when they are added.

These classes may differ substantially in scale. They must still feel and behave as parts of one PE Toolbox product.

## Tool ownership and isolation

Each tool should own the engineering behavior required to explain and verify its result. This includes, as applicable:

- engineering equations and calculation logic;
- input and output types;
- input validation and field-level errors;
- engineering judgments, limits, and warnings;
- preferred or standard-value recommendations;
- display formatting and units;
- browser interaction logic;
- tool-specific styles;
- mathematical and physical explanations;
- assumptions and limitations;
- references and design basis;
- numerical tests and tool-specific fixtures.

Keep calculation logic pure, testable, and independent of the DOM. UI code may translate tool-specific error codes, statuses, and values for display, but the engineering result must not depend on querying or mutating page elements.

Accept limited duplication between tools when it preserves ownership and prevents coupling. Do not create a cross-tool calculation framework, validation system, unit system, formatting system, engineering-judgment system, or generic tool UI framework merely because two tools contain similar code. Shared abstractions require a demonstrated site-level responsibility or an explicit task requirement, not a theoretical DRY improvement.

Topology and controller designers may own dedicated directories, scripts, styles, data structures, workers, and test fixtures. Those assets remain part of that one tool. The current LLC implementation demonstrates this allowance through `src/lib/llc/`, `src/components/tools/llc-designer/`, `src/scripts/llc-designer/`, `src/styles/llc-designer.css`, and `tests/fixtures/default-v5-baseline.json`. Their existence does not establish a framework for every future designer.

## Page and component boundaries

A longer Astro page is acceptable when it implements one complete tool and its internal sections remain understandable. File length alone is not a reason to extract `InputPanel`, `ResultPanel`, `WarningPanel`, `TheoryPanel`, or similar components.

Extract a section only when at least one concrete reason applies:

- it has substantial independent complexity;
- it needs focused tests that cannot be expressed cleanly at the tool boundary;
- it has an explicit, stable reuse requirement;
- separating it makes a distinct runtime or ownership boundary clearer.

Do not measure architecture quality by component count, file count, or the number of abstraction layers. Judge it by engineering correctness, explainability, testability, and isolation from unrelated tools.

## Allowed shared site infrastructure

The following concerns define the PETB website shell and may be shared:

- site layouts, including `src/layouts/BaseLayout.astro`;
- Header and Footer;
- product navigation;
- localization infrastructure under `src/lib/i18n/` and locale message sources under `src/locales/`;
- SEO metadata;
- canonical URL and hreflang handling;
- sitemap and robots output;
- the tool and navigation registries in `src/data/`;
- global colors, typography, base spacing, radii, and page widths in `src/styles/global.css`;
- Analytics.

Shared site infrastructure must not grow into a general-purpose engineering calculation framework. A new tool should adapt to the existing PETB shell and design language before requesting changes to global infrastructure.

## Typical tool structure

A typical current engineering calculator usually involves the following pieces:

1. A tool-specific pure TypeScript calculation module in `src/lib/`, such as `src/lib/voltageSensing.ts` or `src/lib/sensingRcFilter.ts`. It owns formulas, types, validation, engineering checks, standard-value selection, and any tool-specific formatting that belongs with the result.
2. A tool-specific Astro page implementation in `src/components/pages/`, such as `VoltageSensingPage.astro`. It composes the inputs, results, engineering checks, explanations, references, localized copy, and browser interaction for that tool.
3. Thin formal route files under `src/pages/en/tools/` and `src/pages/zh/tools/`. The current pattern imports the same page implementation and passes `locale="en"` or `locale="zh"`.
4. A legacy unprefixed route under `src/pages/tools/` when required by the existing public-route convention. Current legacy tool routes use `LegacyRedirect.astro` to send users to the English formal route while emitting `noindex, follow` and the target canonical URL.
5. An entry in `src/data/tools.registry.ts`, placement in `src/data/navigation.registry.ts` when applicable, and matching English and Chinese metadata in `src/locales/en/tools.ts` and `src/locales/zh/tools.ts`.
6. An independent numerical test under `tests/`, such as `tests/voltage-sensing.test.mjs`. Site-build and browser tests cover route symmetry, localization, SEO output, responsive behavior, and interactions when those surfaces change.

This is a description of the established small-tool pattern, not a migration mandate or a fixed file-count rule. A simple tool may keep most page behavior in one Astro file. A complex topology or controller designer may need additional tool-owned modules, scripts, styles, workers, data structures, or fixtures.

## Design language

### Shared visual rules

Engineering calculators, topology designers, and controller designers do not need identical page layouts. They must visibly belong to PETB. All formal tool pages should use a consistent:

- font family and typographic tone;
- page-width system;
- card borders, corner radii, and surface treatment;
- spacing scale;
- heading hierarchy;
- input-control and button treatment;
- table treatment;
- status colors and warning language;
- formula presentation;
- responsive behavior.

Use the global tokens and shell conventions in `src/styles/global.css` as the starting point. Tool-specific CSS may extend them within a tool scope, as `src/styles/llc-designer.css` does under `[data-llc-designer-root]`. Tool styling must not leak into the Header, Footer, articles, or other tools.

These rules govern new tools and the surfaces explicitly changed by a task.
This document does not by itself authorize a site-wide restyling or the
migration of existing published tools.

### Engineering calculators

An engineering calculator should normally be compact, direct, and engineering-focused. Prioritize, in a useful reading order:

- a short statement of purpose;
- the input area;
- key results;
- engineering checks and warnings;
- usage guidance;
- mathematical and physical basis;
- assumptions and limitations;
- references.

Results must have stronger visual priority than supporting explanation. On arrival, a user should quickly understand the problem being solved, the required inputs, and the main output.

### Topology designers

A topology designer may use a wider and more complex workflow. When useful, it may contain areas such as Specifications, Search Summary, Recommended Designs, Selected Design, Candidate Space, Operating Points, Waveforms, Stress Summary, and Advanced Analysis. The LLC designer currently uses several of these concepts.

Complexity does not permit a separate visual identity. These regions must continue to use PETB typography, cards, headings, tables, statuses, spacing, inputs, and responsive conventions. A topology designer must not look like an embedded page from another website or an unrelated standalone product.

### Controller designers

A controller designer should extend the same visual system. Organize its workflow into clear areas for the power stage, control architecture, compensation network, design targets, frequency response, stability metrics, and component values as required by the model.

Bode plots, poles and zeros, crossover frequency, phase margin, and gain margin must use consistent labels, units, legends, and explanations. A status or margin shown in a controller designer must use the same PETB engineering semantics defined below.

### Inputs and outputs

Every user-editable input must have:

- a visible control boundary;
- a persistent label;
- an explicit unit where the value is dimensional;
- help text when the meaning, allowed range, or engineering consequence is not obvious.

Do not rely on placeholder text as the only field label. Editable content must not look like a read-only result.

Read-only values, calculated results, recommendations, and engineering statuses must be distinguishable from inputs through typography, background, border, grouping, or explicit labels. The distinction must remain clear in default, focus, error, disabled, and read-only states.

### Formulas and engineering basis

Display important equations with correct mathematical symbols and readable mathematical layout. Do not expose a core equation only as a dense plain-text expression or code-like string.

For each important equation, identify:

- every variable;
- the associated unit;
- the applicable operating conditions and assumptions;
- the engineering meaning of the result.

A formal tool page must not present computed values without enough model basis for an engineer to understand what was calculated and where the model stops applying.

### Status semantics

Use these meanings consistently:

- **Pass**: the current model and screening conditions reveal no evident problem. It is not a guarantee that hardware is safe or production-ready.
- **Review**: the design may be usable, but an engineer must verify an assumption, margin, rating, measurement, or model limitation.
- **Fail**: an input, stress, range, required condition, or model condition is clearly not satisfied.

Use consistent labels, colors, precedence, and explanatory language across tools. Never reuse one status color for a different meaning on another page. State what triggered Review or Fail; color alone is not sufficient.

### Circuits, block diagrams, waveforms, and plots

Use clear, restrained, engineering-oriented graphics. Circuit diagrams must follow familiar power-electronics reading conventions. Nodes, components, signal direction, polarity, and measurement locations must be identifiable. Block diagrams must make signal flow and control boundaries explicit. Do not add decorative graphics that carry no engineering information.

Charts must provide axis names, units, legends, and any explanation required to interpret limits, operating points, or status regions. Waveforms must identify signals and relevant time or phase references. Design-space plots must explain encodings and infeasible regions. All graphics must remain readable on desktop and mobile.

### Responsive behavior

Responsive design must preserve engineering meaning, not merely remove horizontal overflow. At narrower widths:

- input labels, units, and errors must stay associated with their controls;
- primary results and statuses must remain prominent;
- tables and plots must use a deliberate readable strategy, such as controlled horizontal scrolling, reflow, or an alternate compact presentation;
- legends, annotations, and measurement units must remain available;
- touch targets and controls must remain operable;
- content order must preserve the tool workflow.

Use the repository's browser checks when a task changes interaction or responsive behavior.

## Localization, routes, and SEO

English and Chinese formal pages must provide the same functionality, calculation logic, hierarchy, and interaction behavior. Copy may differ in length and phrasing to read naturally, but neither locale may omit engineering content or controls available in the other.

Public tools must follow the existing `/en/` and `/zh/` route pattern. Use the current localization helpers and message sources rather than adding an unrelated localization mechanism. Preserve the canonical, `hreflang="en"`, `hreflang="zh-CN"`, `hreflang="x-default"`, and legacy-route behavior implemented by the current site shell and tested in `tests/site-build.test.mjs` and `tests/browser-smoke.mjs`.

Do not casually rename, remove, or change the canonical of a published route. URL and SEO infrastructure changes are site-level work and must be explicitly requested.

## Development and change boundaries

Follow the minimum-impact rule. When adding or modifying one tool:

- do not refactor another published tool as incidental cleanup;
- do not change another tool's calculations, page structure, or visual behavior;
- do not reorganize repository-wide directories;
- do not change global infrastructure to accommodate one unusual implementation unless the task explicitly requires a site-wide adjustment;
- add or update numerical tests for changed engineering logic, including defaults, known references, boundaries, invalid inputs, unit conversions, and status decisions;
- preserve route and locale symmetry when the public surface changes.

New tools should fit the established PETB design language first. Site-wide unification work must be scoped and reviewed as its own task.

## Architecture priorities

When priorities compete, prefer:

1. engineering correctness;
2. explicit assumptions and explainable results;
3. numerical testability;
4. isolation between tools;
5. clear and consistent user interaction;
6. implementation simplicity within the tool boundary.

Do not optimize primarily for theoretical DRY, the fewest files, the most components, or the deepest abstraction hierarchy. PETB is not a general calculator framework. Its architecture exists to hold many independent, visually consistent power-electronics engineering tools safely over time.

## Non-goals

PETB does not aim to:

- build a universal tool, calculation, validation, unit, formatting, or engineering-judgment framework;
- maximize code reuse between otherwise independent tools;
- split an understandable single-tool Astro page mechanically because it is long;
- force existing tools into one file count or directory template;
- perform a bulk migration of old tools to a new structure;
- refactor unrelated modules while adding one tool;
- make every tool class use an identical page layout;
- trade engineering explanation or numerical verification for abstraction purity.
