*Projekt: Elpris-siden*\
*Dokument: Testdata*\
*Forfatter: Claude, til godkendelse af Morten L.*\
*Opdateret: 2026-10-27*

# Testdata

Testene henter aldrig fra nettet. De bruger svar fra Energi Data Service for datasættet `DayAheadPrices`, gemt uændret med den adresse, siden selv bruger (`pricesUrl` i `src/prices.js`). Svarene er hentet 27. oktober 2026.

| Fil | Indhold |
|---|---|
| `dayahead-2026-10-27.json` | Vinduet, siden henter for 27. oktober: alle kvarterer for DK1 og DK2 fra 26. til 28. oktober 2026 i dansk tid, 576 rækker |
| `dayahead-2026-10-25.json` | Vinduet for 25. oktober 2026, hvor sommertiden slutter: 24. til 26. oktober, 584 rækker. 25. oktober har 100 kvarterer pr. prisområde, og kl. 2 dansk tid forekommer to gange |

Svaret har felterne `total`, `filters`, `sort`, `limit`, `dataset` og `records`. Hver række har `TimeUTC`, `TimeDK`, `PriceArea`, `DayAheadPriceEUR` og `DayAheadPriceDKK`. Priserne er pr. MWh og pr. kvarter, og tiderne er uden tidszone. API'et læser `start` og `end` som dansk tid, og `end` er ikke med, så vinduet fra dagen før til og med dagen efter giver præcis tre danske døgn.

Filerne hentes igen med `node tools/hent-testdata.js 2026-10-27 2026-10-25`. Ret ikke filerne i hånden.

## Kilder

- [Day-Ahead Prices | energidataservice.dk](https://www.energidataservice.dk/tso-electricity/DayAheadPrices)
- [Svaret for 27. oktober | api.energidataservice.dk](https://api.energidataservice.dk/dataset/DayAheadPrices?start=2026-10-26&end=2026-10-29&filter=%7B%22PriceArea%22%3A%5B%22DK1%22%2C%22DK2%22%5D%7D&sort=TimeUTC+asc&limit=1000)
