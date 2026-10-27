// Henter dagens og morgendagens priser fra Energi Data Service og skriver dem til data/priser.js, som siden
// indlæser. Browseren må ikke selv hente dem, fordi API'et kun svarer browsere fra sine egne domæner.
// Kør med: node tools/hent-priser.js [mappe]   (standard er repoets rod)
// Bag en proxy kræver Node 22 også NODE_USE_ENV_PROXY=1.

const { mkdirSync, writeFileSync } = require("node:fs");
const { join } = require("node:path");
const { danishDate, pricesUrl, priceDataScript } = require("../src/prices.js");

(async () => {
  const folder = join(process.argv[2] ?? join(__dirname, ".."), "data");
  const response = await fetch(pricesUrl(danishDate()));
  if (!response.ok) throw new Error(`Energi Data Service svarede ${response.status}`);
  const { records } = await response.json();
  if (!Array.isArray(records) || records.length === 0) throw new Error("Energi Data Service svarede uden priser");
  mkdirSync(folder, { recursive: true });
  writeFileSync(join(folder, "priser.js"), priceDataScript(records, new Date().toISOString()));
  console.log(`${join(folder, "priser.js")}: ${records.length} kvarterer fra ${records[0].TimeDK} til ${records.at(-1).TimeDK}`);
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
