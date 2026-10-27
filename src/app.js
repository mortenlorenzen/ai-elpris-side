// Siden: viser dagens priser fra datafilen data/priser.js som en tabel. Energi Data Service svarer kun browsere
// fra sine egne domæner, så filen laves af tools/hent-priser.js, på GitHub Pages hver time af en Action.
// Bruger danishDate, priceTable, formatKr og danishTime fra prices.js, som indlæses før denne fil.

const statusLine = document.getElementById("status");
const result = document.getElementById("result");

showPrices(danishDate(), window.PRICE_DATA);

function showPrices(date, data) {
  if (!data || !Array.isArray(data.records)) {
    showStatus("Priserne er ikke hentet. Åbn siden på GitHub Pages, eller kør node tools/hent-priser.js i en lokal kopi.", true);
    return;
  }
  const fetched = data.fetchedAt ? ` ${fetchedText(data.fetchedAt, date)}` : "";
  const rows = priceTable(data.records, date);
  if (rows.length === 0) {
    showStatus(`Der er ingen priser for ${formatDate(date)} endnu.${fetched}`);
    return;
  }
  renderTable(rows, date);
  showStatus(fetched.trim());
}

// "Hentet kl. 16.07." eller med datoen, hvis priserne er hentet en anden dag, fx fordi workflowet er stoppet.
function fetchedText(fetchedAt, date) {
  const day = danishDate(new Date(fetchedAt));
  return day === date ? `Hentet kl. ${danishTime(fetchedAt)}.` : `Hentet ${formatDate(day)} kl. ${danishTime(fetchedAt)}.`;
}

function renderTable(rows, date) {
  document.getElementById("date").textContent = formatDate(date);
  const body = document.querySelector("#prices tbody");
  body.replaceChildren(
    ...rows.map((row) => {
      const tr = document.createElement("tr");
      const th = document.createElement("th");
      th.scope = "row";
      th.textContent = row.label;
      tr.append(th);
      for (const area of ["DK1", "DK2"]) {
        for (const key of ["exVat", "inclVat"]) {
          const td = document.createElement("td");
          td.textContent = row[area] === null ? "–" : formatKr(row[area][key]);
          if (td.textContent.startsWith("-")) td.classList.add("negative");
          tr.append(td);
        }
      }
      return tr;
    }),
  );
  result.hidden = false;
}

// Datoen skrives som "tirsdag den 27. oktober 2026". Kl. 12 UTC ligger på samme dato i Danmark hele året.
function formatDate(date) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("da-DK", {
    timeZone: "Europe/Copenhagen",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function showStatus(text, isError = false) {
  statusLine.textContent = text;
  statusLine.classList.toggle("error", isError);
}
