*Projekt: Elpris-siden*\
*Dokument: ai-elpris-side*\
*Forfatter: Claude, til godkendelse af Morten L.*\
*Opdateret: 2026-10-28*\
*Mønster: repo-docs 3*

# Elpris-siden

Elpris-siden er en statisk webside, der viser dagens spotpriser på el time for time for Vestdanmark (DK1) og Østdanmark (DK2) i kr. pr. kWh, med og uden moms. Kort sagt: *åbn siden, og se, hvornår strømmen er billig i dag*.

## 1. Formål / Hvorfor

Elprisen skifter hver time, og den, der kan flytte forbruget, sparer penge ved at bruge strøm, når den er billig. Energinets Energi Data Service har priserne, men kun som rå data pr. kvarter i kr. pr. MWh. Siden gør dem til en tabel, man kan læse på et øjeblik.

- **Succes:** siden viser dagens priser for begge prisområder uden fejl, viser morgendagens, når de er offentliggjort, markerer de billigste timer, og testene kører i CI.
- **Bruger:** Morten og andre i Danmark, der vil se dagens elpris (skøn).
- **Fravalgt:** nettarif, elafgift og elselskabets tillæg. Prisen er kun selve elprisen på markedet. Ingen persondata, kun offentlige priser.

Repoet er også et projekt, `projekt-elpris-side`, i softwarekontoret [ai-kontor-software](https://github.com/mortenlorenzen/ai-kontor-software). Det viser, hvordan kontoret løser en lille, afgrænset opgave fra start til slut.

## 2. Forstå / Hvordan

Markedet sætter én pris pr. kvarter, og siden laver dem om til én pris pr. time. Siden 1. oktober 2025 giver datasættet `DayAheadPrices` én pris pr. kvarter, og beregningen sker i fire trin:

1. **Hent.** `tools/hent-priser.js` henter begge prisområder fra dagen før til og med dagen efter i dansk tid og skriver dem til `data/priser.js`. Browseren må ikke selv hente dem, fordi API'et kun svarer browsere fra `energidataservice.dk`.
2. **Vælg dagen.** Kun kvarterer, hvis `TimeDK` ligger på dagens dato i Danmark, tæller med.
3. **Lav timepriser.** Timens pris er gennemsnittet af dens kvarterer, regnet om fra kr. pr. MWh til kr. pr. kWh. Mangler et kvarter, bruges gennemsnittet af resten.
4. **Læg moms på.** Prisen med moms er prisen uden moms gange 1,25, også når prisen er negativ.

Kvartererne samles efter timen i UTC og ikke i dansk tid. Den dag, sommertiden slutter, har derfor 25 timer, og timen `02–03` står to gange. Den dag, sommertiden begynder, har 23 timer.

Tre principper styrer repoet:

- **Ingen byggetrin og ingen afhængigheder.** Siden kan åbnes direkte fra en lokal kopi, og scriptene er almindelige scripts, fordi browsere ikke indlæser ES-moduler fra `file://`.
- **Samme logik i browser og test.** `src/prices.js` eksporterer til Node med `module.exports`, så testene prøver præcis den kode, siden bruger.
- **Testene henter aldrig fra nettet.** De bruger gemte svar fra API'et.

AI-agenterne i softwarekontoret skriver koden og reviewer den. Morten beskriver opgaverne og fletter.

## 3. Byggeklodser / Hvad

### Software

| Fil | Indhold |
|---|---|
| `index.html` | Siden med tabellen |
| `src/prices.js` | Beregningen: adressen til API'et, dansk dato, timepriser, moms og tal på dansk |
| `src/app.js` | Læser priserne fra `data/priser.js` og tegner tabellen |
| `src/styles.css` | Lyst og mørkt tema og tabellen på telefonbredde |
| `test/prices.test.js` | 18 tests med `node --test` |
| `test/data/` | Gemte svar fra API'et og deres [README](../test/data/README.md) |
| `tools/hent-priser.js` | Henter priserne til `data/priser.js`, som ikke committes |
| `tools/hent-testdata.js` | Henter testdata fra API'et |
| `.github/workflows/` | CI med `node --test`, workflowet `pages`, der henter priserne og udgiver siden hver time, og workflowet, der starter kontorets `fletning` |

Tabellen har en række pr. time og kolonnerne Time, DK1 Vest og DK2 Øst, hver uden og med moms. Negative priser står med minus og i grønt, og under overskriften står, hvornår priserne er hentet.

### Fælles kerne

- **Dataflow:** Energi Data Service → workflowet `pages` (hver time) → `data/priser.js` → `src/prices.js` → tabellen på GitHub Pages.
- **Fejl:** er dagens priser ikke offentliggjort, eller er priserne ikke hentet, viser siden en besked i stedet for tabellen. Er priserne hentet en anden dag, står datoen ved hentetidspunktet.
- **Test:** testene kører i CI på hver PR med Node 22. De dækker timepris som gennemsnit, moms på positive og negative priser, manglende kvarterer, sommertid og vintertid, dansk dato omkring midnat, adressen til API'et, datafilen og tal med komma. Testdata er svar for 25. og 27. oktober 2026, gemt uændret, og en test tjekker felterne i hver række.

## 4. Kom i gang / Brug

```bash
node --test                  # testene, Node 22
node tools/hent-priser.js    # hent priserne til data/priser.js
```

Åbn derefter `index.html` i en browser. Siden ligger også på GitHub Pages, hvor priserne hentes hver time. Fjord-udgaven af denne side laves i hånden i `docs/_kilde/ai-elpris-side.body.html` og bygges med `python3 docs/byg-visuals.py`.

## 5. Status / Hvor langt

Skelettet og hentningen til GitHub Pages er flettet. To krav mangler.

| Krav | Status |
|---|---|
| Dagens priser for DK1 og DK2 | Lavet og prøvet mod gemte svar fra API'et. Hentes hver time til GitHub Pages |
| Med og uden moms | Lavet |
| De billigste timer markeret | Mangler |
| Morgendagens priser, når de er offentliggjort | Mangler |
| Test i CI | Lavet, 18 tests |

Reviewet af skelettet pegede også på, at siden ikke viser den nye dag efter midnat, før den genindlæses. Opgaver, beslutninger og fletninger logges i kontorets log i `ai-kontor-software` med objektet `projekt-elpris-side`.

## Kilder

- [Day-Ahead Prices | energidataservice.dk](https://www.energidataservice.dk/tso-electricity/DayAheadPrices)
- Repoets `CLAUDE.md` og [test/data/README.md](../test/data/README.md)
- [ai-kontor-software](https://github.com/mortenlorenzen/ai-kontor-software), `CLAUDE.md` og `KICKOFF.md`, afsnit 2
- Den tidligere beskrivelse `docs/elpris-siden.md`, som denne indgang erstatter
