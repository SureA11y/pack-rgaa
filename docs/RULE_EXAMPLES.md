# Rule examples: RGAA

`Passed`/`Failed` (or, for manual rules, `Flagged`/`Not applicable`) example
pairs for every rule of the RGAA pack, the rules in `rules/`
for requirements RGAA makes and WCAG does not. Companion to
[`RULE_CATALOG.md`](./RULE_CATALOG.md), which carries each rule's title,
applicability and expectation. Core's rules have theirs in core's
[`docs/RULE_EXAMPLES.md`](https://github.com/SureA11y/core/blob/main/docs/RULE_EXAMPLES.md), which describes how
the examples were verified.

These rules are opt-in, tagged `rgaa`: a scan runs them under the `rgaa-4.1.2`
profile or when asked for by tag.

Manual rules (`type: 'manual'`) are capped at `cantTell`/`notApplicable` and
never return `pass`/`fail`; their pair below is `Flagged (cantTell)` /
`Not applicable` instead of `Passed`/`Failed`.

## rgaa-area-alt-source

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<img src="map.png" usemap="#m" alt="Carte de France">
<map name="m">
  <area href="/paris" coords="0,0,50,50" alt="Paris">
</map>
```
The linked area takes its text alternative from `alt`.

**Failed**
```html
<img src="map.png" usemap="#m" alt="Carte de France">
<map name="m">
  <area href="/paris" coords="0,0,50,50" title="Paris">
</map>
```
The area is named only by `title`, which RGAA 1.1.2 does not list for `<area>`.

## rgaa-aria-attribute-conformance

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<h2 aria-expanded="true">Delivery options</h2>
<button aria-describedby="help-text">Send</button>
```
The W3C validator accepts both: `aria-expanded` is allowed on a heading, and an `aria-describedby` that points to no element is not a validator error (only `aria-activedescendant` must resolve). WCAG rules may still flag them.

**Failed**
```html
<button aria-expanded="">Menu</button>
<div aria-label="Main menu">Menu</div>
<div role="heading">News</div>
```
Three validator errors under RGAA 8.2.1: an empty `aria-expanded` value, `aria-label` on a `<div>` with no role (which cannot be named), and `role="heading"` without `aria-level`, which the validator requires although WAI-ARIA gives a default level.

## rgaa-aria-hidden-text-review

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<p aria-hidden="true">Offre valable jusqu’au 31 mars</p>
```
Sighted users read the text, screen reader users never hear it: a person checks that it is given to them another way, or carries no information (RGAA 10.8.1).

**Not applicable**
```html
<label>Nom <span aria-hidden="true">*</span></label>
```
A sign alone is not text of two words.

## rgaa-aria-list-item-roles

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<div role="list">
  <div role="listitem">Home</div>
  <div role="listitem">Contact</div>
</div>
```
The list is built with `role="list"` and `role="listitem"`, one of the two structures RGAA 9.3.1 and 9.3.2 accept.

**Flagged (cantTell)**
```html
<div role="list">
  <li>Apples</li>
  <li>Pears</li>
</div>
```
The items are `<li>` elements without `role="listitem"`, so the list is neither `<ul>`/`<ol>` with `<li>` nor `role="list"` with `role="listitem"`. It is asked about, not failed: whether the content is visually a list, and an ordered or unordered one, is for a person. This rule never fails.

## rgaa-aria-role-conformance

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<div role="button" tabindex="0">Open</div>
<img src="play.png" alt="Play" role="button">
<img src="rule.png" alt="" role="presentation">
```
Both roles are ones the W3C validator accepts, and allowed on their elements; the image carrying a role has a text alternative. The validator reports `<img alt="" role="presentation">`, but it passes RGAA 8.2.1: RGAA 1.2.1 names that markup for decorative images, and ARIA in HTML allows it.

**Failed**
```html
<div role="bogus button" tabindex="0">Open</div>
<nav role="tab">Products</nav>
```
The validator reports the unknown token `bogus` even though `button` follows it as a fallback (WCAG's `aria-roles-valid` passes on one valid token), and `role="tab"` is not allowed on `<nav>`. Both fail RGAA 8.2.1. So does an `<img role="presentation">` with no alt: HTML requires alt on an `<img>`, and the role does not replace it.

## rgaa-autocomplete-user-field

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<label for="e">Courriel</label>
<input id="e" type="email" autocomplete="email">
```
The field asks for the user's email and its value is in RGAA's list (11.13.1). Whether the value suits the field is for a person.

**Failed**
```html
<label for="e">Courriel</label>
<input id="e" type="email" autocomplete="email home">
```
The value names a field of the list, so the author says it is about the user, but it is not well formed and the browser cannot use it. A field that looks like personal data with no autocomplete, `on` or `off` is asked about instead, and an invalid value on a field that does not concern the user, such as a search field, is out of scope.

## rgaa-canvas-decorative-aria-hidden

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<canvas aria-hidden="true" width="40" height="20"></canvas>
```
The decorative canvas is hidden and carries no alternative.

**Failed**
```html
<canvas role="presentation" width="40" height="20"></canvas>
```
The canvas is marked decorative by its role but has no `aria-hidden="true"`, which RGAA 1.2.5 requires.

**Flagged (cantTell)**
```html
<canvas role="none" width="40" height="20">Ventes 2024 : 10 000</canvas>
```
If the image carries information, the content is its alternative; if it is decorative, it needs `aria-hidden="true"` and no content.

## rgaa-canvas-role-img

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<canvas role="img" aria-label="Ventes 2024" width="40" height="20"></canvas>
```
The canvas has `role="img"` and an `aria-label`.

**Failed**
```html
<canvas role="img" width="40" height="20">Ventes 2024 : 10 000</canvas>
```
With `role="img"`, only `aria-labelledby` or `aria-label` can provide the alternative; fallback content does not count.

**Flagged (cantTell)**
```html
<canvas width="40" height="20"></canvas>
<a href="/donnees">Données du graphique</a>
```
A person checks that the adjacent link leads to an alternative content. A canvas with nothing at all is asked about too, since it may be decorative (then it fails 1.2.5), unless it certainly carries information, captioned or focusable: then it fails. An image that is the only content of a link or a button is judged as the control's label, under Links (6.1), Forms (11.9) or Scripts (7.1), as the glossary « Image porteuse d'information » (notes 1 and 2) says.

## rgaa-captcha-review

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<img src="captcha.php" alt="Image CAPTCHA">
```
A person checks that the alternative says what to do, and that an audio CAPTCHA or another way in is offered (RGAA 1.4, 1.5).

**Not applicable**
```html
<img src="mairie.jpg" alt="La mairie">
```
Nothing says the image is a CAPTCHA.

## rgaa-color-reference-review

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<p>Les champs indiqués en rouge sont obligatoires.</p>
```
The text indicates required fields by a colour: a person checks that they are also marked another way, such as an asterisk or the word « obligatoire » (RGAA 3.1.2).

**Not applicable**
```html
<p>T-shirt rouge en coton bio.</p>
```
The colour names a product; it indicates nothing on the page.

## rgaa-complex-table-summary

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<table>
  <tr><td></td><th colspan="2">2025</th></tr>
  <tr><td></td><th>Q1</th><th>Q2</th></tr>
  <tr><th>North</th><td>10</td><td>12</td></tr>
</table>
```
Two rows of headers make the table complex, and nothing points to a summary of how it is organised.

**Not applicable**
```html
<table>
  <tr><th>Item</th><th>Price</th></tr>
  <tr><th>Tea</th><td>2</td></tr>
</table>
```
All headers are in the first row and first column: a simple table, which needs no summary.

## rgaa-complex-table-summary-quality

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<table>
  <caption>Sales by year and quarter</caption>
  <tr><td></td><th colspan="2">2025</th></tr>
  <tr><td></td><th>Q1</th><th>Q2</th></tr>
  <tr><th>North</th><td>10</td><td>12</td></tr>
</table>
```
A complex table with a summary in its caption: a person checks that it explains the nature and structure of the table (RGAA 5.2.1), not only its title.

**Not applicable**
```html
<!doctype html>
<table summary="Sales by year and quarter">
  <tr><td></td><th colspan="2">2025</th></tr>
  <tr><td></td><th>Q1</th><th>Q2</th></tr>
  <tr><th>North</th><td>10</td><td>12</td></tr>
</table>
```
In an HTML5 document the `summary` attribute is not a summary, so the table has none to judge; rgaa-complex-table-summary asks about it under 5.1.1. Under an HTML 4.01 doctype the same table is flagged.

## rgaa-consequential-form-review

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<form action="/paiement"><label for="cc">Numéro de carte</label><input id="cc" autocomplete="cc-number"><button type="submit">Payer 49 €</button></form>
```
A person checks that the order can be reviewed, confirmed or cancelled (RGAA 11.12).

**Not applicable**
```html
<form action="/contact"><label for="m">Message</label><textarea id="m"></textarea><button type="submit">Envoyer</button></form>
```
A contact form has none of the consequences 11.12 names.

## rgaa-context-change-review

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<select onchange="this.form.submit()" aria-label="Langue"><option>Français</option><option>English</option></select>
```
Choosing an option submits the form at once: a person checks that a text before the list warns of it (RGAA 7.4.1).

**Not applicable**
```html
<select aria-label="Langue"><option>Français</option></select><button>Changer</button>
```
An explicit button starts the change.

## rgaa-contrast-minimum

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<p style="font-size:18.5px; font-weight:700; color:#888888; background:#ffffff">Opening hours</p>
```
Bold text of 18.5px is large for RGAA (3.2.4), so 3.54:1 is enough. WCAG makes bold text large only from 14pt (about 18.67px), so `contrast-minimum` fails the same text.

**Failed**
```html
<p style="font-size:18px; font-weight:700; color:#888888; background:#ffffff">Opening hours</p>
```
Bold text below 18.5px needs 4.5:1 (3.2.2); #888888 on white is 3.54:1.

## rgaa-css-colors-paired

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<style>body { color: #222; background: #fff; } p { color: #555; }</style>
<p>Opening hours</p>
```
The paragraph's text color is paired with the background color declared on `<body>`, which RGAA 10.5.1 accepts « au moins, héritée d'un parent ».

**Failed**
```html
<style>p { color: #555; }</style>
<p>Opening hours</p>
```
A text color is declared and no background color is, on the paragraph or any ancestor (10.5.1): a reader whose browser shows a dark background keeps the grey text on it.

## rgaa-cryptic-content-review

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<p>Merci pour votre visite :-)</p>
```
The emoticon has no title: a person checks that the text next to it says what it means (RGAA 13.5.1).

**Not applicable**
```html
<p><abbr title="sourire">:-)</abbr></p>
```
The emoticon has a title; whether it is relevant is 13.6.1's matter.

## rgaa-current-item-review

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<nav><ul><li class="active"><a href="/">Accueil</a></li><li><a href="/contact">Contact</a></li></ul></nav>
```
Only a class marks the active page, the glossary's first example of information given by position or shape: a person checks, and aria-current="page" fixes it (RGAA 10.9.1).

**Not applicable**
```html
<nav><a href="/" class="active" aria-current="page">Accueil</a></nav>
```
aria-current tells the active page.

## rgaa-data-table-headers-review

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<table>
  <tr><td>Name</td><td>Age</td></tr>
  <tr><td>Ann</td><td>34</td></tr>
</table>
```
No cell is a header. If this is a data table, "Name" and "Age" are column headers and RGAA 5.6.1 wants them in `<th>`. Only a person can tell whether it is a data table.

**Not applicable**
```html
<table>
  <tr><th>Name</th><th>Age</th></tr>
  <tr><td>Ann</td><td>34</td></tr>
</table>
```
The table has header cells, so the question does not come up. A table with `role="presentation"` is not asked about either.

## rgaa-default-language-review

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<html lang="und">
```
und (undetermined) and mul (several languages) are valid codes but name no language: a person checks which language the page is mainly in (RGAA 8.4.1).

**Flagged (cantTell)**
```html
<html lang="en"> … <p>La médiathèque municipale ouvre ses portes du mardi au samedi…</p>
```
The page's text is clearly French, by its frequent words, while lang says English.

**Not applicable**
```html
<html lang="fr"> … <p>La médiathèque municipale ouvre ses portes du mardi au samedi…</p>
```
The text is in the declared language.

## rgaa-dir-attribute-valid

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<p dir="rtl" lang="ar">مرحبا</p>
```
The direction is `rtl`, one of the two values RGAA accepts.

**Failed**
```html
<p dir="auto" lang="ar">مرحبا</p>
```
HTML allows `dir="auto"`, but RGAA accepts only `ltr` or `rtl` on text that reads in the reverse direction of the page. `dir="auto"` on text in the page's own direction is not applicable.

**Failed**
```html
<p dir="rtl">Bonjour tout le monde</p>
```
The French text reads left to right: `dir="rtl"` turns it the wrong way, which is not a relevant value (RGAA 8.10.2).

## rgaa-doctype-position

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<!DOCTYPE html>
<html lang="fr">…</html>
```
The doctype comes first. The parser keeps a doctype only there, so a doctype in the DOM is enough.

**Failed (with the `page.source` probe)**
```html
<html lang="fr">
<!DOCTYPE html>
…</html>
```
The source declares the doctype after the `<html>` tag, and browsers ignore it. Without the probe the parsed page simply has no doctype, so the rule asks; with it, RGAA 8.1.3 fails, and `rgaa-doctype-present` counts the doctype as present for 8.1.1.

## rgaa-doctype-present

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<!doctype html>
<html lang="en">
  <head><title>Quarterly report</title></head>
  <body>Hi</body>
</html>
```
The document starts with the HTML5 doctype.

**Failed**
```html
<html lang="en">
  <head><title>Quarterly report</title></head>
  <body>Hi</body>
</html>
```
No doctype, which RGAA 8.1.1 requires.

## rgaa-doctype-valid

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
  "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html lang="en" xml:lang="en">
  <head><title>Quarterly report</title></head>
  <body><p>Hi</p></body>
</html>
```
XHTML 1.0 Strict is on the W3C list of recommended doctypes, so RGAA 8.1.2 accepts it.

**Failed**
```html
<!DOCTYPE html PUBLIC "-//Example//DTD Custom HTML//EN">
<html lang="en">
  <head><title>Quarterly report</title></head>
  <body><p>Hi</p></body>
</html>
```
The public identifier is neither HTML5's (none) nor a W3C recommended one. A page with no doctype is not applicable here: `rgaa-doctype-present` fails it under 8.1.1.

## rgaa-embed-image-role-img

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<embed type="image/svg+xml" src="chart.svg" role="img" aria-label="Ventes 2024">
```
The embedded image has `role="img"` and a text alternative.

**Failed**
```html
<figure><embed type="image/svg+xml" src="chart.svg"><figcaption>Ventes</figcaption></figure>
```
The image has a caption, so it carries information, and it has no text alternative and no link or button to an alternative content after it. A bare `<embed>` image that may be decorative is asked about instead: if it is decorative, it fails 1.2.6.

**Flagged (cantTell)**
```html
<embed type="image/svg+xml" src="chart.svg" title="Ventes 2024">
```
A text alternative without `role="img"`: the test wording asks for both, the methodology for the alternative only.

## rgaa-embedded-player-review

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<iframe src="https://www.youtube-nocookie.com/embed/abc" title="Présentation de la médiathèque"></iframe>
```
A person checks the video's transcript, captions, audio description and controls (RGAA theme 4).

**Not applicable**
```html
<iframe src="https://www.openstreetmap.org/export/embed.html" title="Plan d'accès"></iframe>
```
A map is not a media player.

## rgaa-embedded-refresh-review

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<object data="scores.html" type="text/html"></object>
```
The embedded page may reload itself. RGAA 13.1.1 lists `<object>`, `<embed>`, `<svg>` and `<canvas>` as refresh methods, and a person checks whether a refresh happens and whether the user can stop it, lengthen it or be warned of it.

**Not applicable**
```html
<svg viewBox="0 0 10 10" aria-hidden="true"><circle cx="5" cy="5" r="4"/></svg>
```
An `<svg>` with no `<script>` cannot reload anything, and an `<object>` or `<embed>` that shows a still image is left out too.

## rgaa-fake-list

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<p>• Apples<br>• Pears<br>• Plums</p>
```
Three lines start with the same bullet, but screen readers get no list.

**Not applicable**
```html
<ul>
  <li>Apples</li>
  <li>Pears</li>
</ul>
```
A real list; nothing is laid out as one with text alone.

## rgaa-field-group-legend

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<fieldset>
  <label>Street <input name="street"></label>
  <label>City <input name="city"></label>
</fieldset>
```
The address fields are grouped, but the group has no `<legend>` saying what it is.

**Passed**
```html
<fieldset>
  <legend>Address</legend>
  <label>Street <input name="street"></label>
</fieldset>
```
The group has a legend.

## rgaa-field-hidden-label-review

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<label for="q" class="sr-only">Rechercher</label><input id="q"><button>OK</button>
```
The label is visually hidden: a person checks that a title, or visible text next to the field, makes the expected input understandable (RGAA 11.1.3).

**Not applicable**
```html
<label for="q">Rechercher</label><input id="q">
```
The label is visible.

## rgaa-field-label-consistency-review

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<label for="a">Adresse électronique</label><input id="a" type="email" autocomplete="email">
<label for="b">Courriel</label><input id="b" type="email" autocomplete="email">
```
A person checks that both labels clearly ask for the same email address (RGAA 11.3.1).

**Not applicable**
```html
<label for="a">Téléphone :</label><input id="a" type="tel" autocomplete="tel">
<label for="b">Téléphone *</label><input id="b" type="tel" autocomplete="tel">
```
The labels are the same once punctuation is ignored.

## rgaa-field-label-in-name-sources

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<label for="mail">E-mail</label>
<input type="email" id="mail" title="E-mail (exemple : nom@domaine.fr)">
```
The `<label>` gives the accessible name, and it is the visible label. A `title` that did not repeat "E-mail" would not be judged either: RGAA 11.2.5 judges the étiquette, the source that gives the name.

**Failed**
```html
<label for="mail">E-mail</label>
<input type="email" id="mail" aria-label="Adresse électronique">
```
The `aria-label` gives the accessible name, and it does not contain the visible label "E-mail" (RGAA 11.2.5). The words count as shown: an `aria-label` that writes out an abbreviation, gives a word another ending ("Rechercher" for a visible "Recherche") or leaves out text in parentheses fails too. A source that does not give the name, such as a `title` holding a format hint beside the `<label>`, is not judged.

## rgaa-field-label-listed-source

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<label for="name">Nom</label>
<input type="text" id="name">
```
A `<label>` with a `for` attribute that matches the field's `id`, one of the four sources RGAA 11.1.1 lists (with `aria-labelledby`, `aria-label` and `title`).

**Failed**
```html
<input type="text" placeholder="Nom">
```
A placeholder is not one of the sources 11.1.1 lists, so the field has no label under RGAA, although browsers use the placeholder as its accessible name. A field named only by a `<label>` that wraps it, without `for`, fails too, since 11.1.1 names « une balise `<label>` ayant un attribut `for` »; it is asked about (cantTell) when a button sits next to it, as the fifth condition (an adjacent button with a visually hidden `<label>`) may apply.

**Failed**
```html
<input type="text" title="" placeholder="Mot-clé">
```
The `title` is there but empty. RGAA's glossary makes an étiquette a « texte », so an empty source gives the field no label, and it fails 11.1.1 like a field with no source.

## rgaa-figure-caption-structure

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<figure role="figure" aria-label="Sales in 2025">
  <img src="chart.png" alt="Bar chart of sales">
  <figcaption>Sales in 2025</figcaption>
</figure>
```
The figure has `role="figure"` and an `aria-label` repeating its caption.

**Failed**
```html
<figure>
  <img src="chart.png" alt="Bar chart of sales">
  <figcaption>Sales in 2025</figcaption>
</figure>
```
The figure has neither a role nor an `aria-label`.

## rgaa-focus-indicator-contrast

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<style>body { background: #fff } a:focus { outline: 2px solid #000 }</style>
<a href="/hours">Opening hours</a>
```
The outline that replaces the browser's own is black on white, 21:1.

**Failed**
```html
<style>body { background: #fff } a:focus { outline: none; box-shadow: 0 0 0 2px #eee }</style>
<a href="/hours">Opening hours</a>
```
The box-shadow is visible, which is all WCAG 2.4.7 asks, but #eee on white is 1.16:1, below the 3:1 RGAA 10.7.1 requires. A focus style the engine cannot measure (a background image, a CSS variable, a background or text-color change) is asked about instead.

## rgaa-form-button-label-in-name-sources

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<form action="/search">
  <input type="search" aria-label="Rechercher">
  <button aria-label="Rechercher sur le site">Rechercher</button>
</form>
```
The accessible name starts with the button's visible text.

**Failed**
```html
<form action="/send">
  <button aria-label="Fermer la fenêtre">Valider</button>
</form>
```
The accessible name does not contain the visible label "Valider" (RGAA 11.9.2). The same button outside any form is not applicable. A `title` that does not contain the visible label, on a button named by its text, is not judged: the test's conditions list every source, but its methodology checks only the accessible name.

## rgaa-form-button-name-present

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<form action="/search">
  <input type="search" aria-label="Rechercher">
  <button>Rechercher</button>
</form>
```
The button inside the form has a label, its content.

**Failed**
```html
<form action="/search">
  <input type="search" aria-label="Rechercher">
  <button><img src="loupe.svg" alt=""></button>
</form>
```
The button inside the form has no label, so RGAA 11.9.1 has nothing to judge. The same empty button outside any form is not applicable: 11.9.1 covers only the buttons in a `<form>` or `role="form"` element.

## rgaa-format-hint-review

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<label for="client">Numéro de client</label>
<input id="client" pattern="[A-Z]{2}[0-9]{6}">
```
A person checks that an input error says the expected format and gives an example (RGAA 11.11.1, 11.11.2).

**Not applicable**
```html
<label for="cp">Code postal (ex. : 75001)</label>
<input id="cp" pattern="[0-9]{5}">
```
The label gives an example.

## rgaa-frame-title-attribute-present

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<iframe src="map.html" title="Map of the city centre"></iframe>
```
The frame has a `title` attribute (RGAA 2.1.1).

**Failed**
```html
<iframe src="map.html" aria-label="Map of the city centre"></iframe>
```
The frame has an accessible name, which WCAG 4.1.2 accepts, but no `title` attribute, which RGAA 2.1.1 asks for. Only `aria-hidden="true"` takes a frame out of scope; `tabindex="-1"` does not.

**Failed**
```html
<iframe src="map.html" title="" aria-label="Map"></iframe>
```
The title is empty, so the frame has no « titre de cadre », the content of its `title` attribute (RGAA criterion 2.1 and its glossary). The `aria-label` does not replace it.

## rgaa-frame-title-relevant

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<iframe src="map.html" title="iframe"></iframe>
```
The frame has a title, so a person checks that it says what the frame contains (RGAA 2.2.1). "iframe" names nothing.

**Not applicable**
```html
<iframe src="map.html" title=""></iframe>
```
An empty title gives the frame no « titre de cadre »: it fails 2.1.1, and 2.2 does not apply to it.

## rgaa-heading-content-present

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<h2><img src="news.png" alt="News"></h2>
```
The heading's content is an image with a text alternative.

**Failed**
```html
<h2></h2>
```
The heading has no content at all, so RGAA 9.1.2 has nothing to judge. `<h2 title="News"></h2>` is asked about (cantTell) instead: its name comes from an attribute, not from its content.

## rgaa-heading-role-level-present

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<div role="heading" aria-level="2">News</div>
```
`role="heading"` comes with an `aria-level`, as RGAA's definition of a heading requires.

**Failed**
```html
<div role="heading">News</div>
```
No `aria-level`. WAI-ARIA gives the heading level 2 by default, which WCAG accepts, but RGAA 9.1.3 does not.

## rgaa-headings-absent-review

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<body><p>Les horaires de la mairie changent pendant les vacances scolaires… (30 words or more)</p></body>
```
The page has text but no heading at all: a person checks whether some passages act as headings (RGAA 9.1.3).

**Not applicable**
```html
<body><h1>Mairie</h1><p>Les horaires…</p></body>
```
The page has a heading.

## rgaa-html-elements-attributes-valid

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<table>
  <tr><th id="price" scope="col">Price</th></tr>
  <tr><td headers="price">10 €</td></tr>
</table>
<input type="email" autocomplete="shipping email" aria-label="Email">
```
`scope`, `headers` and `autocomplete` all hold values the W3C validator accepts.

**Failed**
```html
<div hidden><center>Welcome</center></div>
<p dir=" rtl " lang="ar">مرحبا</p>
<input disabled autocomplete="nom" aria-label="Name">
```
`<center>` is obsolete (hidden content counts for RGAA 8.2.1), `dir` has spaces around its value, and `nom` is not an autofill field name, disabled field or not. A page whose doctype is neither HTML5 nor missing is asked about instead.

## rgaa-html-lang-code-valid

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<html lang="fra">
  <head><title>Rapport annuel</title></head>
  <body><p>Bonjour</p></body>
</html>
```
`fra` is an ISO 639-2 code, which RGAA 8.4.1 accepts, although the IANA registry lists only `fr`.

**Failed**
```html
<html lang="english">
  <head><title>Annual report</title></head>
  <body><p>Hello</p></body>
</html>
```
`english` is not an ISO 639 language code.

## rgaa-html-nesting-valid

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<dl>
  <div><dt>Apple</dt><dd>Fruit</dd></div>
  <div><dt>Leek</dt><dd>Vegetable</dd></div>
</dl>
<div role="button" tabindex="0"><a href="/help">Help</a></div>
```
Each `<div>` holds one `<dt>`/`<dd>` group. A link inside `role="button"` is only a validator warning, so RGAA 8.2.1 does not fail it.

**Failed**
```html
<ul><li>Apples</li><div role="listitem">Pears</div></ul>
<a href="/basket">Basket <button disabled>Empty</button></a>
```
A `<ul>` may only hold `<li>`, `<script>` and `<template>`, whatever role the child has, and a link may not contain a button, even a disabled one.

## rgaa-image-alt-long

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<img src="chart.png" alt="Bar chart showing the sales of each of our twelve regional shops month by month for 2025">
```
The text alternative runs to 88 characters; a person decides whether it should be shorter. The same question is asked of `aria-label`, `aria-labelledby`, `title` and an svg's `<title>`, on any kind of image.

**Passed**
```html
<img src="chart.png" alt="Sales by shop in 2025">
```
A short text alternative.

## rgaa-img-alt-present

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<img src="logo.png" alt="Example">
```
The image has a text alternative (RGAA 1.1.1).

**Failed**
```html
<figure><img src="rapport.png" width="120" height="40"><figcaption>Rapport annuel</figcaption></figure>
```
The image has a caption, so it carries information, and it has no `alt` attribute and no other text alternative. An image that is the only content of a link or a button is judged as the control's label, under Links (6.1), Forms (11.9) or Scripts (7.1), as the glossary « Image porteuse d'information » (notes 1 and 2) says. An image that may be decorative, such as a bullet before a list item, is asked about instead: it then fails 1.2.1. A spacer (2 px or less) is left out: it is decorative, and fails 1.2.1 alone.

## rgaa-img-decorative-no-alternative

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<img src="filet.png" alt="">
```
The decorative image has no `aria-labelledby`, `aria-label` or `title`.

**Failed**
```html
<img src="filet.png" alt="" aria-hidden="true" aria-label="Décor">
```
The image is hidden from assistive technologies but has an `aria-label`.

**Flagged (cantTell)**
```html
<img src="logo.png" alt="" title="Logo">
```
The image may carry information, and then its `title` is its alternative; a person decides.

## rgaa-img-describedby-target

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Failed**
```html
<img src="ventes.png" alt="Ventes 2024" aria-describedby="desc-ventes">
```
No element has the id `desc-ventes`: aria-describedby associates no description (RGAA 1.6.9).

**Passed**
```html
<img src="ventes.png" alt="Ventes 2024" aria-describedby="d"><p id="d">Les ventes montent de 5 % par trimestre.</p>
```
aria-describedby points to a passage with text; whether it is the detailed description is for a person.

## rgaa-img-no-alt-decorative

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Not applicable**
```html
<img src="pixel.gif" alt="" width="1" height="1">
```
The spacer has an empty `alt`, as RGAA 1.2.1 asks of a decorative image; rgaa-img-decorative-no-alternative checks the rest of 1.2.1 for it.

**Failed**
```html
<img src="pixel.gif" width="1" height="1">
```
A 1 by 1 px image carries no information, so it is decorative, and it has no `alt` attribute (RGAA 1.2.1).

## rgaa-keyboard-only-event-handlers

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<div tabindex="0" onkeydown="openMenu(event)">Menu</div>
```
The element reacts to the keyboard, but the markup shows no click or pointer handler. RGAA 7.3.1 also asks that the action works with a mouse, touch or stylus, here or on an equivalent element. WCAG 2.1.1 has nothing to ask here.

**Not applicable**
```html
<button type="button" onkeydown="openMenu(event)">Menu</button>
```
A button is activable with a pointer on its own, so the key handler needs no pointer twin.

## rgaa-label-for-target-valid

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<label for="email">Email</label>
<input id="email" type="email">
```
The `for` value is the id of the field.

**Failed**
```html
<label for="e-mail">Email</label>
<input id="email" type="email">
```
No element has the id `e-mail`, so the label labels nothing.

## rgaa-label-placement-review

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<input id="nom" type="text"> <label for="nom">Nom</label>
```
In a browser: the label is on the right of a text field, not above it or on its left (RGAA 11.4.2).

**Flagged (cantTell)**
```html
<label for="cgu">J’accepte les conditions</label> <input id="cgu" type="checkbox">
```
In a browser: the label is on the left of a check box, not below it or on its right (RGAA 11.4.3).

**Not applicable**
```html
<label for="mail" style="display:block">Courriel</label><input id="mail" type="email">
```
The label sits just above its field. Without a layout (jsdom) the rule is not applicable.

## rgaa-language-change-review

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<html lang="fr"> … <p>This website uses cookies to improve your experience and measure the audience.</p>
```
The paragraph is clearly English by its frequent words, with no lang: a person checks it and adds lang="en" (RGAA 8.7.1).

**Not applicable**
```html
<html lang="fr"> … <p lang="en">This website uses cookies to improve your experience and measure the audience.</p>
```
The change of language is given.

**Not applicable**
```html
<html lang="fr"> … <p>Abonnez-vous à notre newsletter pour suivre les actualités de la start-up.</p>
```
Foreign words in French text, not a passage in another language.

## rgaa-layout-table-no-data-markup

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<table role="presentation">
  <tr><td>Menu</td><td>Content</td></tr>
</table>
```
The layout table has only plain cells.

**Failed**
```html
<table role="presentation">
  <tr><th>Menu</th><td>Content</td></tr>
</table>
```
The layout table has a header cell.

## rgaa-legend-relevance-review

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<fieldset><legend>Adresse de livraison</legend>
<label for="rue">Rue</label><input id="rue">
<label for="ville">Ville</label><input id="ville">
</fieldset>
```
A person checks that « Adresse de livraison » says what the fields have in common (RGAA 11.7.1).

**Not applicable**
```html
<div role="group" aria-label="Mise en forme"><button>Gras</button><button>Italique</button></div>
```
The group holds no form field.

## rgaa-letters-spaced-with-spaces

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<h2>S O L D E S</h2>
```
A screen reader reads six separate letters instead of a word.

**Not applicable**
```html
<h2 style="letter-spacing: 0.5em">SOLDES</h2>
```
The same look, made with CSS, keeps the word whole.

## rgaa-link-content-label-present

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<a href="/"><img src="logo.png" alt="Home"></a>
```
The link content is an image with a text alternative.

**Failed**
```html
<a href="/" aria-label="Home">
  <svg aria-hidden="true" width="16" height="16"><path d="M0 8 8 0 16 8"/></svg>
</a>
```
The link has an accessible name, from `aria-label`, but nothing between `<a>` and `</a>` gives it a label, which RGAA 6.2.1 requires.

**Failed (in a browser)**
```html
<style>.home::before { content: "Home"; }</style>
<a href="/" class="home"></a>
```
The link shows "Home", but only through CSS: text generated by `::before` or `::after` is not content between `<a>` and `</a>` (glossary « Intitulé de lien », note 5), so the link has no label for RGAA 6.2.1.

## rgaa-link-context-review

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<div>
  <a href="/rapport" aria-describedby="d">En savoir plus</a>
  <span id="d">sur le rapport annuel 2025</span>
</div>
```
The link text is generic, and its only context is the aria-describedby text, which WCAG accepts (technique ARIA1) but RGAA's glossary entry "Contexte du lien" does not list. A person checks whether the sentence, paragraph, list item, table cell or preceding heading makes it explicit.

**Not applicable**
```html
<p>Rapport annuel 2025 : <a href="/rapport">en savoir plus</a></p>
```
The paragraph is one of the contexts RGAA lists. A generic link with no context at all is `link-name-quality`'s question.

## rgaa-link-label-in-name-sources

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<a href="/contact" title="Contact - nouvelle fenêtre">Contact</a>
```
The title contains the link text. Punctuation and capital letters do not count (`title="CONTACT !"` passes too).

**Failed**
```html
<a href="/contact" title="Ouvre une nouvelle fenêtre">Contact</a>
```
RGAA 6.1.5 checks that the title, the aria-label and the aria-labelledby text each contain the visible label, and this title does not. The link's accessible name is its text, so `label-in-name` (WCAG 2.5.3) has nothing to report.

## rgaa-link-state-colors-review

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Fails (in a browser)**
```html
<style>
  p { color: #000; }
  p a { color: #b00000; text-decoration: none; }
  a:visited { color: #555; }
</style>
<p>Lire <a href="/article">la suite</a> de l'article.</p>
```
The link is shown only by its color, and its visited state has another color, #555, at 2.82:1 against the surrounding text. RGAA 10.6.1 step 3 asks for 3:1 in each state shown by another color. In a browser the rule puts the link in that state and measures it; in jsdom it can only ask.

**Flagged (cantTell)**
```html
<style>
  p a { text-decoration: none; }
</style>
<p>Lire <a href="/article">la suite</a> de l'article.</p>
```
No style rule sets the link's color, so the browser's own visited color applies, and browsers differ on it.

**Passes (in a browser)**
```html
<style>
  p { color: #000; }
  p a { color: #f60; text-decoration: none; }
  a:hover, a:focus { color: #09f; }
</style>
<p>Lire <a href="/article">la suite</a> de l'article.</p>
```
The hover and focus colors both contrast more than 3:1 with the surrounding text.

**Not applicable**
```html
<style>
  p a { color: #b00000; text-decoration: underline; }
  a:hover { color: #700000; }
</style>
<p>Lire <a href="/article">la suite</a> de l'article.</p>
```
The underline marks the link without color, so 10.6.1 does not apply to it.

## rgaa-link-title-content-name

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Fails**
```html
<a href="/" title="Accueil"><img src="home.png" alt="Retour à la page d'accueil"></a>
```
The title does not repeat the image's alternative: a screen reader set to read titles says only « Accueil » (glossary « Intitulé de lien », note 2).

**Fails**
```html
<a href="/rapport.pdf" title="Rapport annuel">Rapport annuel <img src="pdf.png" alt="PDF"></a>
```
The title keeps the text but drops the icon's alternative, so it does not repeat the name the content gives the composite link (RGAA 6.1.3). `title="PDF : rapport annuel"` passes: the text and each alternative may come in any order. A one-character alternative the title leaves out is asked about, since it may be a symbol.

**Passes**
```html
<a href="/" title="Retour à la page d'accueil du site"><img src="home.png" alt="Retour à la page d'accueil"></a>
```
The title contains the image's alternative.

## rgaa-listbox-option-groups-absent

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<div role="listbox" aria-label="Colour" tabindex="0">
  <div role="option" aria-selected="true">Red</div>
  <div role="option" aria-selected="false">Blue</div>
</div>
```
The listbox holds options only.

**Failed**
```html
<div role="listbox" aria-label="City" tabindex="0">
  <div role="group" aria-label="France">
    <div role="option" aria-selected="false">Paris</div>
  </div>
</div>
```
The options are grouped with `role="group"`. WAI-ARIA allows it, but RGAA 11.8's technical note says a list that needs grouping and is built with `role="listbox"` does not conform: use `<select>` and `<optgroup>`.

## rgaa-main-element-structure

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<!doctype html>
<html lang="en">
  <head><title>Opening hours</title></head>
  <body>
    <main><h1>Opening hours</h1></main>
    <main hidden><h1>Holiday hours</h1></main>
  </body>
</html>
```
One `<main>` is visible; the other carries the `hidden` attribute (RGAA 9.2.1 step 5).

**Failed**
```html
<!doctype html>
<html lang="en">
  <head><title>Opening hours</title></head>
  <body>
    <main><h1>Opening hours</h1></main>
    <main style="display:none"><h1>Holiday hours</h1></main>
  </body>
</html>
```
The second `<main>` is hidden by CSS only; RGAA wants the `hidden` attribute. `role="main"` with no `<main>` element fails too, as do `role="banner"`, `"navigation"` or `"contentinfo"` on another element than `<header>`, `<nav>` or `<footer>`, and a page with text and no `<main>`. A page with no text of its own (only a frame or a canvas) is asked about, and a page without the HTML5 doctype is not applicable.

## rgaa-markup-for-presentation

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Failed**
```html
<h2 role="presentation">Nos services</h2>
```
RGAA's 8.9.1 methodology accepts `role="presentation"` on an empty paragraph or a `<blockquote>`, but calls it « non-conforme sur un titre ».

**Failed**
```html
<p>Texte</p><p>&nbsp;</p><p>Suite</p>
```
The paragraph holds only a non-breaking space: it is used to make space, one of the misuses the methodology names (RGAA 8.9.1).

**Flagged (cantTell)**
```html
<p>Première ligne<br><br>Deuxième ligne</p>
```
Two line breaks in a row may separate paragraphs, or lines of a poem: a person checks.

**Not applicable**
```html
<blockquote><p>Une citation</p></blockquote>
```
The `<blockquote>` holds a quotation.

## rgaa-markup-validation-review

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id. It has no `notApplicable` branch: RGAA 8.2 applies to every page.*

**Failed (with the `validator.report` probe)**
```html
<p class="intro" class="lead">Opening hours</p>
<!-- probe: { source: "generated", messages: [{ type: "error", lastLine: 1, message: "Duplicate attribute “class”." }] } -->
```
The W3C validator's report on the generated source lists an error, and each error it lists is a finding (RGAA 8.2.1). A report with no error, CSS messages and warnings aside, passes.

**Flagged (cantTell)**
```html
<p class="intro" class="lead">Opening hours: <span>Monday</p><p><b><i>9:00 to 17:00</b></i></p>
```
Without a report the page is asked about. Here the source repeats an attribute, leaves a `<span>` unclosed and misnests `<b>` and `<i>`: the browser repairs all three before the engine sees the page, so only the W3C validator can report them.

## rgaa-media-transcript-adjacent

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<audio controls src="podcast-12.mp3"></audio>
<a href="/podcast/12/transcript">Transcript of episode 12</a>
```
The link to the transcript comes right after the audio, which is what RGAA 4.1 asks for (glossary "Lien ou bouton adjacent").

**Flagged (cantTell)**
```html
<video controls src="talk.mp4" aria-describedby="tr"></video>
<p>Recorded in March.</p>
<footer><div id="tr">Transcript: Hello and welcome…</div></footer>
```
`aria-describedby` ties a transcript to the video, which WCAG 1.2.1 accepts, but the transcript is not right before or after the video, so a person checks RGAA 4.1. The rule never fails: the media may not need a transcript, and a video may have audio description instead.

## rgaa-meta-redirect-immediate

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<meta http-equiv="refresh" content="0; url=/new-address">
```
The redirect is immediate (RGAA 13.1.2).

**Flagged (cantTell)**
```html
<meta http-equiv="refresh" content="5; url=/new-address">
```
The redirect waits 5 seconds. That fails 13.1.2 unless it leaves an obsolete address for the new version of the page, which makes 13.1 not applicable; only a person can tell. The rule never fails.

## rgaa-meta-refresh-no-url-timing

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<meta http-equiv="refresh" content="72000">
```
The page reloads every 20 hours, the limit RGAA 13.1.1 accepts. WCAG 2.2.1 exempts only limits longer than 20 hours.

**Failed**
```html
<meta http-equiv="refresh" content="30">
```
The page reloads itself every 30 seconds. A redirect to another address is `rgaa-meta-redirect-immediate`'s matter.

## rgaa-navigation-systems-review

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<nav aria-label="Menu principal"><a href="/actualites">Actualités</a> <a href="/demarches">Démarches</a> <a href="/contact">Contact</a></nav>
```
The page shows a menu but no site map link or search engine: a person checks that its set of pages offers a second navigation system.

**Not applicable**
```html
<nav aria-label="Menu principal"><a href="/actualites">Actualités</a> <a href="/demarches">Démarches</a> <a href="/contact">Contact</a></nav>
<form role="search" action="/recherche"><label for="q">Rechercher</label> <input type="search" id="q" name="q"></form>
```
The page shows a menu and a search engine; one page cannot pass 12.1 for its set of pages, so nothing is asked.

## rgaa-noscript-alternative-review

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<noscript><p>Activez JavaScript pour voir la carte.</p></noscript>
```
A person checks that the alternative gives content and features similar to the script's; this message gives neither (RGAA 7.2.1).

**Not applicable**
```html
<noscript><img src="pixel.gif" width="1" height="1" alt=""></noscript>
```
A tracking image is no alternative.

## rgaa-object-embed-decorative-aria-hidden

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Failed**
```html
<object type="image/png" data="swirl.png" aria-hidden="true" title="Décor"></object>
```
The image is marked decorative with `aria-hidden="true"`, but still carries a `title`, which RGAA 1.2.3 forbids on a decorative image.

**Passed**
```html
<embed type="image/png" src="swirl.png" aria-hidden="true">
```
The decorative image is hidden and has no alternative (RGAA 1.2.6).

## rgaa-object-image-role-img

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<object type="image/png" data="chart.png" role="img" aria-label="Ventes 2024"></object>
```
The image object has `role="img"` and a text alternative.

**Failed**
```html
<figure><object type="image/png" data="chart.png"></object><figcaption>Ventes</figcaption></figure>
```
The image has a caption, so it carries information, and it has no text alternative, no fallback content, and no link or button to an alternative content after it. A bare `<object>` image that may be decorative is asked about instead: if it is decorative, it fails 1.2.3.

**Flagged (cantTell)**
```html
<object type="image/png" data="chart.png">Ventes 2024 : 10 000</object>
```
The content inside `<object>` is not a text alternative under RGAA 1.1.6; a person checks how the image is made accessible.

## rgaa-modal-tab-order

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<header><a href="/">Accueil</a></header>
<div role="dialog" aria-modal="true" aria-label="Connexion"><button>Fermer</button></div>
```
The dialog is marked modal, but the link behind it can still take focus with the Tab key: a person checks that a script keeps focus inside (RGAA 12.8.1).

**Not applicable**
```html
<div role="dialog" aria-label="Aide"><button>Fermer</button></div>
```
The dialog is not modal, so the page behind it stays in the tab order on purpose.

## rgaa-moving-content-review

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<video autoplay muted loop src="fond.mp4"></video>
```
The video plays by itself and has no controls: a person checks that the user can stop it, hide it, or do without it (RGAA 13.8.1).

**Not applicable**
```html
<video controls src="film.mp4"></video>
```
The video does not start by itself, and its controls can pause it.

## rgaa-office-document-link

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<a href="/files/annual-report.pdf">Annual report</a>
```
The link downloads a PDF; a person checks the document or its accessible version.

**Flagged (cantTell)**
```html
<a href="/get?file=rapport.pdf">Rapport annuel</a>
```
The query string names a PDF, so the link downloads one even though its path has no extension.

**Flagged (cantTell)**
```html
<a href="/media/1234/download">Rapport annuel (PDF, 2 Mo)</a>
```
The address names no format, but the link's text announces a PDF download, in brackets with its size. A format named in passing ("Comment ouvrir un PDF") is not taken for a download.

**Not applicable**
```html
<a href="/annual-report.html">Annual report</a>
```
The link goes to a web page, not an office document.

## rgaa-optgroup-label-not-empty

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<select aria-label="Destination">
  <optgroup label="Europe"><option>Paris</option></optgroup>
</select>
```
The label is not empty. Whether it is relevant is for a person.

**Failed**
```html
<select aria-label="Destination">
  <optgroup label=""><option>Paris</option></optgroup>
</select>
```
The label is empty, so it cannot be relevant (RGAA 11.8.3). rgaa-optgroup-label-present passes it: 11.8.2 asks only whether the attribute exists.

## rgaa-optgroup-label-present

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<select aria-label="City">
  <optgroup label="France"><option>Paris</option></optgroup>
</select>
```
The option group has a `label`.

**Failed**
```html
<select aria-label="City">
  <optgroup><option>Paris</option></optgroup>
</select>
```
The option group has no `label` attribute.

## rgaa-orientation-content-parity

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Fails (in a browser)**
```html
<style>@media (orientation: portrait) { .prices { display: none } }</style>
<table class="prices">
  <tr><th>Adult ticket</th><td>12 €</td></tr>
  <tr><th>Child ticket</th><td>6 €</td></tr>
</table>
```
The price table disappears in portrait and its text is shown nowhere else there. The page still works in both orientations, so WCAG 1.3.4 passes, but RGAA 13.9.1 asks that the content stays the same. When the presentation may just differ (a menu behind a button, the table shown as cards, another wording) the rule asks instead, since 13.9.1 lets « sa présentation et le moyen d’y accéder » differ. In jsdom, which cannot lay the page out, the rule asks about the table.

**Passes (in a browser)**
```html
<style>
  @media (orientation: portrait) { .wide { display: none } }
  @media (orientation: landscape) { .narrow { display: none } }
</style>
<nav class="wide"><a href="/">Home</a> <a href="/contact">Contact</a></nav>
<nav class="narrow"><a href="/">Home</a> <a href="/contact">Contact</a></nav>
```
Each orientation shows its own version of the same links, so the content stays the same.

**Not applicable**
```html
<style>@media (orientation: portrait) { .prices { width: 100% } }</style>
<table class="prices"><tr><th>Adult</th><td>12 €</td></tr></table>
```
The orientation query only changes the layout; it hides nothing.

## rgaa-page-language-present

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<html>
  <head><title>Annual report</title></head>
  <body lang="en"><p>Hello</p></body>
</html>
```
The language is on `<body>`, a parent of every text, which RGAA 8.3.1 accepts. WCAG 3.1.1 (`html-lang-attr-present`) fails this page.

**Failed**
```html
<html>
  <head><title>Annual report</title></head>
  <body><p lang="en">Hello</p><p>World</p></body>
</html>
```
"World" has no language: neither `<html>` nor any of its parents has `lang` or `xml:lang`.

## rgaa-page-title-unique

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed (with the `crawl.pageTitles` probe)**
```html
<title>Horaires – Médiathèque de Lyon</title>
<!-- probe: { pages: [{ url: "/contact", title: "Contact – Médiathèque de Lyon" }] } -->
```
No other page of the site has this title.

**Failed (with the `crawl.pageTitles` probe)**
```html
<title>Médiathèque de Lyon</title>
<!-- probe: { pages: [{ url: "/contact", title: "Médiathèque de Lyon" }] } -->
```
The contact page has the same title, so the title does not identify the page « de manière claire, concise et unique », as RGAA 8.6.1's glossary asks. WCAG 2.4.2 does not ask for unique titles. Without the probe, the rule asks.

## rgaa-page-zones-reachable

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<header><a href="/">Médiathèque</a></header>
<nav><a href="/agenda">Agenda</a></nav>
<main><h1>Actualités</h1></main>
<footer>Mentions légales</footer>
```
Each area has the landmark that matches it.

**Flagged (cantTell)**
```html
<div class="header"><a href="/">Médiathèque</a></div>
<main><h1>Actualités</h1></main>
```
The block named `header` has no landmark, heading, button or link to reach or skip it. Whether it is the page's header area is a person's call, so RGAA 12.6.1 is asked about rather than failed. WCAG 2.4.1 is met here by the `<main>` landmark alone.

## rgaa-presentational-attributes-absent

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<table class="prices"><tr><td>12 €</td></tr></table>
```
The presentation is left to CSS.

**Failed**
```html
<table border="1" cellpadding="4"><tr><td>12 €</td></tr></table>
```
`border` and `cellpadding` are on RGAA 10.1.2's list of presentational attributes.

## rgaa-presentational-elements-absent

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<p class="centred">Welcome</p>
```
The centring is left to CSS.

**Failed**
```html
<center>Welcome</center>
```
`<center>` is on RGAA 10.1.1's list of presentational elements.

## rgaa-quotation-review

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<p>« La culture ne s’hérite pas, elle se conquiert, et chaque génération doit la reconquérir. »</p>
```
A person checks whether the paragraph is a quotation, to be marked up with <blockquote> (RGAA 9.4.2).

**Flagged (cantTell)**
```html
<p>Le maire a rappelé que « la médiathèque restera ouverte tout l’été, y compris le samedi matin » lors du conseil.</p>
```
A person checks whether the passage is a quotation, to be marked up with <q> (RGAA 9.4.1).

**Not applicable**
```html
<p>Exposition « Les couleurs du port » jusqu’au 30 juin.</p>
```
A title of a few words in quotation marks is not asked about.

**Not applicable**
```html
<blockquote><p>« La culture ne s’hérite pas, elle se conquiert. »</p></blockquote>
```
The quotation is already marked up.

## rgaa-radio-group-present

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<p>Delivery</p>
<label><input type="radio" name="delivery"> Standard</label>
<label><input type="radio" name="delivery"> Express</label>
```
The two choices are not grouped, so "Delivery" is not announced with them.

**Passed**
```html
<fieldset>
  <legend>Delivery</legend>
  <label><input type="radio" name="delivery"> Standard</label>
  <label><input type="radio" name="delivery"> Express</label>
</fieldset>
```
The choices are in a fieldset with a legend.

## rgaa-required-field-indication

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Failed**
```html
<form><label for="n">Nom</label><input id="n" required><label for="v">Ville</label><input id="v"></form>
```
The field is required, but its visible label shows no required indication (RGAA 11.10.2).

**Failed**
```html
<form><label for="n">Nom *</label><input id="n" required><label for="v">Ville</label><input id="v"><p>* champs obligatoires</p></form>
```
The « * » is explained only after the field that uses it; RGAA's glossary wants the explanation before its first use.

**Flagged (cantTell)**
```html
<form><fieldset><legend>Adresse (obligatoire)</legend><label for="r">Rue</label><input id="r" required></fieldset><label for="v">Ville</label><input id="v"></form>
```
The indication is in the legend, not in the field's label: a person checks that it identifies the field.

**Passed**
```html
<form><p>Les champs marqués d'un * sont obligatoires.</p><label for="n">Nom *</label><input id="n" required><label for="v">Ville</label><input id="v"></form>
```
The sign is in the label and explained before its first use.

**Not applicable**
```html
<form><label for="n">Nom</label><input id="n" required><label for="v">Ville (facultatif)</label><input id="v"></form>
```
The form marks its optional field, which makes 11.10.1 and 11.10.2 not applicable.

## rgaa-role-img-aria-name

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<div role="img" aria-label="Note : 3 sur 5">★★★</div>
```
The text alternative comes from `aria-label`.

**Failed**
```html
<div role="img" title="Note : 3 sur 5">★★★</div>
```
A `title` is not one of the sources RGAA 1.1.1 accepts for `role="img"`.

## rgaa-same-name-checkboxes-review

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<p>Centres d’intérêt</p>
<label><input type="checkbox" name="interets"> Sport</label>
<label><input type="checkbox" name="interets"> Musique</label>
<label><input type="checkbox" name="interets"> Lecture</label>
```
A person decides whether the three checkboxes need a fieldset and legend (RGAA 11.5.1).

**Not applicable**
```html
<fieldset><legend>Langues</legend>
<label><input type="checkbox" name="langues"> Français</label>
<label><input type="checkbox" name="langues"> Anglais</label>
<label><input type="checkbox" name="langues"> Espagnol</label>
</fieldset>
```
The checkboxes are grouped in a fieldset.

## rgaa-script-button-name-present

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Failed**
```html
<button type="button"><svg width="16" height="16"><rect width="16" height="16"/></svg></button>
```
The icon button outside a form has no name, and 7.1.3 asks « Le composant possède un nom pertinent » with no alternative.

**Passed**
```html
<button type="button" aria-label="Fermer"><svg aria-hidden="true" width="16" height="16"><rect width="16" height="16"/></svg></button>
```
The button has a name, whose relevance a person judges.

**Not applicable**
```html
<form><button></button></form>
```
A button in a form is checked under 11.9.1 by rgaa-form-button-name-present.

## rgaa-script-redirect-review

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<script>setTimeout(function () { window.location.href = '/accueil'; }, 5000);</script>
```
The page redirects after five seconds: a person checks that the user can stop, extend or be warned of it (RGAA 13.1.3).

## rgaa-scripted-components-review

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<script src="/js/tabs.js"></script>
<div role="tablist">
  <div role="tab" aria-selected="true">Details</div>
</div>
```
The page has script, so a person checks every scripted component against RGAA 7.1. The two `role` elements are listed as candidates; `tabs.js` may attach behaviour to other elements that the markup does not show.

**Flagged (cantTell)**
```html
<script src="/js/menu.js"></script>
<a href="#">Ouvrir le menu</a>
```
The link leads nowhere, so a script likely makes it act as a button: it is listed for a person to check that its role is relevant (RGAA 7.1.3).

**Not applicable**
```html
<h1>Opening hours</h1>
<p>Monday to Friday, 9:00 to 17:00.</p>
```
The page has no script element, inline handler, `javascript:` URL or custom element, so nothing can create or control a scripted component.

## rgaa-select-fake-groups-review

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<select><option>Choisissez</option><option>-- Fruits --</option><option>Pomme</option><option>-- Légumes --</option><option>Carotte</option></select>
```
The dashed options are group headings that screen readers read as choices: a person checks whether <optgroup> should group the items (RGAA 11.8.1).

**Not applicable**
```html
<select><optgroup label="Fruits"><option>Pomme</option></optgroup></select>
```
The items are grouped with <optgroup>.

## rgaa-skip-link-placement

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed (in a browser, with the `crawl.skipLinks` probe)**
```html
<style>
  .skip { position: absolute; left: -9999px; }
  .skip:focus { left: 8px; top: 8px; }
</style>
<a class="skip" href="#main">Aller au contenu</a>
<nav><a href="/">Accueil</a> <a href="/contact">Contact</a></nav>
<main id="main"><h1>Actualités</h1></main>
```
The link shows when it takes focus, and the other pages in the probe, measured at the same window width, show it at the same place and first in the focus order.

**Failed (in a browser)**
```html
<style>
  .skip { position: absolute; left: -9999px; }
</style>
<a class="skip" href="#main">Aller au contenu</a>
<nav><a href="/">Accueil</a> <a href="/contact">Contact</a></nav>
<main id="main"><h1>Actualités</h1></main>
```
The link stays off the page even when it has focus. RGAA 12.7.2 asks that it be visible, at least on focus. Without the probe the rule also asks whether the link sits at the same place on the other pages, and in jsdom it asks about its visibility too.

## rgaa-skip-link-present

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<a href="#main">Skip to content</a>
<nav><a href="/">Home</a> <a href="/contact">Contact</a></nav>
<main id="main"><h1>News</h1></main>
```
A link before the navigation leads to `<main>`.

**Failed**
```html
<nav><a href="/">Home</a> <a href="/contact">Contact</a></nav>
<main><h1>News</h1></main>
```
Navigation comes before the main content and no link leads to it. WCAG 2.4.1 accepts the main landmark as a way to bypass the navigation; RGAA 12.7.1 needs a link. Without the `<nav>`, the rule asks instead, since a one-page site may not need a skip link.

**Flagged (cantTell)**
```html
<div aria-hidden="true"><a href="#contenu">Aller au contenu</a></div>
<nav><a href="/">Accueil</a></nav>
<main id="contenu"><h1>Actualités</h1></main>
```
The skip link works with the keyboard, but `aria-hidden="true"` hides it from screen reader users: a person decides.

## rgaa-status-message-review

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<p class="alert alert-success">Message envoyé avec succès</p>
```
If this message appears after an action, it needs role="status" (RGAA 7.5.1); a person checks.

**Not applicable**
```html
<div role="status">Message envoyé avec succès</div>
```
The message has role="status".

## rgaa-svg-decorative-aria-hidden

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Not applicable**
```html
<button type="button">
  <svg aria-hidden="true" width="16" height="16"><rect width="16" height="16"/></svg>
  Rechercher
</button>
```
The decorative icon is hidden with `aria-hidden="true"`, as RGAA 1.2.4 asks; rgaa-svg-hidden-no-alternative checks the rest of 1.2.4 for it.

**Failed**
```html
<p>Contact <svg role="presentation" width="16" height="16"><rect width="16" height="16"/></svg></p>
```
The SVG is marked decorative with `role="presentation"`, which RGAA 1.2.4 does not accept: a decorative SVG needs `aria-hidden="true"`. Another exposed SVG that may be decorative is asked about.

## rgaa-svg-hidden-no-alternative

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<svg aria-hidden="true" width="16" height="16">
  <circle cx="8" cy="8" r="6"/>
</svg>
```
The hidden SVG has no text alternative.

**Failed**
```html
<svg aria-hidden="true" width="16" height="16">
  <title>Star</title>
  <circle cx="8" cy="8" r="6"/>
</svg>
```
The SVG is hidden as decorative but has a `<title>`.

## rgaa-svg-role-img

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<svg role="img" aria-label="Logo" width="20" height="20">
  <circle cx="10" cy="10" r="8"/>
</svg>
```
The SVG has `role="img"` and an `aria-label`.

**Failed**
```html
<svg tabindex="0" width="20" height="20">
  <title>Plan</title>
  <circle cx="10" cy="10" r="8"/>
</svg>
```
The SVG takes focus, so it carries information, and it has a text alternative but no `role="img"`. An image that is the only content of a link or a button is judged as the control's label, under Links (6.1), Forms (11.9) or Scripts (7.1), as the glossary « Image porteuse d'information » (notes 1 and 2) says. An SVG that may be decorative, such as an icon beside text, is asked about instead: it then fails 1.2.4.

**Passed**
```html
<svg role="img" width="20" height="20">
  <title>Logo</title>
</svg>
```
Named only by `<title>`, which RGAA 4.1.2 added to the sources 1.1.5 accepts.

## rgaa-table-title-adjacent

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<h3>Population des villes</h3>
<table><tr><th scope="col">Ville</th><th scope="col">Habitants</th></tr><tr><td>Lyon</td><td>520 000</td></tr></table>
```
The heading right before the table may be its title, given as plain text: if it is, a `<caption>` or aria-labelledby ties it (RGAA 5.4.1).

**Not applicable**
```html
<table><caption>Population des villes</caption><tr><th scope="col">Ville</th></tr><tr><td>Lyon</td></tr></table>
```
The title is in a `<caption>`.

## rgaa-text-direction-marked

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Failed**
```html
<p>مرحبا بكم في موقعنا</p>
<p>Le mot شكرا veut dire merci.</p>
```
The Arabic text reads right to left in a page that reads left to right, and no element around it has a `dir` attribute (RGAA 8.10.1). One word fails too: the test has no exception for short text, and Arabic letters write only languages read right to left. So does a `<bdi>` with no `dir`, which RGAA does not accept in its place.

**Flagged (cantTell)**
```html
<p>Le cardinal א désigne un infini.</p>
```
A single Hebrew letter may be a symbol rather than a word: a person checks whether it is text in a language read right to left. So is a Latin brand name of one or two words in an Arabic page.

**Not applicable**
```html
<p dir="rtl" lang="ar">مرحبا بكم في موقعنا</p>
```
The change of direction is marked with `dir="rtl"`.

## rgaa-text-image-review

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<h2><img src="engagements.png" alt="Nos engagements"></h2>
```
The heading is an image: if it shows the text « Nos engagements », styled text should replace it (RGAA 1.8.1).

**Not applicable**
```html
<a href="/"><img class="site-logo" src="logo.png" alt="Mairie de Lyon"></a>
```
A logo is a particular case of 1.8.

## rgaa-th-association-present

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Failed**
```html
<table>
  <tr><td></td><th>2023</th><th>2024</th></tr>
  <tr><th>Paris</th><td>1</td><td>2</td></tr>
</table>
```
The table has headers on both axes, and its `<th>` have no `scope`, `id` or header role (RGAA 5.7.1).

**Passed**
```html
<table><tr><th>Nom</th><th>Âge</th></tr><tr><td>Ana</td><td>31</td></tr></table>
```
All the headers sit in a single row, which criterion 5.7's particular case lets be `<th>` without `scope`.

**Flagged (cantTell)**
```html
<table>
  <tr><th colspan="2">Population</th></tr>
  <tr><th>Paris</th><td>2</td></tr>
</table>
```
With headers on two axes and a span, a header may cover only part of a row or column (5.7.3): the table is asked about once.

## rgaa-th-scope-row-col

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<table>
  <tr><th scope="col">Name</th><th scope="col">Age</th></tr>
  <tr><td>Ada</td><td>36</td></tr>
</table>
```
The column headers use `scope="col"`.

**Failed**
```html
<table>
  <tr><td></td><th scope="colgroup" colspan="2">2025</th></tr>
  <tr><td></td><th scope="col">Q1</th><th scope="col">Q2</th></tr>
  <tr><th scope="row">North</th><td>10</td><td>12</td></tr>
</table>
```
RGAA accepts `scope="col"` or `"row"` on a header over a whole column or row (5.7.2), and no `scope`, with a unique `id`, on one over part of it (5.7.3). `scope="colgroup"` fails one of the two, so criterion 5.7 fails either way. A row header with `scope="col"`, where the table's shape makes it certain, fails too.

## rgaa-title-placeholder-identical

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id. It asks rather than fails: RGAA states the requirement in its glossary but names no test for it.*

**Passed**
```html
<input type="email" title="Adresse e-mail" placeholder="Adresse e-mail">
```
The title and the placeholder are identical.

**Flagged (cantTell)**
```html
<label for="nom">Nom</label>
<input type="text" id="nom" title="Nom de famille" placeholder="Dupont">
```
RGAA's glossary entry "Étiquette de champ de formulaire" says a placeholder may be read in place of the title, so the two must be identical when both are present.

## rgaa-valid-lang

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<p lang="fra">Bonjour</p>
```
`fra` is an ISO 639-2 code, which RGAA 8.8.1 accepts, although the IANA registry lists only `fr`. `valid-lang` fails the same element under WCAG 3.1.2.

**Failed**
```html
<p lang="xx">Bonjour</p>
```
`xx` is not an ISO 639 language code.

## rgaa-tooltip-review

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<button type="button" aria-describedby="tip">Partager</button>
<div role="tooltip" id="tip" hidden>Partager cette page</div>
```
A person checks that the tooltip closes with Escape, can be hovered, and stays until the pointer or focus leaves (RGAA 10.13).

**Not applicable**
```html
<a href="/contact" title="Nous écrire">Contact</a>
```
The browser shows and hides a title, which 10.13's particular case leaves out.

## rgaa-video-captions-track-kind

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<video controls src="talk.mp4">
  <track src="talk.vtt" kind="captions" srclang="en" label="English">
</video>
```
The caption track has `kind="captions"`.

**Failed**
```html
<video controls src="talk.mp4" lang="en">
  <track src="talk.vtt" kind="subtitles" srclang="en" label="English">
</video>
```
The only text track is marked as subtitles although it is in the video's language, as the video's `lang` gives it. A track with a kind HTML does not know, such as `kind="caption"`, fails too: it is never shown. Subtitles whose language can't be told to be the video's (the page's `lang` says nothing of the audio's) are asked about instead (cantTell), since they may be translations.

## rgaa-viewport-zoom-review

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Flagged (cantTell)**
```html
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
```
The tag blocks pinch zoom, which WCAG 1.4.4 fails through `meta-viewport-zoom-enabled`. RGAA 10.4.2 passes if text still reaches 200% with the browser text zoom, the browser graphic zoom or a zoom control of the site, so a person checks those.

**Not applicable**
```html
<meta name="viewport" content="width=device-width, initial-scale=1">
```
The tag sets neither `user-scalable` nor `maximum-scale`, so it does not limit zoom.
## rgaa-widget-label-in-name

*Opt-in: runs only under the `rgaa-4.1.2` profile, the `rgaa` tag or its id.*

**Passed**
```html
<div role="tablist">
  <div role="tab" tabindex="0" aria-selected="true" aria-label="Paramètres avancés">Paramètres</div>
</div>
```
The tab's accessible name contains its visible text.

**Failed**
```html
<div role="tablist">
  <div role="tab" tabindex="0" aria-selected="true" aria-label="Réglages">Paramètres</div>
</div>
```
The accessible name of this scripted component does not contain its visible label (RGAA 7.1.3). A single visible character, such as "B" in an editor's menu named "Mettre en gras", is asked about (cantTell): RGAA lets the name express what a symbol means.

**Failed**
```html
<button type="button" aria-label="Fermer">Valider</button>
```
A button outside a form does nothing unless a script drives it, so 7.1.3 covers it: its accessible name does not contain its visible label. A button inside a form is checked under 11.9.2 instead.
