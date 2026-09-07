"""Stamp a new build version into docs/version.json and docs/js/app.js.
Run before every commit that changes site files, so open browsers pick up the change
within a few minutes instead of waiting out GitHub Pages' 10-minute cache."""
import datetime, json, pathlib, re
root = pathlib.Path(__file__).resolve().parent.parent
v = datetime.datetime.now().strftime("%Y%m%d.%H%M")
(root / "docs" / "version.json").write_text(json.dumps({"v": v}), encoding="utf-8")
app = root / "docs" / "js" / "app.js"
s = app.read_text(encoding="utf-8")
s2 = re.sub(r'const BUILD = "[^"]*";', f'const BUILD = "{v}";', s)
if s2 == s:
    raise SystemExit("BUILD constant not found in app.js")
app.write_text(s2, encoding="utf-8")
print(v)
