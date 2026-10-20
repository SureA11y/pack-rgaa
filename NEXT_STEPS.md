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
- Whenever there is doubt, check both RGAA (test, methodology, glossary,
  particular cases) and what other RGAA and accessibility engines do in
  the same case, before deciding. Report the comparison to the owner, but
  keep engine names out of the repository.

## House rules

- Commit as `Jorge Rumoroso <rumoroso@gmail.com>`, end each message with
  `Signed-off-by: Jorge Rumoroso <rumoroso@gmail.com>`, and add no
  co-author or tool attribution. Push to `fix-false-positives` after each
  round, so the branch is always in sync.
- Never name other accessibility engines in code, comments, docs, the
  changelog or commit messages.
- Do not change `@surea11y/core`. An issue whose cause is in core goes in
  [`bench/CORE_ISSUES.md`](./bench/CORE_ISSUES.md) instead.
- No reference to Claude anywhere: commit authors and committers, messages,
  trailers, code, docs. Every commit is pushed at once.
- RGAA 4.1.2 (the version in force; RGAA 5 is announced, not published) is
  the source of truth; other engines only help decide where it leaves room.
- Quote RGAA in French, as the existing rules do.

## Where the work stands

Last updated at commit `1740883`: 112 rules (43 manual), a result for 78 of
RGAA's 106 criteria, 1181 tests passing. Every decision in section 3 is
built.

[`bench/AUDIT.md`](./bench/AUDIT.md) tracks every finding of the audit with
its status: search it for `| open |` (14 items), `| partial |`, `| decide |`
and `| core |`. What only core can settle is in
[`bench/CORE_ISSUES.md`](./bench/CORE_ISSUES.md).

### 1. Done: the items that needed no decision

T67-06 (`rgaa-link-title-content-name`, 6.1 note 2) and T1-13
(`rgaa-text-image-review`, 1.8) are in. So is everything core's main made
possible (its PRs #259 and #261):

- `click-handler-keyboard-operable` mapped to 7.3.1 (T67-03).
- `rgaa-moving-content-review` reads `helpers.animationsAtScanStart()`, so it
  finds finite animations over 5 seconds too (T13-05). Core's
  `moving-content-pausable` is left unmapped: it asks about the same
  animations without telling moving (13.8.1) from blinking (13.8.2), and
  mapping both would ask twice about each element.
- Findings filed by reason code: `rule-map.js` rows take
  `reasonCodes: { CODE: { tests, outcome: 'cantTell' } }`, `mappings.js`
  gives each criterion's rollup the `contributions` core reads, and the
  mapping page shows them. Used for T89-03, T89-04 (9.3), T89-09 (8.2),
  T89-10 (8.4 instead of 8.8) and T1-11 (a control's only image out of
  theme 1); tested in `tests/reason-codes.test.js`.
- `rgaa-contrast-minimum` sets `semiBold`, `contrastSwitch` and `logoText`
  to `'ask'` (T25-13, T25-14, T25-15).
- The bench gives core other origins' style sheets (`styleSheetTexts`),
  fetched in the page and from outside it (T12-12, 13.9).

### 2. When core 1.14.0 is out

The pack and the bench build against `github:SureA11y/core#main` for these
(`package.json` and `bench/package.json` dev dependencies). Once 1.14.0 is
released:

1. Set the dev dependency of both to `^1.14.0` from npm, and the pack's
   peer range to `>=1.14.0`: the reason codes, the contrast settings, the
   new rules and `animationsAtScanStart` need it. Run `npm test` and the
   bench.
2. Say so in `README.md` ("It needs `@surea11y/core` 1.12.0 or later").

Still open in core (CORE_ISSUES.md): naming the one 3.2 test of a contrast
failure (T25-12), and RGAA rollups that ask when some of a criterion's
tests have no rule (T12-08: core only does it for a standard that restates
WCAG one for one, which RGAA does not).

### 3. The owner's decisions, and their state

Decided on 2026-10-19. The owner answered 1 to 4 and delegated 5 to 14: follow
the recommendation where RGAA supports it and it holds up against what
other engines do. Update the state column as each is built.

| # | Item | Decision | State |
|---|---|---|---|
| 1 | T89-15, 9.1.3 | Drop `p-as-heading`'s number-only text (`HEADING_LIKE_NUMBER`, `tests: []`); keep asking about link-only text. | done (`f7620ed`) |
| 2 | T13-05, 13.8 | Leave core's `moving-content-pausable` unmapped; `rgaa-moving-content-review` asks once per element, moving or blinking. | done (`81c0651`) |
| 3 | T67-03, 7.3.1 | Keep `click-handler-keyboard-operable`'s failures as failures. | done (`81c0651`) |
| 4 | T1-10, 1.4 and 1.5 | New manual rule: ask about each detected CAPTCHA image or widget, under 1.4 (relevance of its alternative) and 1.5 (a non-graphic CAPTCHA or another way in). | done (`rgaa-captcha-review`) |
| 5 | T25-17, theme 4 | Ask about each visible embedded player (YouTube, Vimeo, Dailymotion, PeerTube, SoundCloud) under theme 4, and under 4.10 when it plays by itself (`autoplay=1`). | done (`rgaa-embedded-player-review`) |
| 6 | T89-11, 8.4.1 | Ask when the page's text, by stopwords, is not in the language `<html lang>` names, and when it is `und` or `mul`. | done (`rgaa-default-language-review`) |
| 7 | T89-12, 8.7.1 | Ask about passages of 8 words or more whose language, by stopwords, clearly differs from their `lang`. | done (`rgaa-language-change-review`) |
| 8 | T89-13, 9.4 | Ask about paragraphs wholly in quotation marks outside `<q>` and `<blockquote>`. | done (`rgaa-quotation-review`) |
| 9 | T10-06, 10.6.1 | Core's `link-in-text-block` should read hover and focus styles: listed in CORE_ISSUES.md; nothing in the pack. | done (listed) |
| 10 | T10-07, 10.5 | Fail 10.5.1 (an author text colour with no background colour on it or any ancestor) and 10.5.3 (a background image with none); ask about 10.5.2. No other engine fails these (one asks about 10.5.3), but the tests' text is literal. | done (`rgaa-color-declarations-paired`) |
| 11 | T11-14, 11.5.1 | Ask about three or more checkboxes sharing a name, and role="radio" sets, outside a fieldset or group. | done (`rgaa-same-name-checkboxes-review`) |
| 12 | T11-15, 11.4 | Ask, in a browser, when a label is not right above or left of its field (below or right for a checkbox or radio). | done (`rgaa-label-placement-review`) |
| 13 | T11-17 | Ask under 11.3 (fields with the same autocomplete token and different labels), 11.7 (each legend, quoted) and 11.11 (a format constraint with no example); 11.12 left open. | done (`rgaa-field-label-consistency-review`, `rgaa-legend-relevance-review`, `rgaa-format-hint-review`) |
| 15 | T11-17, 11.12 | Ask, with narrow signals only (card fields, current plus new password, or a submit button whose whole label is a French or English payment, deletion, cancellation, signature, password or test phrase); generic labels left out. Decided 2026-10-20. | done (`rgaa-consequential-form-review`) |
| 14 | T12-13, 12.1 | Ask when a page shows fewer than two of a navigation menu, a site map link and a search form. | done (`rgaa-navigation-systems-review`) |

Core PR SureA11y/core#266 is merged into core's main: the pack's rollups
now say `partial: true` for a criterion with tests no rule checks (T12-08,
done). Its `findings` entries don't settle T25-12: they file by requirement,
and RGAA's rollups are per criterion; see CORE_ISSUES.md.

Still for the owner: the reword of `dab2b17` below.

### 4. Needs browser measurement or crawler work

T25-04 (3.3, focus and field borders), T10-02, T10-03, T10-04 (10.7
focus outline cases), T10-11 (10.14, content shown on `:hover` only),
T10-13 (10.2, 10.3, 10.11: CSS-reordered and CSS-only content, reflow),
T13-04 (12.11, menus that open on hover), T13-07 (script-attached
behaviour, needs a listener probe). Each needs Chromium tests; propose
the approach to the owner first.

### 5. Design questions

T89-16 (criteria with a « pertinent » condition pass on validity alone),
T89-17 (list findings name both 9.3 tests), T12-14 (« ensemble de pages »:
never conclude from one page), T11-10 (11.9.1 passes whenever a button has
a name), T12-09 (12.6.1 questions inside other landmarks), T67-04 (text
under `aria-hidden` left out of the visible label). These change how
results roll up; discuss with the owner.

The partial items (T1-12, T1-13, T1-14, T25-21, T67-06, T89-14, T13-03, T13-06)
say in AUDIT.md what is left; the rest is either for a person or in core.

Still to do, approved by the owner:

- The owner approved rewording commit `dab2b17` ("Ask where RGAA leaves
  the call to a person…"), whose last bullet says the map notes "no longer
  compare the links with other tools". It should read "The map notes and
  the mapping page are reworded; the README and the package header count 73
  rules." This rewrites the commits after it, so it needs a force-push of
  `fix-false-positives`, which the session's permissions blocked. Do it once
  pushing with force is allowed, for instance with `git filter-branch
  --msg-filter` over `dab2b17^..HEAD`, then `git push --force-with-lease`.

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
  `document.getAnimations()` no longer lists them; read
  `helpers.animationsAtScanStart()`, which gives them as they were when
  the scan started.
- jsdom has no layout: pseudo-elements, computed backgrounds and animations
  are read only in Chromium. A rule that cannot read styles asks instead of
  failing.
- If Playwright's browser revision does not match the installed Chromium,
  point `PLAYWRIGHT_BROWSERS_PATH` at a folder of symlinks named for the
  revision it wants.
