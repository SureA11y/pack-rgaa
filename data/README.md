# RGAA source data

`criteres-4.1.2.json` is the RGAA 4.1.2 criteria file exactly as the French government's digital accessibility team (DINUM) publishes it, copied byte for byte:

- Repository: <https://github.com/DISIC/accessibilite.numerique.gouv.fr>, file `RGAA/criteres.json`
- Commit: `ca4019f95073b6cbd2482a16e9f12b52d8de678d` (git blob `24e2149541e6fae6b0ac0c8eb92c36e43f991773`)
- Version: RGAA 4.1.2, the 4.1 criteria with the April 2023 errata applied (the repository's `src/ressources/notes-de-revision-4-1-2.md`)
- Licence: [Licence Ouverte 2.0](https://www.etalab.gouv.fr/licence-ouverte-open-licence/) (Etalab), per the repository's README. Attribution: « Référentiel général d’amélioration de l’accessibilité (RGAA) 4.1.2, DINUM ».

`methodologies-4.1.2.json` and `glossaire-4.1.2.json` are the test methodology and the glossary, from the same repository, copied byte for byte under the same licence:

- `RGAA/methodologies.json`, commit `b676fede5b8a94d55c440df98ceba016a80e58de` (git blob `edca1ac82a4696a2771028069f2159ecca67909c`). That commit, of March 2026, corrects the typography of RGAA 4.1.2's text and changes no test.
- `RGAA/glossaire.json`, commit `38252fa079e38ec5a89d05d71cc3e4c4ead6682b` (git blob `c3780a934420a24bdf9904d20138e8db9832dd1b`).

`scripts/generate-map.js` turns the three into `map.js` and `glossary.js`. Never edit them by hand: `tests/map.test.js` regenerates them from these files and fails on any difference. To take a newer RGAA, add its files here and a version entry in the generator, then run `npm run map`.
