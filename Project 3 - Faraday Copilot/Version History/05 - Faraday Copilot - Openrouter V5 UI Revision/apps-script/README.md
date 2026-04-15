# Faraday Google Docs Companion (Apps Script)

This optional companion improves Google Docs extraction and is the right place to extend selection-aware editing later.

## Deploy

1. Create a new Apps Script project.
2. Copy `Code.gs` and `appsscript.json` into the project.
3. Replace `ALLOWED_EXTENSION_ID` in `Code.gs` with your extension ID after loading the extension once.
4. Deploy as Web app.
5. Paste the deployed `/exec` URL into the extension setting named Google Docs companion web app URL.

## Current endpoint

- `GET ?action=snapshot&documentId=...`
  - returns a structured JSON snapshot of the document text, headings, lists and tables
