# Ally & Alex — wedding planner

Shared planning site for the October 10, 2026 wedding at McGill Rose Garden.
Live at https://strubetube.github.io/ally-and-alex/

- `docs/` — the site (GitHub Pages serves this folder). Vanilla JS modules, no build step.
- `docs/js/config.js` — Firebase web config + passcode hash. Data lives in Firestore under `spaces/{hash}/…`; without a config the site runs in Preview mode on localStorage.
- `docs/data/seed.js` — everything imported from the planning spreadsheets. Written to the database once, on first open.
- `docs/data/repertoire.json` — Charlotte String's 2026 repertoire (built by `scripts/build_repertoire.py`).
- `scripts/passcode.py <passcode>` — regenerates the passcode hash in config.js.

Firestore rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /spaces/{space}/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```
