// Siden: henter dagens priser fra Energi Data Service og viser dem som en tabel. Bruger danishDate, pricesUrl,
// priceTable og formatKr fra prices.js, som indlæses før denne fil.

const statusLine = document.getElementById("status");
const result = document.getElementById("result");

loadPrices(danishDate());

async function loadPrices(date) {
  try {
    const response = await fetch(pricesUrl(date));
    if (!response.ok) throw new Error(`Energi Data Service svarede ${response.status}.`);
    const data = await response.json();
    const rows = priceTable(Array.isArray(data.records) ? data.records : [], date);
    if (rows.length === 0) {
      showStatus(`Der er ingen priser for ${formatDate(date)} endnu.`);
      return;
    }
    renderTable(rows, date);
    showStatus("");
  } catch (error) {
    showStatus(`Priserne kunne ikke hentes. ${error.message}`, true);
  }
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
