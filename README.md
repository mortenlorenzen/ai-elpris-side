# ai-elpris-side

Start med indgangen [docs/ai-elpris-side.md](docs/ai-elpris-side.md): formål, beregning, filer og status.

En statisk webside, der skal vise dagens og morgendagens spotpriser på el time for time for DK1 og DK2, med de billigste timer markeret. Priserne hentes fra Energinets [Energi Data Service](https://www.energidataservice.dk/). Projektet løses af softwarekontoret [ai-kontor-software](https://github.com/mortenlorenzen/ai-kontor-software), og reglerne står i [CLAUDE.md](CLAUDE.md).

Testene køres med `node --test` (Node 22). Der er ingen afhængigheder og intet byggetrin.

Siden ligger på GitHub Pages, hvor workflowet `pages` henter priserne hver time. Energi Data Service svarer kun browsere fra sine egne domæner, så siden kan ikke selv hente dem. I en lokal kopi køres `node tools/hent-priser.js` først, og derefter åbnes `index.html`. Logikken ligger i `src/prices.js`, siden i `src/app.js`, og testdata i `test/data/` er gemte svar fra API'et, som hentes med `node tools/hent-testdata.js`.
