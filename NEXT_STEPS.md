# Next steps on `fix-false-positives`

A handoff note for whoever continues this branch. **Delete this file in the
last commit of the work it describes**, when the open items below are done
or moved elsewhere.

## The goal

Make the pack's rules right against RGAA 4.1.2 (the published version; its
`criteres.json` is `data/criteres-4.1.2.json`), with no false positives and
as many detections as RGAA allows:

- **Fail** only where RGAA's text makes the verdict certain *and* an auditor
  applying it would fail it too. If an auditor could reasonably pass the
  case, the rule asks instead.
- **Ask (cantTell)** where RGAA leaves the call to a person, with a message
  that says exactly what to check.
- Where the test's text and its methodology or glossary disagree, ask.

## House rules

- Commit as `Jorge Rumoroso <rumoroso@gmail.com>`, end each message with
  `Signed-off-by: Jorge Rumoroso <rumoroso@gmail.com>`, and add no
  co-author or tool attribution. Push to `fix-false-positives` after each
  round, so the branch is always in sync.
- Never name other accessibility engines in code, comments, docs, the
  changelog or commit messages.
- Do not change `@surea11y/core`. An issue whose cause is in core goes in
  [`bench/CORE_ISSUES.md`](./bench/CORE_ISSUES.md) instead.
- Quote RGAA in French, as the existing rules do.

## Where the work stands

[`bench/AUDIT.md`](./bench/AUDIT.md) tracks every finding of the audit with
its status. Search it for `| open |` (about 50 items left), `| partial |`
and `decide`. Items marked `core` are in `bench/CORE_ISSUES.md`.

Suggested order for the open items, most useful first:

1. T25-18 (5.1.1): a complex table whose `aria-describedby` resolves to
   nothing passes. Same approach as `rgaa-img-describedby-target`.
2. T1-08 (1.9.2–1.9.5): captioned `<svg>`, `<canvas>`, `<object>` and
   `<embed>` images are not checked (see `rgaa-figure-caption-structure`).
3. T11-11 (11.2.1, 11.2.2): an empty `<label for>`, or a `title` as the only
   label, is not failed.
4. T11-07 (11.1.3): a field whose only `<label>` is visually hidden is never
   asked about.
5. T25-19 (5.6.1, 5.6.2): headers marked up as bold `<td>`.
6. T10-10 (10.8.1): visible, informative text under `aria-hidden="true"`.
7. T67-09 (7.3.2): `onfocus="this.blur()"`.
8. T1-12 (rest of 1.6, 1.7): only 1.6.9 is checked so far.
9. The rest of the open list.

Owner decisions still pending:

- T1-05: whether a bare `<canvas>`, `<object>` or `<embed>` image with no
  alternative fails 1.1 or is asked about (it may be decorative).
- Whether to reword the message of commit `dab2b17`, which mentions "other
  tools". That needs a force-push of the branch, so ask the owner first.

## How a rule change is made

For each new or changed rule:

1. The rule in `rules/automatic/` or `rules/manual/` (manual rules only ask).
   Keep constants inside `runInPage`: it runs in the page through
   `toString()`. Read roles with `helpers.aria.getExplicitRole`, and select
   by role with `[role~="x" i]` (the lint rules enforce both).
2. Its entry in `rule-map.js` (`tests` and a `note` that cites RGAA).
3. Its messages in all five `i18n/*.json` files (en, fr, es, de, ja).
4. A test in `tests/rules/<automatic|manual>/<rule-id>.test.js`, a fixture
   `tests/fixtures/<rule-id>-all-scenarios.html` whose targets have stable
   ids, and a Chromium test (`*-chromium.test.js`) when the rule reads
   layout, CSS or animations.
5. A section in `docs/RULE_EXAMPLES.md`.
6. Regenerate: `npm run map`, `npm run mapping-doc`, `npm run docs` (needs
   Chromium), and the fixture index:

   ```sh
   node ../core/scripts/generate-fixture-index.js --checksDir rules \
     --fixturesDir tests/fixtures --testsDir tests/rules \
     --out tests/fixtures/INDEX.md --json tests/fixtures/index.json \
     --html tests/fixtures/index.html
   ```

   The script needs a checkout of `@surea11y/core` (here a sibling `core`
   directory). It overwrites line 3 of `tests/fixtures/INDEX.md`: restore
   that line from `git show HEAD:tests/fixtures/INDEX.md`.
7. Update the counts in `README.md` (rules, manual rules, criteria with a
   result; `docs/RGAA_MAPPING.md` gives the criteria count) and in the
   header comment of `index.js`.
8. Update the item's status in `bench/AUDIT.md`.
9. Run `npx prettier --write` on the `.js` files you changed only.
   Running it on `README.md`, `docs/*.md` or the fixtures reformats lines
   that were never formatted, and those must stay as they are. Then run
   `npm test`, which runs prettier's check, lint, the generated-file checks
   and every test.

## Things that will trip you up

- The four label-in-name rules (`rgaa-link-label-in-name-sources`,
  `rgaa-field-label-in-name-sources`, `rgaa-form-button-label-in-name-sources`,
  `rgaa-widget-label-in-name`) share one `runInPage` body that differs only
  by its `family` constant and messages. Change all four together.
- Atomic rules report in `checksResults`, not `rulesResults`, of a scan.
- Core moves finite CSS animations to their end while it scans, so
  `document.getAnimations()` no longer lists them (CORE_ISSUES T13-05).
- jsdom has no layout: pseudo-elements, computed backgrounds and animations
  are read only in Chromium. A rule that cannot read styles asks instead of
  failing.
- If Playwright's browser revision does not match the installed Chromium,
  point `PLAYWRIGHT_BROWSERS_PATH` at a folder of symlinks named for the
  revision it wants.
