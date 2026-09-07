"""Print the SPACE_HASH for a passcode and write it into docs/js/config.js.
Usage: python scripts/passcode.py <passcode>"""
import hashlib, sys, pathlib, re
pc = sys.argv[1].strip().lower()
h = hashlib.sha256(("ally-alex:" + pc).encode()).hexdigest()
cfg = pathlib.Path(__file__).resolve().parent.parent / "docs" / "js" / "config.js"
src = cfg.read_text(encoding="utf-8")
src = re.sub(r'export const SPACE_HASH = "[^"]*";', f'export const SPACE_HASH = "{h}";', src)
cfg.write_text(src, encoding="utf-8")
print(h)
