# Triage

What the divergences in [RESULTS.md](./RESULTS.md) come from, as far as they have been looked at. Each entry says which engine is right, and how that was checked.

## Explained

**8.1 (doctype), `@a11ylint/core` fails every page.** Its test 8.1.3 reports "doctype should be first" when the doctype *is* the document's first node (`RGAA8.RGAA81`: `if (doc.firstChild?.nodeType === doc.DOCUMENT_TYPE_NODE)` pushes the error), so every correct page fails 8.1. Checked on W3C's repaired BAD home page, whose doctype comes first. A false positive of a11ylint's; its 157 failures of 8.1 on the audited sites are this.

**2.1 (frame titles), the other four engines fail 41 pages the pack finds inapplicable.** The frames are hidden from assistive technology: on bordeaux-metropole.fr a Snapchat tracking frame with `display: none` and `aria-hidden="true"`, on caisse-epargne.fr a video frame inside a `display: none` container, and the same frames on the other pages of those sites. RGAA judges content assistive technologies render, so the pack's verdict is right and the others' failures are false positives. Checked in Chromium, on the pages as scanned.

## Not looked at yet

The criteria where the pack and an engine disagree most, from RESULTS.md, other than the above:

- **8.2 (valid code), RGAA Audit:** the pack fails it on 140 pages where RGAA Audit passes it.
- **6.1 and 6.2 (links), `@uuv/a11y`:** it fails them on 91 and 76 pages where the pack passes them.
- **11.9 (button names), RGAA Checker and RGAA Audit:** they fail it on 75 and 30 pages where the pack passes it.
- **11.1 and 1.2, `@uuv/a11y`:** the pack fails them on 43 and 27 pages where `@uuv/a11y` passes them.
- **10.1, 1.9, 11.6 and 9.1, RGAA Checker:** it fails them on 30, 24, 17 and 18 pages where the pack passes them.
