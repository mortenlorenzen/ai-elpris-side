*Projekt: Elpris-siden*\
*Dokument: CLAUDE*\
*Forfatter: Claude, til godkendelse af Morten L.*\
*Opdateret: 2026-10-28*

# Regler for Claude i dette repo

Repoet er projektet `projekt-elpris-side` i softwarekontoret [ai-kontor-software](https://github.com/mortenlorenzen/ai-kontor-software). Kontorets regler, roller og proceslog ligger dér. Oplægget står i kontorets `KICKOFF.md`, og Morten Lorenzen ejer projektet og træffer beslutningerne.

## Dokumenter

- Sprog: dansk.
- Læs indgangen `docs/ai-elpris-side.md` først. Den beskriver formål, beregning, filer og status efter skillen `repo-docs` (mønster 2), og den gentages ikke her.
- Ret indgangen, aldrig `docs/ai-elpris-side-visual.html`, og byg siden med `python3 docs/byg-visuals.py`.

## Teknik

- HTML, CSS og JavaScript uden byggetrin. Siden kan åbnes direkte fra en lokal kopi.
- Scriptene er almindelige scripts og ikke ES-moduler, fordi browsere ikke indlæser moduler fra `file://`. Logikken ligger i filer, der også eksporterer til Node med `module.exports`, så testene kan bruge dem.
- Ingen afhængigheder. Testene skrives med `node --test` og ligger i `test/`, og testdata ligger i `test/data/`.
- Priserne hentes fra Energi Data Service, som er offentlig og ikke kræver en nøgle. API'et svarer kun browsere fra sine egne domæner, så `tools/hent-priser.js` henter dem til `data/priser.js`, som siden indlæser. Workflowet `pages` gør det hver time og udgiver siden på GitHub Pages. Testene henter aldrig fra nettet. De bruger gemte svar fra API'et i `test/data/`.
- Day-ahead-priserne er opgjort pr. kvarter (skøn), og siden viser timens gennemsnit. Nettarif og elafgift er ikke med.
- Grafen tegnes som SVG uden et grafbibliotek.
- Kode og identifikatorer må være på engelsk. Tekst på siden, kommentarer og dokumenter er på dansk.

## Arbejdsgang

- Følg kontorets `CLAUDE.md`. Før en aktivitet læses rollens agent i kontorets `.claude/agents/<rolle>.md` og aktivitetens skill i `.claude/skills/<aktivitet>/SKILL.md`.
- Én opgave giver én PR, og PR'erne er små. PR'en åbnes som kladde, indtil `reviewer-ai` er færdig, og beskrivelsen har linjen `Mortens minutter: <n> (Claudes skøn)`. Morten fletter. Claude fletter aldrig selv.
- Kør `node --test` før hver PR. CI kører det samme.
- Hver opgave logges i kontorets log i `ai-kontor-software` med objektet `projekt-elpris-side`, ikke her. PR'en logges som `PR åbnet` med `url`. Når en PR lukkes, starter `.github/workflows/fletning.yml` kontorets workflow `fletning`, som logger `PR flettet` med `commit` og fletter opgavens log-PR (ADR-30 og ADR-33 i skabelonen).
- Ingen persondata. Siden bruger kun offentlige priser.

## Kilder

- [Energi Data Service | energidataservice.dk](https://www.energidataservice.dk/)
- `KICKOFF.md` i ai-kontor-software, afsnit 2
