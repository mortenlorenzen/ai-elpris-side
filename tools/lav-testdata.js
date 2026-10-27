// Laver testdata i samme form som svaret fra Energi Data Service for datasættet DayAheadPrices.
// Priserne er syntetiske og laves med et fast seed, så filerne bliver de samme hver gang.
// Kør med: node tools/lav-testdata.js
//
// Filen ligger uden for test/, fordi node --test kører alle .js-filer i test/.

const { writeFileSync } = require("node:fs");
const { join } = require("node:path");

const SEED = 20261027;
const EUR_TO_DKK = 7.46;

// Mulberry32: en lille pseudotilfældig generator, der giver det samme for det samme seed.
function random(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const danish = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Copenhagen",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function isoUtc(time) {
  return time.toISOString().slice(0, 19);
}

function isoDk(time) {
  return danish.format(time).replace(" ", "T");
}

// Alle kvarterer fra og med første til og med sidste danske dato, for begge prisområder, nyeste først
// som i API'ets standardsortering.
function records(firstDate, lastDate, next) {
  const result = [];
  for (const area of ["DK1", "DK2"]) {
    // Dansk midnat er kl. 22 eller 23 i UTC dagen før, så vinduet starter tre timer før og frasorteres bagefter.
    const from = Date.parse(`${firstDate}T00:00:00Z`) - 3 * 3600000;
    const to = Date.parse(`${lastDate}T23:59:59Z`);
    for (let ms = from; ms <= to; ms += 15 * 60000) {
      const time = new Date(ms);
      const dk = isoDk(time);
      if (dk.slice(0, 10) < firstDate || dk.slice(0, 10) > lastDate) continue;
      const hour = Number(dk.slice(11, 13));
      const base = area === "DK1" ? 70 : 78;
      const daily = 45 * Math.sin(((hour - 11) / 24) * 2 * Math.PI) + (hour >= 17 && hour <= 19 ? 60 : 0);
      const eur = Math.round((base + daily + (next() - 0.5) * 40) * 100) / 100 - (hour >= 12 && hour <= 13 && area === "DK1" ? 110 : 0);
      result.push({
        TimeUTC: isoUtc(time),
        TimeDK: dk,
        PriceArea: area,
        DayAheadPriceEUR: Math.round(eur * 100) / 100,
        DayAheadPriceDKK: Math.round(eur * EUR_TO_DKK * 1e6) / 1e6,
      });
    }
  }
  return result.sort((a, b) => b.TimeUTC.localeCompare(a.TimeUTC) || a.PriceArea.localeCompare(b.PriceArea));
}

function save(name, start, end, rows) {
  const response = {
    syntetisk: true,
    total: rows.length,
    filters: '{"PriceArea":["DK1","DK2"]}',
    limit: 1000,
    dataset: "DayAheadPrices",
    records: rows,
  };
  writeFileSync(join(__dirname, "..", "test", "data", name), JSON.stringify(response, null, 2) + "\n");
  console.log(`${name}: ${rows.length} kvarterer fra ${start} til ${end}`);
}

const next = random(SEED);
save("dayahead-2026-10-27-syntetisk.json", "2026-10-26", "2026-10-28", records("2026-10-26", "2026-10-28", next));
save("dayahead-2026-10-25-syntetisk.json", "2026-10-25", "2026-10-25", records("2026-10-25", "2026-10-25", next));
