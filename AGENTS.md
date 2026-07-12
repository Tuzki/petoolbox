# Repository purpose

- PE Toolbox is a website composed of multiple independent power-electronics engineering tools.
- Treat a complete engineering tool as the primary module boundary, not a small UI component.
- Before making changes, read the relevant existing tools and repository conventions.

# Tool isolation

- Keep each engineering tool as independent as practical, including its calculation logic, input and output types, input validation, engineering judgments and warnings, standard-value recommendations, page interactions, tool-specific styles, mathematical and physical basis, and numerical tests.
- A tool may use a relatively large single Astro page when that keeps the implementation cohesive.
- Do not split out components such as `InputPanel`, `ResultPanel`, or `WarningPanel` merely to reduce file length.
- Unless explicitly requested, do not create cross-tool calculation frameworks, unit systems, validation frameworks, formatting utilities, engineering-judgment systems, or shared tool UI components.
- Prefer limited duplication between two tools over additional coupling between them.
- When implementing a new tool, do not opportunistically refactor, reorganize, or modify unrelated tools.

# Allowed shared infrastructure

The following site-level infrastructure may be shared:

- layouts;
- header and footer;
- navigation;
- localization infrastructure;
- SEO metadata infrastructure;
- canonical and hreflang handling;
- sitemap and robots;
- tool registry;
- analytics;
- global site styles.

Do not allow site-level infrastructure to evolve into a general-purpose tool calculation framework.

# Existing implementation conventions

- Inspect comparable existing tools before choosing file locations or names. Current implementations use pure calculation modules under `src/lib/`, tool pages under `src/components/pages/` or `src/components/tools/`, localized route files under `src/pages/en/` and `src/pages/zh/`, and numerical tests under `tests/`.
- Keep calculation logic testable, pure, and independent of the DOM.
- English and Chinese pages must follow the existing `/en/` and `/zh/` route convention.
- Follow the existing route-file pattern; localized route files currently delegate to a shared page implementation with a locale prop.
- Integrate new tools with the actual registries in `src/data/tools.registry.ts` and `src/data/navigation.registry.ts`, and with the localization mechanism under `src/locales/` and `src/lib/i18n/`.
- Do not introduce a new directory hierarchy or repository-wide architecture based only on personal preference.

# SEO and production safety

Unless explicitly requested, do not modify:

- published page slugs;
- existing production URLs;
- canonical URLs;
- hreflang or x-default output;
- `src/pages/robots.txt.ts`;
- `src/pages/sitemap-index.xml.ts`;
- legacy redirects;
- the production domain;
- `vercel.json` or other Vercel configuration.

Do not casually rename, remove, or change the canonical of a published URL submitted for search-engine indexing.

# Git safety

- Base new feature work on `develop` by default.
- Unless explicitly requested, do not modify, merge, or push `main`.
- Never force-push, rewrite Git history, delete branches, or perform destructive rebases on shared branches.
- Do not commit `dist`, screenshots, caches, temporary files, or unrelated generated files.
- Do not modify files unrelated to the current task.

# Dependencies

- Do not add, remove, or upgrade npm dependencies without explicit approval.
- Do not introduce a new frontend framework or state-management library for a simple feature.
- Prefer the repository's existing Astro, TypeScript, CSS, and browser-native capabilities.

# Validation

Before completing a code task, normally run:

- `npm run check`
- `npm run test`
- `npm run build`

Also run `npm run test:browser` when the task affects page interactions, responsive layout, routes, navigation, SEO-visible output, or browser behavior.

When changing calculation logic, add or update numerical tests covering:

- default values;
- a known reference case;
- boundary inputs;
- invalid inputs;
- unit conversion;
- engineering status judgments.

# Completion report

After every task, report:

- modified files;
- implemented changes;
- test commands and results;
- current branch;
- commit hash;
- whether the working tree is clean;
- whether `main` was modified;
- whether Vercel configuration was modified;
- whether dependencies were modified;
- whether unrelated tools were modified;
- any unresolved issues.
