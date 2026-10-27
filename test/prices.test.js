// Tests af timepriserne og momsen. Svarene fra API'et er syntetiske og lavet ud fra dokumentationen
// (se test/data/README.md).

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { danishDate, addDays, pricesUrl, withVat, hourlyPrices, priceTable, hourLabel, formatKr } = require("../src/prices.js");

function load(name) {
  return JSON.parse(readFileSync(join(__dirname, "data", name), "utf8")).records;
}

const normalDay = load("dayahead-2026-10-27-syntetisk.json");
const lastSummerDay = load("dayahead-2026-10-25-syntetisk.json");

function quarter(TimeUTC, TimeDK, DayAheadPriceDKK, PriceArea = "DK1") {
  return { TimeUTC, TimeDK, PriceArea, DayAheadPriceEUR: null, DayAheadPriceDKK };
}

function near(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} er ikke ${expected}`);
}

test("timeprisen er gennemsnittet af fire kvarterer i kr. pr. kWh", () => {
  const records = [
    quarter("2026-10-27T11:00:00", "2026-10-27T12:00:00", 1000),
    quarter("2026-10-27T11:15:00", "2026-10-27T12:15:00", 1200),
    quarter("2026-10-27T11:30:00", "2026-10-27T12:30:00", 1400),
    quarter("2026-10-27T11:45:00", "2026-10-27T12:45:00", 1600),
  ];
  const [hour] = hourlyPrices(records, "DK1", "2026-10-27");
  assert.equal(hour.hourDk, "12");
  assert.equal(hour.quarters, 4);
  near(hour.exVat, 1.3);
  near(hour.inclVat, 1.625);
});

test("moms er 25 procent, også på negative priser", () => {
  near(withVat(1), 1.25);
  near(withVat(0.8), 1);
  near(withVat(-0.2), -0.25);
  near(withVat(0), 0);
});

test("en almindelig dag har 24 timer med fire kvarterer for begge prisområder", () => {
  for (const area of ["DK1", "DK2"]) {
    const hours = hourlyPrices(normalDay, area, "2026-10-27");
    assert.equal(hours.length, 24);
    assert.deepEqual(hours.map((h) => h.hourDk), Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0")));
    assert.ok(hours.every((h) => h.quarters === 4));
    assert.equal(hours[0].hourUtc, "2026-10-26T23");
    assert.equal(hours.at(-1).hourUtc, "2026-10-27T22");
  }
});

test("timeprisen fra API-svaret svarer til kvartererne i filen", () => {
  const quarters = normalDay.filter((r) => r.PriceArea === "DK2" && r.TimeDK.startsWith("2026-10-27T18"));
  assert.equal(quarters.length, 4);
  const expected = quarters.reduce((sum, r) => sum + r.DayAheadPriceDKK, 0) / 4 / 1000;
  const hour = hourlyPrices(normalDay, "DK2", "2026-10-27").find((h) => h.hourDk === "18");
  near(hour.exVat, expected);
  near(hour.inclVat, expected * 1.25);
});

test("kun den valgte dato og det valgte prisområde tæller med", () => {
  const dk1 = hourlyPrices(normalDay, "DK1", "2026-10-27");
  const dk2 = hourlyPrices(normalDay, "DK2", "2026-10-27");
  assert.notDeepEqual(dk1.map((h) => h.exVat), dk2.map((h) => h.exVat));
  assert.equal(hourlyPrices(normalDay, "DK1", "2026-10-28").length, 24);
  assert.equal(hourlyPrices(normalDay, "DK1", "2026-10-29").length, 0);
  assert.equal(hourlyPrices(normalDay, "SE4", "2026-10-27").length, 0);
});

test("kvarterer uden pris springes over, og timen får gennemsnittet af resten", () => {
  const records = [
    quarter("2026-10-27T11:00:00", "2026-10-27T12:00:00", 1000),
    quarter("2026-10-27T11:15:00", "2026-10-27T12:15:00", null),
    quarter("2026-10-27T11:30:00", "2026-10-27T12:30:00", 2000),
    quarter("2026-10-27T11:45:00", "2026-10-27T12:45:00", 3000),
    null,
    { TimeDK: "2026-10-27T13:00:00", PriceArea: "DK1", DayAheadPriceDKK: 500 },
    quarter("2026-10-27T13:00:00", "2026-10-27T14:00:00", Number.NaN),
  ];
  const hours = hourlyPrices(records, "DK1", "2026-10-27");
  assert.equal(hours.length, 1);
  assert.equal(hours[0].quarters, 3);
  near(hours[0].exVat, 2);
});

test("tabellen har én række pr. time med DK1 og DK2", () => {
  const rows = priceTable(normalDay, "2026-10-27");
  assert.equal(rows.length, 24);
  assert.equal(rows[0].label, "00–01");
  assert.equal(rows[23].label, "23–00");
  assert.ok(rows.every((row) => row.DK1 !== null && row.DK2 !== null));
  const hour = hourlyPrices(normalDay, "DK1", "2026-10-27")[7];
  assert.deepEqual(rows[7].DK1, { exVat: hour.exVat, inclVat: hour.inclVat, quarters: 4 });
});

test("den dag sommertiden slutter, har 25 timer, og kl. 2 står to gange", () => {
  const rows = priceTable(lastSummerDay, "2026-10-25");
  assert.equal(rows.length, 25);
  assert.deepEqual(rows.slice(1, 5).map((row) => row.label), ["01–02", "02–03 sommertid", "02–03 vintertid", "03–04"]);
  assert.equal(rows[2].hourUtc, "2026-10-25T00");
  assert.equal(rows[3].hourUtc, "2026-10-25T01");
  assert.ok(rows.every((row) => row.DK1.quarters === 4 && row.DK2.quarters === 4));
});

test("den dag sommertiden begynder, mangler kl. 2", () => {
  const records = [
    quarter("2026-03-29T00:00:00", "2026-03-29T01:00:00", 400),
    quarter("2026-03-29T01:00:00", "2026-03-29T03:00:00", 600),
  ];
  assert.deepEqual(priceTable(records, "2026-03-29").map((row) => row.label), ["01–02", "03–04"]);
});

test("mangler et prisområde en time, er dets felt tomt", () => {
  const rows = priceTable([quarter("2026-10-27T11:00:00", "2026-10-27T12:00:00", 800, "DK2")], "2026-10-27");
  assert.equal(rows.length, 1);
  assert.equal(rows[0].DK1, null);
  near(rows[0].DK2.exVat, 0.8);
});

test("datoen er dansk tid, også når UTC er en anden dag", () => {
  assert.equal(danishDate(new Date("2026-10-27T10:00:00Z")), "2026-10-27");
  assert.equal(danishDate(new Date("2026-10-26T23:30:00Z")), "2026-10-27");
  assert.equal(danishDate(new Date("2026-07-01T22:30:00Z")), "2026-07-02");
  assert.equal(danishDate(new Date("2026-07-01T21:30:00Z")), "2026-07-01");
});

test("addDays går over måneder og år", () => {
  assert.equal(addDays("2026-10-31", 1), "2026-11-01");
  assert.equal(addDays("2026-01-01", -1), "2025-12-31");
  assert.equal(addDays("2026-10-25", 2), "2026-10-27");
});

test("adressen henter begge prisområder fra dagen før til dagen efter", () => {
  const url = new URL(pricesUrl("2026-10-27"));
  assert.equal(url.origin + url.pathname, "https://api.energidataservice.dk/dataset/DayAheadPrices");
  assert.equal(url.searchParams.get("start"), "2026-10-26");
  assert.equal(url.searchParams.get("end"), "2026-10-29");
  assert.deepEqual(JSON.parse(url.searchParams.get("filter")), { PriceArea: ["DK1", "DK2"] });
  assert.equal(url.searchParams.get("sort"), "TimeUTC asc");
  assert.ok(Number(url.searchParams.get("limit")) >= 3 * 100 * 2);
});

test("timen og prisen skrives på dansk", () => {
  assert.equal(hourLabel("00"), "00–01");
  assert.equal(hourLabel("23"), "23–00");
  assert.equal(formatKr(1.234), "1,23");
  assert.equal(formatKr(0.5), "0,50");
  assert.equal(formatKr(-0.054), "-0,05");
  assert.equal(formatKr(-0.004), "0,00");
});
