# Results

Scanned 2026-10-17, in Chromium. How the engines run and how pages are scored: [README.md](./README.md).

| Engine | Version | Reports | Criteria it judged |
| --- | --- | --- | ---: |
| @surea11y/pack-rgaa | 0.1.0 | fail, cantTell, pass, inapplicable | 51 of 106 |
| @uuv/a11y (RgaaChecker) | 1.0.0-beta.113 | fail, cantTell, pass | 28 of 106 |
| @a11ylint/core | 1.0.0-alpha.7 | fail | 10 of 106 |
| RGAA Checker (ARNEO) | git 09bb7d6 | fail, cantTell, pass, inapplicable | 50 of 106 |
| RGAA Audit (Le Singe Du Numérique) | git fb0422d | fail, cantTell, pass | 25 of 106 |

"Criteria it judged" counts the RGAA criteria an engine gave a verdict or a finding for on any page scanned. What the main divergences come from: [TRIAGE.md](./TRIAGE.md).

## Against human audits

11 French sites whose accessibility statement lists the criteria a human RGAA audit found non-conforming. An engine finds a criterion when it fails it on at least one of the site's sample pages.

| Engine | Found (of the audits' failures) | Failed beyond the audit | Precision | Recall | Missed, in its scope | Missed, out of its scope |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| @surea11y/pack-rgaa | 69 of 282 | 39 | 64% | 24% | 122 | 91 |
| @uuv/a11y (RgaaChecker) | 28 of 282 | 20 | 58% | 10% | 48 | 206 |
| @a11ylint/core | 36 of 282 | 31 | 54% | 13% | 7 | 239 |
| RGAA Checker (ARNEO) | 47 of 282 | 40 | 54% | 17% | 107 | 128 |
| RGAA Audit (Le Singe Du Numérique) | 55 of 282 | 19 | 74% | 20% | 55 | 172 |

Precision is the share of an engine's failed criteria the audit also failed; an audit samples pages and may not list every failure, so a criterion "beyond the audit" is not always a false positive. Recall is the share of the audit's failures the engine found; about half of RGAA needs a human, so no engine comes near all of them.

| Site | Pages | Audit fails | @surea11y/pack-rgaa | @uuv/a11y (RgaaChecker) | @a11ylint/core | RGAA Checker (ARNEO) | RGAA Audit (Le Singe Du Numérique) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Région Île-de-France (iledefrance.fr) | 2 | 18 | 5 found, 2 beyond | 2 found, 1 beyond | 3 found, 1 beyond | 3 found, 2 beyond | 2 found, 1 beyond |
| Insee (insee.fr) | 19 | 27 | 10 found, 3 beyond | 3 found, 1 beyond | 5 found, 3 beyond | 7 found, 5 beyond | 7 found, 3 beyond |
| Caisse d'Epargne (caisse-epargne.fr) | 13 | 22 | 3 found, 2 beyond | 4 found, 2 beyond | 4 found, 3 beyond | 5 found, 3 beyond | 6 found, 3 beyond |
| Bordeaux Métropole (bordeaux-metropole.fr) | 13 | 21 | 10 found, 7 beyond | 3 found, 1 beyond | 5 found, 2 beyond | 7 found, 2 beyond | 6 found, 3 beyond |
| CNIL (cnil.fr) | 20 | 30 | 4 found, 5 beyond | 2 found, 3 beyond | 2 found, 3 beyond | 3 found, 3 beyond | 5 found, 1 beyond |
| Bouygues Telecom (bouyguestelecom.fr) | 15 | 46 | 9 found, 4 beyond | 3 found, 3 beyond | 4 found, 3 beyond | 8 found, 3 beyond | 9 found, 0 beyond |
| LCL – public site (lcl.fr) | 14 | 42 | 12 found, 4 beyond | 4 found, 3 beyond | 5 found, 2 beyond | 4 found, 7 beyond | 7 found, 3 beyond |
| Université de Strasbourg (unistra.fr) | 16 | 30 | 5 found, 2 beyond | 3 found, 0 beyond | 3 found, 1 beyond | 3 found, 1 beyond | 3 found, 1 beyond |
| Nantes Université (univ-nantes.fr) | 15 | 31 | 8 found, 3 beyond | 3 found, 0 beyond | 5 found, 1 beyond | 5 found, 1 beyond | 7 found, 0 beyond |
| Département du Nord (lenord.fr) | 14 | 9 | 3 found, 5 beyond | 1 found, 3 beyond | 0 found, 7 beyond | 2 found, 6 beyond | 2 found, 2 beyond |
| impots.gouv.fr (DGFiP) | 16 | 6 | 0 found, 2 beyond | 0 found, 3 beyond | 0 found, 5 beyond | 0 found, 7 beyond | 1 found, 2 beyond |

<details><summary>24 pages left out for every engine</summary>

- Région Île-de-France (iledefrance.fr): Actualités (article) (blocked, 403)
- Région Île-de-France (iledefrance.fr): Plan du site (blocked, 403)
- Région Île-de-France (iledefrance.fr): Article (blocked, 403)
- Région Île-de-France (iledefrance.fr): Home (blocked, 403)
- Région Île-de-France (iledefrance.fr): Hub personnalisation (blocked, 403)
- Région Île-de-France (iledefrance.fr): Hub navigation (blocked, 403)
- Région Île-de-France (iledefrance.fr): Action régionale (blocked, 403)
- Région Île-de-France (iledefrance.fr): Média podcast (blocked, 403)
- Région Île-de-France (iledefrance.fr): Dossier (blocked, 403)
- Région Île-de-France (iledefrance.fr): Contact (blocked, 403)
- Région Île-de-France (iledefrance.fr): Service (blocked, 403)
- Région Île-de-France (iledefrance.fr): Toutes les actualités (blocked, 403)
- Région Île-de-France (iledefrance.fr): Agendas (blocked, 403)
- Insee (insee.fr): Plan du site (blocked, 500)
- Insee (insee.fr): Consulter la NAF Rév.2 (section A) (blocked, 429)
- Insee (insee.fr): Modifier son code APE (blocked, 429)
- Insee (insee.fr): Recherche dossier complet (blocked, 429)
- Caisse d'Epargne (caisse-epargne.fr): Tour d’Horizon, la newsletter utile aux professionnels et dirigeants ! (blocked, 403)
- Caisse d'Epargne (caisse-epargne.fr): Assurance Habitation (blocked, 403)
- Caisse d'Epargne (caisse-epargne.fr): Vous constituer une épargne (blocked, 403)
- Bordeaux Métropole (bordeaux-metropole.fr): Le Printemps de la Biodiversité (blocked, 403)
- Bouygues Telecom (bouyguestelecom.fr): Authentification (sas de connexion) (uuv: TypeError: Cannot read properties of undefined (reading 'RgaaChecker'))
- Bouygues Telecom (bouyguestelecom.fr): Mot de passe oublié (1ère étape) (uuv: TypeError: Cannot read properties of undefined (reading 'RgaaChecker'))
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
| RGAA Checker (ARNEO) | 35 fail, 13 ask, 116 nothing | 15 fail, 12 ask, 67 nothing | 9 fail, 14 ask, 53 nothing |
| RGAA Audit (Le Singe Du Numérique) | 14 fail, 2 ask, 148 nothing | 5 fail, 0 ask, 89 nothing | 5 fail, 2 ask, 69 nothing |

## The pack against each engine: BAD demo

8 pages every engine scanned. Each cell counts (page, criterion) pairs.

|  | @uuv/a11y (RgaaChecker) | @a11ylint/core | RGAA Checker (ARNEO) | RGAA Audit (Le Singe Du Numérique) |
| --- | ---: | ---: | ---: | ---: |
| Both fail | 16 | 22 | 22 | 22 |
| Neither fails | 122 | 0 | 149 | 58 |
| Pack fails, other asks | 0 | 0 | 1 | 0 |
| Pack fails, other passes | 8 | 0 | 6 | 0 |
| Other fails, pack asks | 2 | 1 | 4 | 10 |
| Other fails, pack passes | 20 | 7 | 15 | 8 |
| Only the pack judges it | 240 | 378 | 211 | 310 |
| Only the other judges it | 56 | 0 | 106 | 12 |
| **When either fails, both do** | **35%** | **73%** | **46%** | **55%** |
| Where both fail: elements both failed | 141 | 132 | 540 | 105 |
| … only the pack failed | 0 | 35 | 5 | 145 |
| … only the other failed | 33 | 13 | 174 | 78 |

## The pack against each engine: audited sites

157 pages every engine scanned. Each cell counts (page, criterion) pairs.

|  | @uuv/a11y (RgaaChecker) | @a11ylint/core | RGAA Checker (ARNEO) | RGAA Audit (Le Singe Du Numérique) |
| --- | ---: | ---: | ---: | ---: |
| Both fail | 146 | 142 | 202 | 141 |
| Neither fails | 2701 | 0 | 3322 | 1090 |
| Pack fails, other asks | 0 | 0 | 47 | 43 |
| Pack fails, other passes | 70 | 0 | 70 | 159 |
| Other fails, pack asks | 128 | 194 | 129 | 182 |
| Other fails, pack passes | 252 | 318 | 243 | 165 |
| Only the pack judges it | 4710 | 7353 | 3994 | 6227 |
| Only the other judges it | 1099 | 0 | 2030 | 233 |
| **When either fails, both do** | **24%** | **22%** | **29%** | **20%** |
| Where both fail: elements both failed | 300 | 381 | 471 | 163 |
| … only the pack failed | 338 | 358 | 597 | 481 |
| … only the other failed | 9708 | 1730 | 7486 | 1746 |

Where they diverge most, by criterion (pages where one fails and the other passes it):

- **@uuv/a11y (RgaaChecker):** 6.1 (pack only 0, other only 91), 6.2 (pack only 0, other only 76), 11.1 (pack only 43, other only 0), 2.1 (pack only 0, other only 41), 1.1 (pack only 0, other only 31), 1.2 (pack only 27, other only 0), 5.7 (pack only 0, other only 5), 5.4 (pack only 0, other only 4)

- **@a11ylint/core:** 8.1 (pack only 0, other only 157), 6.2 (pack only 0, other only 47), 2.1 (pack only 0, other only 40), 9.1 (pack only 0, other only 26), 1.1 (pack only 0, other only 21), 3.2 (pack only 0, other only 21), 8.3 (pack only 0, other only 2), 11.1 (pack only 0, other only 2)

- **RGAA Checker (ARNEO):** 11.9 (pack only 0, other only 75), 2.1 (pack only 0, other only 41), 6.2 (pack only 31, other only 5), 10.1 (pack only 0, other only 30), 1.1 (pack only 28, other only 0), 1.9 (pack only 0, other only 24), 11.6 (pack only 3, other only 17), 9.1 (pack only 0, other only 18)

- **RGAA Audit (Le Singe Du Numérique):** 8.2 (pack only 140, other only 0), 6.1 (pack only 16, other only 33), 2.1 (pack only 0, other only 41), 11.9 (pack only 0, other only 30), 3.2 (pack only 0, other only 26), 7.3 (pack only 0, other only 12), 9.1 (pack only 3, other only 8), 5.6 (pack only 0, other only 3)
