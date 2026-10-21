# Changelog

All notable changes to this package are documented here. This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

### Added

- RGAA 4.1.2 as a pack for `@surea11y/core` 1.12.0 or later: the standard's criteria and tests, generated from DINUM's criteria file; the RGAA tests each of core's rules checks; one result per RGAA criterion; the `rgaa-4.1.2` profile, which runs only the rules that check an RGAA test, the pack's and core's, and reports RGAA's criteria alone, judged by WCAG 2.1; 69 opt-in rules for what RGAA requires beyond WCAG or judges differently, their ids starting with `rgaa-`; messages in English, French, German, Spanish and Japanese; and the four probes five of its rules read.
- A finding counts toward the RGAA test it fails, not every test its rule is linked to: a rule-map row can send findings to tests by what they record (`findings`), by reason code (`reasonCodes`), and ask rather than fail where it takes a person (`asks`), and each criterion's result names only the tests of the findings that decided it (core's per-requirement routing, SureA11y/core#269). Contrast failures go to 3.2.1, 3.2.2, 3.2.3 or 3.2.4 by text size and weight, invalid list markup to 9.3.1 or 9.3.2 by the list, unnamed widgets to 7.1.1 or 11.6.1 by role (a progress bar or meter to neither), and an image without alt fails 1.1.1 and is asked about under 1.2.1.

### Fixed

- The rules follow RGAA 4.1.2's revision notes: a layout table may have a `<colgroup>` (5.8.1), `basefont` is no longer a presentational attribute (10.1.2), and an `<svg role="img">`, or an SVG element with `role="img"`, named by its `<title>` passes (1.1.5, 1.1.1).
- A `<canvas>` with no role, name, fallback or link is asked about under 1.1.8 and 1.2.5 rather than failed under 1.1.8, since decorative canvases are common; an `<svg aria-hidden="true">` that keeps a `<title>` fails 1.2.4 and is asked about under 1.1.5 rather than failing both.
- Screen-reader-only text is no longer part of a visible label in `rgaa-field-label-in-name-sources`, `rgaa-link-label-in-name-sources` and `rgaa-form-button-label-in-name-sources`, which failed a link whose title repeated its visible text beside a hidden "Page active".
- `rgaa-presentational-attributes-absent` leaves out metadata and script elements, so `<link rel="mask-icon" color>` (a pinned tab's colour) no longer fails 10.1.2.
