// Timepriser ud fra Energi Data Service: datasættet DayAheadPrices har én pris pr. kvarter og prisområde
// i kr. pr. MWh, og siden viser timens gennemsnit i kr. pr. kWh, med og uden moms.
//
// Filen er et almindeligt script og ikke et ES-modul, så siden kan åbnes fra file://. I browseren bliver
// funktionerne globale, og i Node eksporteres de med module.exports, så testene kan bruge dem.

const API_URL = "https://api.energidataservice.dk/dataset/DayAheadPrices";
const AREAS = ["DK1", "DK2"];
const VAT_RATE = 0.25;
const TIME_ZONE = "Europe/Copenhagen";

// Datoen i Danmark som "ÅÅÅÅ-MM-DD". Den kan være en anden end datoen i UTC lige før og efter midnat.
function danishDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type) => parts.find((p) => p.type === type).value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function addDays(date, days) {
  const time = new Date(`${date}T00:00:00Z`);
  time.setUTCDate(time.getUTCDate() + days);
  return time.toISOString().slice(0, 10);
}

// Adressen, der henter priserne for begge prisområder. Vinduet går en dag til hver side, så dagen er med,
// uanset om API'et læser start og slut i dansk tid eller i UTC. Dagen vælges bagefter ud fra TimeDK.
function pricesUrl(date) {
  const params = new URLSearchParams({
    start: addDays(date, -1),
    end: addDays(date, 2),
    filter: JSON.stringify({ PriceArea: AREAS }),
    sort: "TimeUTC asc",
    limit: "1000",
  });
  return `${API_URL}?${params}`;
}

function withVat(price) {
  return price * (1 + VAT_RATE);
}

// Timepriserne for ét prisområde på én dansk dato, sorteret efter tid. Kvartererne samles efter timen i UTC,
// så de to timer kl. 2 på dagen, hvor sommertiden slutter, ikke lægges sammen. Prisen er gennemsnittet af de
// kvarterer, der har en pris, regnet om fra kr. pr. MWh til kr. pr. kWh. quarters er antallet af kvarterer.
function hourlyPrices(records, area, date) {
  const hours = new Map();
  for (const record of records) {
    if (record === null || typeof record !== "object") continue;
    const { PriceArea, TimeUTC, TimeDK, DayAheadPriceDKK } = record;
    if (PriceArea !== area || typeof TimeUTC !== "string" || typeof TimeDK !== "string") continue;
    if (!TimeDK.startsWith(date) || typeof DayAheadPriceDKK !== "number" || !Number.isFinite(DayAheadPriceDKK)) continue;
    const key = TimeUTC.slice(0, 13);
    const hour = hours.get(key) ?? { hourUtc: key, hourDk: TimeDK.slice(11, 13), sum: 0, quarters: 0 };
    hour.sum += DayAheadPriceDKK;
    hour.quarters += 1;
    hours.set(key, hour);
  }
  return [...hours.values()]
    .sort((a, b) => a.hourUtc.localeCompare(b.hourUtc))
    .map(({ hourUtc, hourDk, sum, quarters }) => {
      const exVat = sum / quarters / 1000;
      return { hourUtc, hourDk, quarters, exVat, inclVat: withVat(exVat) };
    });
}

// Tabellen på siden: én række pr. time med priserne for DK1 og DK2. Mangler et område en time, er dets
// felt null. Timen kl. 2 står to gange den dag, sommertiden slutter, og får sommertid og vintertid på.
function priceTable(records, date) {
  const rows = new Map();
  for (const area of AREAS) {
    for (const price of hourlyPrices(records, area, date)) {
      const row = rows.get(price.hourUtc) ?? { hourUtc: price.hourUtc, hourDk: price.hourDk, DK1: null, DK2: null };
      row[area] = { exVat: price.exVat, inclVat: price.inclVat, quarters: price.quarters };
      rows.set(price.hourUtc, row);
    }
  }
  const sorted = [...rows.values()].sort((a, b) => a.hourUtc.localeCompare(b.hourUtc));
  return sorted.map((row, index) => {
    let label = hourLabel(row.hourDk);
    if (sorted[index + 1]?.hourDk === row.hourDk) label += " sommertid";
    if (sorted[index - 1]?.hourDk === row.hourDk) label += " vintertid";
    return { label, ...row };
  });
}

function hourLabel(hourDk) {
  const hour = Number(hourDk);
  return `${String(hour).padStart(2, "0")}–${String((hour + 1) % 24).padStart(2, "0")}`;
}

// En pris i kr. med to decimaler og komma, fx "1,23". En pris, der rundes til nul, skrives uden minus.
function formatKr(price) {
  const rounded = Math.round(price * 100) / 100 || 0;
  return rounded.toLocaleString("da-DK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

if (typeof module !== "undefined") {
  module.exports = { API_URL, AREAS, VAT_RATE, danishDate, addDays, pricesUrl, withVat, hourlyPrices, priceTable, hourLabel, formatKr };
}
