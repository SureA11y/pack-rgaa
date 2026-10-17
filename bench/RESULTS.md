# Results

Scanned 2026-10-17, in Chromium. How the engines run and how pages are scored: [README.md](./README.md).

| Engine | Version | Reports | Criteria it judged |
| --- | --- | --- | ---: |
| @surea11y/pack-rgaa | 0.1.0 | fail, cantTell, pass, inapplicable | 51 of 106 |
| @uuv/a11y (RgaaChecker) | 1.0.0-beta.113 | fail, cantTell, pass | 27 of 106 |
| @a11ylint/core | 1.0.0-alpha.7 | fail | 9 of 106 |
| RGAA Checker (ARNEO) | git 09bb7d6 | fail, cantTell, pass, inapplicable | 50 of 106 |
| RGAA Audit (Le Singe Du Numérique) | git fb0422d | fail, cantTell, pass | 24 of 106 |

"Criteria it judged" counts the RGAA criteria an engine gave a verdict or a finding for on any page scanned. What the main divergences come from: [TRIAGE.md](./TRIAGE.md).

## Against human audits

11 French sites whose accessibility statement lists the criteria a human RGAA audit found non-conforming. An engine finds a criterion when it fails it on at least one of the site's sample pages.

| Engine | Found (of the audits' failures) | Failed beyond the audit | Precision | Recall | Missed, in its scope | Missed, out of its scope |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| @surea11y/pack-rgaa | 71 of 282 | 39 | 65% | 25% | 120 | 91 |
| @uuv/a11y (RgaaChecker) | 28 of 282 | 18 | 61% | 10% | 42 | 212 |
| @a11ylint/core | 37 of 282 | 29 | 56% | 13% | 6 | 239 |
| RGAA Checker (ARNEO) | 47 of 282 | 36 | 57% | 17% | 109 | 126 |
| RGAA Audit (Le Singe Du Numérique) | 53 of 282 | 16 | 77% | 19% | 57 | 172 |

Precision is the share of an engine's failed criteria the audit also failed; an audit samples pages and may not list every failure, so a criterion "beyond the audit" is not always a false positive. Recall is the share of the audit's failures the engine found; about half of RGAA needs a human, so no engine comes near all of them.

| Site | Pages | Audit fails | @surea11y/pack-rgaa | @uuv/a11y (RgaaChecker) | @a11ylint/core | RGAA Checker (ARNEO) | RGAA Audit (Le Singe Du Numérique) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Région Île-de-France (iledefrance.fr) | 4 | 18 | 6 found, 2 beyond | 2 found, 1 beyond | 4 found, 2 beyond | 4 found, 2 beyond | 2 found, 3 beyond |
| Insee (insee.fr) | 19 | 27 | 9 found, 3 beyond | 3 found, 1 beyond | 5 found, 1 beyond | 6 found, 3 beyond | 5 found, 0 beyond |
| Caisse d'Epargne (caisse-epargne.fr) | 16 | 22 | 4 found, 2 beyond | 4 found, 0 beyond | 4 found, 2 beyond | 5 found, 1 beyond | 6 found, 1 beyond |
| Bordeaux Métropole (bordeaux-metropole.fr) | 13 | 21 | 10 found, 7 beyond | 3 found, 1 beyond | 5 found, 2 beyond | 7 found, 2 beyond | 6 found, 3 beyond |
| CNIL (cnil.fr) | 20 | 30 | 4 found, 5 beyond | 2 found, 3 beyond | 2 found, 3 beyond | 3 found, 3 beyond | 5 found, 1 beyond |
| Bouygues Telecom (bouyguestelecom.fr) | 15 | 46 | 10 found, 4 beyond | 3 found, 3 beyond | 4 found, 3 beyond | 8 found, 3 beyond | 9 found, 0 beyond |
| LCL – public site (lcl.fr) | 14 | 42 | 12 found, 4 beyond | 4 found, 3 beyond | 5 found, 2 beyond | 4 found, 7 beyond | 7 found, 3 beyond |
| Université de Strasbourg (unistra.fr) | 16 | 30 | 5 found, 2 beyond | 3 found, 0 beyond | 3 found, 1 beyond | 3 found, 1 beyond | 3 found, 1 beyond |
| Nantes Université (univ-nantes.fr) | 15 | 31 | 8 found, 3 beyond | 3 found, 0 beyond | 5 found, 1 beyond | 5 found, 1 beyond | 7 found, 0 beyond |
| Département du Nord (lenord.fr) | 14 | 9 | 3 found, 5 beyond | 1 found, 3 beyond | 0 found, 7 beyond | 2 found, 6 beyond | 2 found, 2 beyond |
| impots.gouv.fr (DGFiP) | 16 | 6 | 0 found, 2 beyond | 0 found, 3 beyond | 0 found, 5 beyond | 0 found, 7 beyond | 1 found, 2 beyond |

<details><summary>19 pages left out for every engine</summary>

- Région Île-de-France (iledefrance.fr): Action régionale (blocked, 403)
- Région Île-de-France (iledefrance.fr): Média podcast (blocked, 403)
- Région Île-de-France (iledefrance.fr): Dossier (blocked, 403)
- Région Île-de-France (iledefrance.fr): Contact (blocked, 403)
- Région Île-de-France (iledefrance.fr): Service (blocked, 403)
- Région Île-de-France (iledefrance.fr): Accessibilité (blocked, 403)
- Région Île-de-France (iledefrance.fr): Evènement (blocked, 403)
- Région Île-de-France (iledefrance.fr): Toutes les actualités (blocked, 403)
- Région Île-de-France (iledefrance.fr): Agendas (blocked, 403)
- Région Île-de-France (iledefrance.fr): Hub personnalisation (arneo: got another document than the first engine: {"status":403,"title":"Access Denied)
- Région Île-de-France (iledefrance.fr): Hub navigation (uuv: got another document than the first engine: {"status":403,"title":"Access Denied)
- Insee (insee.fr): Page d'aide et contacts (blocked, 429)
- Insee (insee.fr): Plan du site (blocked, 500)
- Insee (insee.fr): Page d'accueil (stan: got another document than the first engine: {"status":429,"title":"","doctype":f)
- Insee (insee.fr): Bilan Formation-Emploi 2023 (stan: got another document than the first engine: {"status":429,"title":"","doctype":f)
- Bordeaux Métropole (bordeaux-metropole.fr): Le Printemps de la Biodiversité (blocked, 403)
- Bouygues Telecom (bouyguestelecom.fr): Mot de passe oublié (1ère étape) (blocked, 200)
- Bouygues Telecom (bouyguestelecom.fr): Authentification (sas de connexion) (uuv: TypeError: Cannot read properties of undefined (reading 'RgaaChecker'))
- Nantes Université (univ-nantes.fr): Page de connexion (blocked, 500)

</details>

## W3C's Before and After Demonstration

Criteria failed, summed over the four pages: before the repair, and after. A criterion still failed after the repair is a likely false positive, or a barrier the demo left.

| Engine | Before | After |
| --- | ---: | ---: |
| @surea11y/pack-rgaa | 34 | 3 |
| @uuv/a11y (RgaaChecker) | 28 | 10 |
| @a11ylint/core | 22 | 8 |
| RGAA Checker (ARNEO) | 35 | 6 |
| RGAA Audit (Le Singe Du Numérique) | 35 | 5 |

## On the pack's fixtures

Each case of the pack's scenario pages, by what it expects, and what each engine did on the criteria the case's rule checks. These pages were written for the pack, so they favour it.

| Engine | FAIL cases | PASS cases | CANTTELL cases |
| --- | --- | --- | --- |
| @surea11y/pack-rgaa | 164 fail, 0 ask, 0 nothing | 2 fail, 8 ask, 84 nothing | 6 fail, 68 ask, 2 nothing |
| @uuv/a11y (RgaaChecker) | 25 fail, 3 ask, 136 nothing | 6 fail, 6 ask, 82 nothing | 8 fail, 10 ask, 58 nothing |
| @a11ylint/core | 19 fail, 0 ask, 145 nothing | 1 fail, 0 ask, 93 nothing | 3 fail, 0 ask, 73 nothing |
| RGAA Checker (ARNEO) | 32 fail, 16 ask, 116 nothing | 9 fail, 14 ask, 71 nothing | 7 fail, 20 ask, 49 nothing |
| RGAA Audit (Le Singe Du Numérique) | 14 fail, 2 ask, 148 nothing | 5 fail, 0 ask, 89 nothing | 5 fail, 2 ask, 69 nothing |

## The pack against each engine: BAD demo

8 pages every engine scanned. Each cell counts (page, criterion) pairs.

|  | @uuv/a11y (RgaaChecker) | @a11ylint/core | RGAA Checker (ARNEO) | RGAA Audit (Le Singe Du Numérique) |
| --- | ---: | ---: | ---: | ---: |
| Both fail | 16 | 22 | 22 | 22 |
| Neither fails | 118 | 0 | 154 | 29 |
| Pack fails, other asks | 0 | 0 | 1 | 0 |
| Pack fails, other passes | 4 | 0 | 6 | 0 |
| Other fails, pack asks | 2 | 1 | 4 | 10 |
| Other fails, pack passes | 20 | 7 | 15 | 8 |
| Only the pack judges it | 248 | 378 | 206 | 339 |
| Only the other judges it | 56 | 0 | 106 | 4 |
| **When either fails, both do** | **38%** | **73%** | **46%** | **55%** |
| Where both fail: elements both failed | 141 | 167 | 540 | 138 |
| … only the pack failed | 8 | 8 | 13 | 120 |
| … only the other failed | 41 | 43 | 0 | 84 |

## The pack against each engine: audited sites

162 pages every engine scanned. Each cell counts (page, criterion) pairs.

|  | @uuv/a11y (RgaaChecker) | @a11ylint/core | RGAA Checker (ARNEO) | RGAA Audit (Le Singe Du Numérique) |
| --- | ---: | ---: | ---: | ---: |
| Both fail | 148 | 146 | 209 | 148 |
| Neither fails | 2671 | 0 | 3521 | 671 |
| Pack fails, other asks | 0 | 0 | 77 | 45 |
| Pack fails, other passes | 28 | 0 | 70 | 146 |
| Other fails, pack asks | 133 | 183 | 135 | 190 |
| Other fails, pack passes | 260 | 308 | 255 | 175 |
| Only the pack judges it | 5022 | 7625 | 3995 | 6887 |
| Only the other judges it | 1134 | 0 | 2090 | 112 |
| **When either fails, both do** | **26%** | **23%** | **28%** | **21%** |
| Where both fail: elements both failed | 300 | 408 | 660 | 169 |
| … only the pack failed | 330 | 335 | 415 | 468 |
| … only the other failed | 10340 | 1772 | 2175 | 2405 |

Where they diverge most, by criterion (pages where one fails and the other passes it):

- **@uuv/a11y (RgaaChecker):** 6.1 (pack only 0, other only 94), 6.2 (pack only 0, other only 79), 2.1 (pack only 0, other only 43), 1.1 (pack only 0, other only 33), 1.2 (pack only 27, other only 0), 5.7 (pack only 0, other only 5), 5.4 (pack only 0, other only 4), 5.1 (pack only 0, other only 2)

- **@a11ylint/core:** 8.1 (pack only 0, other only 162), 6.2 (pack only 0, other only 49), 2.1 (pack only 0, other only 40), 9.1 (pack only 0, other only 29), 1.1 (pack only 0, other only 24), 2.2 (pack only 0, other only 2), 11.1 (pack only 0, other only 2)

- **RGAA Checker (ARNEO):** 11.9 (pack only 0, other only 82), 2.1 (pack only 0, other only 43), 6.2 (pack only 31, other only 7), 10.1 (pack only 0, other only 32), 1.1 (pack only 28, other only 0), 1.9 (pack only 0, other only 25), 11.6 (pack only 3, other only 18), 9.1 (pack only 0, other only 18)

- **RGAA Audit (Le Singe Du Numérique):** 8.2 (pack only 146, other only 0), 2.1 (pack only 0, other only 43), 6.1 (pack only 0, other only 36), 11.9 (pack only 0, other only 35), 3.2 (pack only 0, other only 27), 7.3 (pack only 0, other only 16), 9.1 (pack only 0, other only 8), 5.6 (pack only 0, other only 3)
