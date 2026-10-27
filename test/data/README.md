*Projekt: Elpris-siden*\
*Dokument: Testdata*\
*Forfatter: Claude, til godkendelse af Morten L.*\
*Opdateret: 2026-10-27*

# Testdata

Testene henter aldrig fra nettet. De bruger svar i samme form som Energi Data Service giver for datasættet `DayAheadPrices`, men priserne er **syntetiske**. Cloud-miljøet, hvor filerne blev lavet, har ikke adgang til `api.energidataservice.dk`, så formen er lavet ud fra dokumentationen og bør erstattes af gemte svar fra API'et, når det kan lade sig gøre (skøn).

| Fil | Indhold |
|---|---|
| `dayahead-2026-10-27-syntetisk.json` | Alle kvarterer for DK1 og DK2 fra 26. til 28. oktober 2026 i dansk tid, 576 rækker, nyeste først. Svarer til vinduet, siden henter for 27. oktober |
| `dayahead-2026-10-25-syntetisk.json` | Kun 25. oktober 2026, hvor sommertiden slutter: 25 timer og 200 rækker, og kl. 2 dansk tid forekommer to gange |

Hver række har felterne `TimeUTC`, `TimeDK`, `PriceArea`, `DayAheadPriceEUR` og `DayAheadPriceDKK`. Priserne er pr. MWh og pr. kvarter. Tiderne er uden tidszone, som i API'et.

Filerne har `syntetisk: true` øverst og i navnet. API'et har ikke det felt. Filerne laves med `node tools/lav-testdata.js` og et fast seed, så de bliver ens hver gang. Ret generatoren, ikke filerne.

## Kilder

- [Day-Ahead Prices | energidataservice.dk](https://www.energidataservice.dk/tso-electricity/DayAheadPrices)
- [Metadata for Elspotprices | api.energidataservice.dk](https://api.energidataservice.dk/meta/dataset/Elspotprices), det tidligere datasæt med timepriser til og med 30. september 2025
