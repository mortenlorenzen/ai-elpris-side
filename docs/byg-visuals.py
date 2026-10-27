"""Bygger de visuelle sider og tjekker datoerne (N7, ADR-19).

Kopieret fra skabelonens docs/byg-visuals.py sammen med docs/fjord.css, via kontoret ai-kontor-software.
Kun dette afsnit er nyt. Ret skabelonens udgave først og kopiér den hertil, så projektets sider ser ud
som skabelonens og kontorets.

    python docs/byg-visuals.py          # skriv <mappe>/<navn>-visual.html
    python docs/byg-visuals.py --tjek   # fejl, hvis en side er forældet eller datoerne er forskellige

Noterne er alle ``.md`` i ``docs/`` og dens undermapper (ADR-23) og
``kontorer/<kontor>/docs/<n>-*.md``.
Hver note får en Fjord-side ved siden af sig. Findes ``_kilde/<navn>.body.html`` i notens
mappe, er siden lavet i hånden: første linje er en kommentar med sidens titel,
``<!-- titel: ... -->``, og siden bygges af en fast <head>, den fælles ``docs/fjord.css``
inline og kildens indhold. Ellers bygges siden direkte fra Markdown, så den altid
passer til noten.

Tjekket kræver:

- at datoen i notens metadatablok (``*Opdateret: ...*``) er den samme som i sidens fod
  (``Updated ...``)
- at den byggede side er den samme som den, der ligger i repoet
"""

from __future__ import annotations

import html
import re
import sys
from pathlib import Path

DOCS = Path(__file__).resolve().parent
ROD = DOCS.parent

HOVED = (
    '<!doctype html><html lang="da"><head><meta charset="utf-8">'
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
    "<title>{titel}</title>\n"
    '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" '
    'href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Serif+4:'
    'ital,opsz,wght@0,8..60,400;0,8..60,700;0,8..60,800;1,8..60,400&display=swap">\n'
    "<style>\n{css}</style></head><body>\n"
)
TITEL = re.compile(r"^<!-- titel: (.+?) -->\n")
OPDATERET_MD = re.compile(r"^\*Opdateret: (\d{4}-\d\d-\d\d)\*", re.MULTILINE)
OPDATERET_FOD = re.compile(r"Updated (\d{4}-\d\d-\d\d)")
META = re.compile(r"^\*([^:*]+): (.*?)\*\\?$")


def noter(docs: Path = DOCS, rod: Path = ROD) -> list[Path]:
    """Alle noter, der skal have en visuel side."""
    fundet = [*(n for n in docs.rglob("*.md") if "_kilde" not in n.parts),
              *rod.glob("kontorer/*/docs/[0-9]-*.md")]
    return sorted(n for n in fundet if not n.name.endswith("-visual.md"))


def side_for(note: Path) -> Path:
    return note.with_name(note.stem + "-visual.html")


def kilde_for(note: Path) -> Path:
    return note.parent / "_kilde" / f"{note.stem}.body.html"


def byg(kilde: Path, css: str) -> str:
    tekst = kilde.read_text(encoding="utf-8")
    m = TITEL.match(tekst)
    if not m:
        raise ValueError(f"{kilde.name}: første linje skal være <!-- titel: ... -->")
    return HOVED.format(titel=m.group(1), css=css) + tekst[m.end():].rstrip("\n") + "\n</body></html>\n"


# --- Markdown til Fjord -----------------------------------------------------------------

def _inline(tekst: str) -> str:
    dele = re.split(r"(`[^`]+`)", tekst)
    ud = []
    for d in dele:
        if d.startswith("`") and d.endswith("`") and len(d) > 1:
            ud.append(f"<code>{html.escape(d[1:-1])}</code>")
            continue
        d = html.escape(d, quote=False)
        d = re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)", lambda m: f'<a href="{html.escape(m.group(2))}">{m.group(1)}</a>', d)
        d = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", d)
        d = re.sub(r"(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])", r"<em>\1</em>", d)
        ud.append(d)
    return "".join(ud)


def _celler(linje: str) -> list[str]:
    return [c.strip() for c in linje.strip().strip("|").split("|")]


def _tabel(linjer: list[str]) -> str:
    hoved = _celler(linjer[0])
    raekker = [_celler(lin) for lin in linjer[2:]]
    ud = ['<div class="table-wrap"><table class="stack">',
          "<thead><tr>" + "".join(f"<th>{_inline(h)}</th>" for h in hoved) + "</tr></thead><tbody>"]
    for r in raekker:
        celler = [f'<td data-label="{html.escape(h)}">{_inline(c)}</td>' for h, c in zip(hoved, r)]
        ud.append("<tr>" + "".join(celler) + "</tr>")
    ud.append("</tbody></table></div>")
    return "\n".join(ud)


def _liste(linjer: list[str]) -> str:
    nummereret = bool(re.match(r"\s*\d+\.\s", linjer[0]))
    punkter: list[str] = []
    for lin in linjer:
        m = re.match(r"\s*(?:[-*]|\d+\.)\s+(.*)", lin)
        if m and not lin.startswith("    "):
            punkter.append(m.group(1))
        else:
            punkter[-1] += " " + lin.strip()
    punkter = [re.sub(r"^\[x\] ", "✓ ", re.sub(r"^\[ \] ", "○ ", p)) for p in punkter]
    tag = "ol" if nummereret else "ul"
    return f"<{tag}>" + "".join(f"<li>{_inline(p)}</li>" for p in punkter) + f"</{tag}>"


def _blokke(linjer: list[str]) -> list[str]:
    """Lav brødtekst om til HTML-blokke: afsnit, lister, tabeller, kode og h3."""
    ud, i = [], 0
    while i < len(linjer):
        lin = linjer[i]
        if not lin.strip():
            i += 1
        elif lin.startswith("```"):
            j = i + 1
            while j < len(linjer) and not linjer[j].startswith("```"):
                j += 1
            ud.append("<pre>" + html.escape("\n".join(linjer[i + 1:j])) + "</pre>")
            i = j + 1
        elif lin.startswith("### "):
            ud.append(f"<h3>{_inline(lin[4:].strip())}</h3>")
            i += 1
        elif lin.startswith("|"):
            j = i
            while j < len(linjer) and linjer[j].startswith("|"):
                j += 1
            ud.append(_tabel(linjer[i:j]))
            i = j
        elif re.match(r"(?:[-*]|\d+\.)\s", lin):
            j = i + 1
            while j < len(linjer) and linjer[j].strip() and (
                    re.match(r"\s*(?:[-*]|\d+\.)\s", linjer[j]) or linjer[j].startswith("  ")):
                j += 1
            ud.append(_liste(linjer[i:j]))
            i = j
        else:
            j = i + 1
            while j < len(linjer) and linjer[j].strip() and not re.match(r"(```|###? |\||(?:[-*]|\d+\.)\s)", linjer[j]):
                j += 1
            ud.append(f"<p>{_inline(' '.join(lin.strip() for lin in linjer[i:j]))}</p>")
            i = j
    return ud


def fra_markdown(tekst: str, navn: str) -> tuple[str, str]:
    """Returnér (titel, krop) for en note. Kroppen er Fjord-HTML uden <head>."""
    linjer = tekst.splitlines()
    meta, i = {}, 0
    while i < len(linjer) and (m := META.match(linjer[i].strip())):
        meta[m.group(1)] = m.group(2)
        i += 1
    rest = linjer[i:]
    titel_nr = next((n for n, lin in enumerate(rest) if lin.startswith("# ")), None)
    titel = rest[titel_nr][2:].strip() if titel_nr is not None else meta.get("Dokument", navn)
    efter = rest[titel_nr + 1:] if titel_nr is not None else rest
    snit = [n for n, lin in enumerate(efter) if lin.startswith("## ")]
    indledning = _blokke(efter[:snit[0]] if snit else efter)
    tag = " · ".join(v for v in (meta.get("Dokument"), meta.get("Opdateret")) if v)
    ud = ['<div class="page">', '<header class="masthead">', f'  <span class="tag">{html.escape(tag)}</span>',
          f"  <h1>{_inline(titel)}</h1>"]
    if indledning and indledning[0].startswith("<p>"):
        ud.append('  <p class="standfirst">' + indledning.pop(0)[3:-4] + "</p>")
    ud.append("</header>")
    ud += indledning
    for nr, start in enumerate(snit, 1):
        slut = snit[nr] if nr < len(snit) else len(efter)
        overskrift = re.sub(r"^\d+(\.\d+)*\.?\s+", "", efter[start][3:].strip())
        blokke = _blokke(efter[start + 1:slut])
        anker = re.sub(r"[^a-z0-9æøå]+", "-", overskrift.lower()).strip("-")
        ud.append(f'<section id="{anker}">')
        ud.append(f'  <div class="sec-head"><div class="numeral">{nr}</div><div>')
        ud.append(f"    <h2>{_inline(overskrift)}</h2>")
        if blokke and blokke[0].startswith("<p>"):
            ud.append('    <p class="lede">' + blokke.pop(0)[3:-4] + "</p>")
        ud.append("  </div></div>")
        ud += blokke
        ud.append("</section>")
    forfatter = meta.get("Forfatter", "")
    projekt = meta.get("Projekt", "")
    ud += ["", "<footer>", "  <div>", '    <div class="f-label">Curated by</div>', '    <div class="f-content">',
           f"      {html.escape(forfatter)}",
           f'      <div class="f-sub">{html.escape(projekt)}</div>',
           f'      <div class="f-path">{html.escape(navn)}.md · Updated {meta.get("Opdateret", "")}</div>',
           "    </div>", "  </div>", "</footer>", "</div>"]
    return titel, "\n".join(ud)


def byg_note(note: Path, css: str) -> str:
    kilde = kilde_for(note)
    if kilde.exists():
        return byg(kilde, css)
    titel, krop = fra_markdown(note.read_text(encoding="utf-8"), note.stem)
    return HOVED.format(titel=html.escape(re.sub(r"[`*]", "", titel)), css=css) + krop + "\n</body></html>\n"


def tjek(docs: Path = DOCS, rod: Path | None = None) -> list[str]:
    fejl = []
    rod = rod or docs.parent
    css = (docs / "fjord.css").read_text(encoding="utf-8")
    for note in noter(docs, rod):
        navn = note.relative_to(rod)
        md = OPDATERET_MD.search(note.read_text(encoding="utf-8"))
        side = side_for(note)
        try:
            bygget = byg_note(note, css)
        except ValueError as e:
            fejl.append(str(e))
            continue
        fod = OPDATERET_FOD.findall(bygget)
        if not md:
            fejl.append(f"{navn} mangler *Opdateret: ÅÅÅÅ-MM-DD* i metadatablokken")
        elif not fod:
            fejl.append(f"{side.name} mangler 'Updated ÅÅÅÅ-MM-DD' i foden")
        elif any(d != md.group(1) for d in fod):
            fejl.append(f"{navn} er opdateret {md.group(1)}, men den visuelle side siger {', '.join(fod)}")
        if not side.exists() or side.read_text(encoding="utf-8") != bygget:
            fejl.append(f"{side.name} er ikke bygget fra den nyeste kilde. Kør python docs/byg-visuals.py")
    return fejl


def main(argv: list[str]) -> int:
    if "--tjek" in argv:
        fejl = tjek()
        for f in fejl:
            print(f"Fejl: {f}", file=sys.stderr)
        print("Visuelle sider og datoer passer." if not fejl else f"{len(fejl)} fejl.")
        return 1 if fejl else 0
    css = (DOCS / "fjord.css").read_text(encoding="utf-8")
    for note in noter():
        side = side_for(note)
        side.write_text(byg_note(note, css), encoding="utf-8")
        print(f"{side.relative_to(ROD)} bygget")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
