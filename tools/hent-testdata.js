// Henter testdata: de svar, siden får fra Energi Data Service, gemt uændret i test/data/.
// Adressen er den samme, som siden bruger, så testene prøver beregningen på et rigtigt svar.
// Kør med: node tools/hent-testdata.js 2026-10-27 2026-10-25
// Bag en proxy kræver Node 22 også NODE_USE_ENV_PROXY=1.
//
// Filen ligger uden for test/, fordi node --test kører alle .js-filer i test/.

const { writeFileSync } = require("node:fs");
const { join } = require("node:path");
const { pricesUrl } = require("../src/prices.js");

async function save(date) {
  const response = await fetch(pricesUrl(date));
  if (!response.ok) throw new Error(`${date}: Energi Data Service svarede ${response.status}`);
  const text = await response.text();
  const { records } = JSON.parse(text);
  const name = `dayahead-${date}.json`;
  writeFileSync(join(__dirname, "..", "test", "data", name), text);
  console.log(`${name}: ${records.length} kvarterer fra ${records[0].TimeDK} til ${records.at(-1).TimeDK}`);
}

(async () => {
  const dates = process.argv.slice(2);
  if (dates.length === 0) throw new Error("Angiv en eller flere datoer, fx 2026-10-27");
  for (const date of dates) await save(date);
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
