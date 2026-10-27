*Projekt: Elpris-siden*\
*Dokument: Beskrivelse af repoet ai-elpris-side*\
*Forfatter: Claude, til godkendelse af Morten L.*\
*Opdateret: 2026-10-27*

# Elpris-siden

Elpris-siden er en statisk webside, der viser dagens spotpriser på el time for time for Vestdanmark (DK1) og Østdanmark (DK2) i kr. pr. kWh, med og uden moms. Priserne hentes i browseren fra Energinets Energi Data Service, og siden kan åbnes direkte fra en lokal kopi uden server, byggetrin eller afhængigheder. Repoet er projektet `projekt-elpris-side` i softwarekontoret ai-kontor-software, hvor AI-agenter skriver koden, og Morten beskriver opgaverne og fletter. Kort sagt: *åbn siden, og se, hvornår strømmen er billig i dag*.

## 1. Hvad siden viser

Siden viser én tabel med en række pr. time og fire kolonner med priser.

| Kolonne | Indhold |
|---|---|
| Time | Timen i dansk tid, fx `17–18` |
| DK1 Vest, uden og med moms | Spotprisen i Vestdanmark i kr. pr. kWh |
| DK2 Øst, uden og med moms | Spotprisen i Østdanmark i kr. pr. kWh |

Negative priser står med minus og i grønt. Nettarif, elafgift og elselskabets tillæg er ikke med, så prisen er kun selve elprisen på markedet. Er dagens priser ikke offentliggjort, eller svarer Energi Data Service ikke, står der en besked i stedet for tabellen.

## 2. Hvordan prisen regnes

Energi Data Service har siden 1. oktober 2025 givet én pris pr. kvarter i datasættet `DayAheadPrices`, og siden laver dem om til timepriser i fire trin.

1. **Hent.** Siden henter begge prisområder fra dagen før til dagen efter, så dagen er med, uanset om API'et læser datoerne i dansk tid eller UTC.
2. **Vælg dagen.** Kun kvarterer, hvis `TimeDK` ligger på dagens dato i Danmark, tæller med.
3. **Lav timepriser.** Timens pris er gennemsnittet af dens kvarterer, regnet om fra kr. pr. MWh til kr. pr. kWh. Mangler et kvarter, bruges gennemsnittet af resten.
4. **Læg moms på.** Prisen med moms er prisen uden moms gange 1,25, også når prisen er negativ.

Kvartererne samles efter timen i UTC og ikke i dansk tid. Derfor får den dag, hvor sommertiden slutter, 25 timer, og timen `02–03` står to gange som sommertid og vintertid. Den dag, sommertiden begynder, har 23 timer.

## 3. Filerne i repoet

Logikken ligger i et almindeligt script, som både browseren og testene kan bruge.

| Fil | Indhold |
|---|---|
| `index.html` | Siden med tabellen |
| `src/prices.js` | Beregningen: adressen til API'et, dansk dato, timepriser, moms og tal på dansk. Eksporteres til Node med `module.exports` |
| `src/app.js` | Henter priserne og tegner tabellen |
| `src/styles.css` | Lyst og mørkt tema og tabellen på telefonbredde |
| `test/prices.test.js` | 14 tests med `node --test` |
| `test/data/` | Syntetiske svar fra API'et og deres README |
| `tools/lav-testdata.js` | Laver testdata med et fast seed |
| `docs/` | Denne beskrivelse og dens Fjord-side |
| `.github/workflows/` | CI med `node --test` og workflowet, der starter kontorets `fletning` |

Scriptene er ikke ES-moduler, fordi browsere ikke indlæser moduler fra `file://`.

## 4. Test og testdata

Testene henter aldrig fra nettet og kører i CI på hver PR med Node 22. De dækker timeprisen som gennemsnit af kvarterer, moms på positive og negative priser, kvarterer uden pris, dagene med sommertid og vintertid, dansk dato omkring midnat, adressen til API'et og tal med komma.

Testdata er syntetiske og markeret med `syntetisk` i navn og indhold. Cloud-miljøet, hvor koden blev skrevet, har ikke adgang til Energi Data Service, så svarene er lavet ud fra dokumentationen. Feltnavnene `TimeUTC`, `TimeDK`, `PriceArea` og `DayAheadPriceDKK` stemmer med andre projekter, der bruger API'et, men er ikke prøvet mod et rigtigt svar (skøn).

## 5. Status og næste skridt

Skelettet er flettet som første kodeopgave, `kodeopgave-4`. Projektet er færdigt, når siden viser dagens priser for begge prisområder uden fejl, viser morgendagens, når de er offentliggjort, og testene kører i CI.

| Krav | Status |
|---|---|
| Dagens priser for DK1 og DK2 | Lavet, ikke prøvet mod det rigtige API |
| Med og uden moms | Lavet |
| De billigste timer markeret | Mangler |
| Morgendagens priser, når de er offentliggjort | Mangler |
| Test i CI | Lavet, 14 tests |

Reviewet af skelettet pegede også på, at siden ikke henter igen efter midnat, og at hentningen ikke har en tidsgrænse.

## 6. Sådan arbejdes der i repoet

Repoet følger kontorets regler i ai-kontor-software. Hver opgave giver én lille PR, som åbnes som kladde, indtil `reviewer-ai` er færdig, og som Morten fletter. Arbejdet logges i kontorets log i OCEL 2.0 med objektet `projekt-elpris-side`, og når en PR lukkes, logger kontorets workflow `fletning` fletningen. Denne beskrivelse rettes i `docs/elpris-siden.md`, og siden bygges med `python3 docs/byg-visuals.py`.

## Kilder

- [Day-Ahead Prices | energidataservice.dk](https://www.energidataservice.dk/tso-electricity/DayAheadPrices)
- [ai-elpris-side](https://github.com/mortenlorenzen/ai-elpris-side), særligt `CLAUDE.md` og `test/data/README.md`
- [ai-kontor-software](https://github.com/mortenlorenzen/ai-kontor-software), `CLAUDE.md` og `KICKOFF.md`, afsnit 2
