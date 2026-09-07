"""Parse scripts/repertoire_raw.txt ("Title - Composer" per line) into docs/data/repertoire.json."""
import json, re, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
raw = (root / "scripts" / "repertoire_raw.txt").read_text(encoding="utf-8")
CLASSICAL = re.compile(r"Bach|Handel|Vivaldi|Mozart|Haydn|Corelli|Purcell|Beethoven|Brahms|Schubert|Chopin|Mendelssohn|Elgar|Satie|Grieg|Bizet|Delibes|Franck|Massenet|Puccini|Mascagni|Offenbach|Rubinstein|Boccherini|Telemann|Gossec|Mouret|Loeillet|Clarke|Meyerbeer|Wagner|Dvorak|Holst|Schumann|Flotow|Bernstein|Lecuona|Albéniz|Yradier|Villoldo|Tárrega|Ferrer|Malotte|Joplin|Pachelbel|Gounod|Traditional|Folk|Hymn|Hillsong|Yiruma|Crain|Ungar|Vangelis|Enya|Løvland|Morricone|Giacchino|Djawadi|Bowers|Craig Armstrong|Norman|Rota|DeVille|Hardy")
out = []
for line in raw.splitlines():
    line = line.strip()
    if not line:
        continue
    t, _, c = line.rpartition(" - ")
    out.append({"title": t, "artist": c, "genre": "classical" if CLASSICAL.search(c) else "popular"})
(root / "docs" / "data" / "repertoire.json").write_text(json.dumps(out, ensure_ascii=False, indent=0), encoding="utf-8")
print(len(out), "songs,", sum(1 for o in out if o["genre"] == "classical"), "classical")
