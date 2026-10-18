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
- Quote RGAA in French, as the existing rules do.

## Where the work stands

Last updated at commit `6e5cbb7`: 98 rules (31 manual), a result for 63 of
RGAA's 106 criteria, 1067 tests passing.

[`bench/AUDIT.md`](./bench/AUDIT.md) tracks every finding of the audit with
its status: search it for `| open |` (28 items) and `| partial |` (7).
Items marked `core` are in [`bench/CORE_ISSUES.md`](./bench/CORE_ISSUES.md).
The open items fall in five groups; work them in this order.

### 1. Doable now, without the owner

- **T1-13 (1.8, images of text):** no question yet. A manual rule could ask
  about `<img>`, `input type=image`, image `<object>`/`<embed>` and
  `<canvas>` whose alternative reads like a sentence or a slogan, outside
  logos (1.8's particular case exempts logos, brand names, CAPTCHAs and
  images whose exact rendering matters). Keep it a question: whether an
  image holds text is for a person.
- **T67-06 (6.1 note 2):** a link `title` must repeat the link's visible
  name. Compare the `title` with the content's text (the same normalisation
  as the label-in-name rules) and ask, or fail when the title clearly drops
  it; check what other engines do first.
- **T89-10 (8.4 vs 8.8):** a `lang` that sets the default language (no
  `lang` on any ancestor, as on `<body>`) is judged under 8.8 because core's
  `valid-lang` gives it the same reason code as a change of language. Core's
  next release gives it its own code, `DEFAULT_LANG_INVALID`; the pack side
  is in 2.

### 2. When core releases its fixes

Two sets of core changes are waiting for a release (1.14.0); the pack runs
on 1.12.1 until then:

- Core's main after 1.13.0 (commit `94ef114`) fixes nine issues in
  `bench/CORE_ISSUES.md` (C1, C2, C3, C4, C7, C8, C9, C10, T12-11) and C5
  in part.
- Core's branch `fix-pack-findings` (PR SureA11y/core#261) answers most of
  the rest: T1-04, T67-07, T13-08 and T13-02 are fixed outright, and the
  others get what the pack needs to settle them on its side, listed below.

Once 1.14.0 is out:

1. Raise the `@surea11y/core` dev dependency and the peer range to
   `^1.14.0`, and run `npm test`. Tests that pin core's old behaviour will
   change (for instance `tests/core-rules.test.js`); check each change is
   the fix, not a regression. In particular: a placeholder below its ratio
   now fails when the page chose its colours and passes in the browser's
   own (T25-16, 3.2), `css-hidden-focus` now asks about links in an
   off-canvas menu or a clipped container (T13-02, 10.7.1, 12.8.1), and
   `link-name-quality` knows the French phrases `rgaa-link-context-review`
   copied (T67-07): keep the two lists the same.
2. Map core's new rules: `click-handler-keyboard-operable` to 7.3.1
   (« Chaque élément manipulable via un script est-il contrôlable au
   clavier ? »), its failure a role="button", link, checkbox or switch
   that cannot take focus, then close T67-03; and `moving-content-pausable`
   (2.2.2, content an animation moves by itself for more than five seconds
   or without end) to 13.8.1 and 13.8.2, then close T13-05. Rules that need
   the animations themselves read `helpers.animationsAtScanStart()`.
3. File findings by reason code. A rule-map row can now say, per reason
   code, which tests its findings count toward (`[]` for none) and make a
   failing one a question there:
   `reasonCodes: { CODE: { requirements, outcome: 'cantTell' } }`, in
   `ruleMappedStandard`'s rule map (core's `docs/PACKS.md`). The rollup of
   each test then judges the rule by the findings that count toward it.
   Use it for:
   - T89-03: `list-children-valid`'s `LIST_ITEM_ROLE_OVERRIDDEN`
     (`<li role="presentation">` in pagers and carousels): ask under 9.3.1
     and 9.3.2.
   - T89-04: `listitem-parent-valid`'s `LIST_ROLE_OVERRIDDEN` (a plain `<li>`
     in `<ul role="tablist">` or `role="menu"`, the role in `parentRole`):
     ask under 9.3.1 and 9.3.2, as 9.3's technical note says such roles are
     not lists.
   - T89-09: `duplicate-id`'s `DUPLICATE_ID_IN_SHADOW_TREE`: ask under
     8.2.1, which the validator never sees.
   - T89-10: `valid-lang`'s `DEFAULT_LANG_INVALID`: keep it out of 8.8 and
     file it under 8.4.
   - T1-11: `IMAGE_ONLY_CONTROL_CONTENT` (an image that is a link's or
     button's only content, the control's role in `controlContent`), from
     `img-alt-quality`, `svg-text-alternative-quality` and
     `img-alt-decorative`: keep it out of 1.1, 1.2 and 1.3 and judge it
     under 6.1 or 11 with the control, per the glossary's « Image porteuse
     d'information », notes 1 and 2.
   - C5: `p-as-heading`'s `HEADING_LIKE_NUMBER` and `HEADING_LIKE_LINK`
     (text that is only a number, or one link): decide whether 9.1 still
     asks about them, and drop them with `requirements: []` if not.
4. Contrast (T25-12 to T25-15): the `rgaa-contrast-minimum` variant can now
   set `logoText` (`'ask'` or `'exempt'`, for 3.2's logo particular case),
   `contrastSwitch` (`'ask'`, for each test's contrast-mechanism condition)
   and `semiBold` (`'ask'`, for weights 600 to 699 where RGAA does not say
   what bold is); core's `docs/RULE_SETTINGS.md` lists them. To name the
   one test each failure falls under (3.2.1 to 3.2.4), read the stable
   `typography.isBold`, `typography.isLargeText` and
   `typography.fontSizePx` of the finding: they share one reason code, so
   the rule map can't split them, and the pack's own code has to.
5. Style sheets from another origin (C6, 13.9): core now reads their text
   from `engineOptions.styleSheetTexts`, and the bindings fetch them before
   each scan. Have the bench do the same (in the page, core's
   `runa11yCoreInPageAsync`; from Node, fetch what it can't and pass it
   in), so 13.9 stops asking on pages whose only unread sheet is a fonts
   service's.
6. Rollups (T12-08): core's WCAG rollups are now `cantTell`
   (`composite.rollup.cantTell.partialCoverage`) instead of
   `notApplicable` where their rules don't cover every case. The pack's
   composites are its own: give `rgaaComposites()` the same rule for the
   tests no rule covers.
7. Mark the fixed items `done` in AUDIT.md and remove them from
   CORE_ISSUES.md, or set their status to what is left.

To recheck an issue against an unreleased core: check core's main out in
a scratch folder, replace `node_modules/@surea11y/core` with a symlink to
it (core has no dependencies), run the repro with
`node --preserve-symlinks`, then put the original folder back.

### 3. Waiting on the owner's decision

Each is marked Q in AUDIT.md: T1-10 (CAPTCHAs), T25-17 (embedded players
and `autoplay=1`), T89-11 (a wrong default language, `und`, `mul`), T89-12
(changes of language), T89-13 (quotations), T10-06 (links at 3:1), T10-07
(text colour with no background colour), T11-14 (same-name checkbox sets,
`role=radio` sets), T11-15 (label placement), T11-17 (smaller form
questions), T12-13 (two ways to navigate). Ask the owner, with what RGAA
says and what other engines do, before building any of them.

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

The partial items (T1-12, T1-14, T25-21, T67-07, T89-14, T13-03, T13-06)
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
  `document.getAnimations()` no longer lists them (CORE_ISSUES T13-05).
  From core 1.14.0, `helpers.animationsAtScanStart()` gives a rule the
  animations as they were when the scan started.
- jsdom has no layout: pseudo-elements, computed backgrounds and animations
  are read only in Chromium. A rule that cannot read styles asks instead of
  failing.
- If Playwright's browser revision does not match the installed Chromium,
  point `PLAYWRIGHT_BROWSERS_PATH` at a folder of symlinks named for the
  revision it wants.
