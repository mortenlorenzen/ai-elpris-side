# ai-elpris-side

En statisk webside, der viser dagens og morgendagens spotpriser på el time for time for DK1 og DK2, med de billigste timer markeret. Priserne hentes fra Energinets [Energi Data Service](https://www.energidataservice.dk/). Projektet løses af softwarekontoret [ai-kontor-software](https://github.com/mortenlorenzen/ai-kontor-software), og reglerne står i [CLAUDE.md](CLAUDE.md).

Testene køres med `node --test` (Node 22). Der er ingen afhængigheder og intet byggetrin.

Åbn `index.html` i en browser for at se dagens priser. Logikken ligger i `src/prices.js`, siden i `src/app.js`, og testdata i `test/data/` er gemte svar fra API'et, som hentes med `node tools/hent-testdata.js`.
