# Engineering Evidence Excerpts

This file points reviewers to the most technically useful implementation areas in the preserved source snapshots.

## Manifest V3 extension structure

Source: `Version History/09 - Faraday extension V8/manifest.json`

Evidence:

- Background service worker configured as a module.
- Side panel registered through `side_panel.default_path`.
- Options page and popup declared.
- Content script injects citation helpers, page extraction logic, and CSS.
- Web-accessible Google Docs bridge limited to `https://docs.google.com/*`.

Why it matters: the project is not a single static webpage. It uses the main pieces of a production-style Chrome extension.

## Background message routing

Source: `Version History/09 - Faraday extension V8/background.js`

Important message types:

- `OPEN_SIDE_PANEL`
- `OPEN_FULLSCREEN_APP`
- `QUEUE_PANEL_ACTION`
- `GET_SETTINGS`
- `SAVE_SETTINGS`
- `GET_ACTIVE_PAGE_CONTEXT`
- `GET_PAGE_CONTEXT_FOR_TAB`
- `STORE_CITATION`
- `FETCH_DOCS_COMPANION`
- `AI_REQUEST`

Why it matters: the background worker acts as the system coordinator between content scripts, extension UI, AI calls, storage, and Google Docs companion fetches.

## OpenRouter API adapter

Source: `Version History/09 - Faraday extension V8/lib/openrouter.js`

Evidence:

- Calls `https://openrouter.ai/api/v1/chat/completions`.
- Uses bearer-token authentication.
- Sends model ID, system prompt, page context, selected text, file payloads, and recent chat history.
- Returns generated text, usage, and model metadata to the UI.

Why it matters: API integration is isolated from UI code, which makes the model provider easier to replace or proxy later.

## Google Docs companion strategy

Sources:

- `Version History/09 - Faraday extension V8/content-script.js`
- `Version History/09 - Faraday extension V8/background.js`
- `Version History/09 - Faraday extension V8/apps-script/Code.gs`

Evidence:

- Content script detects a Google Doc ID.
- Apps Script companion returns document title, text, headings, lists, tables, and export timestamp.
- Background service worker fetches the companion URL to avoid content-script cross-origin problems.
- The extension surfaces setup errors when the companion is missing, redirects to sign-in, returns non-JSON, or returns unusable text.

Why it matters: this is a realistic integration problem. Google Docs is hard to scrape reliably, so the project uses a companion service instead of pretending normal DOM extraction is enough.

## Persistent user state

Source: `Version History/09 - Faraday extension V8/lib/storage.js`

Evidence:

- Default model catalogue and custom model support.
- Personality presets and custom system prompts.
- Citation style, writing preferences, and feature flags.
- Chat history, citation notebook, session files, page context, pending actions, and active views.

Why it matters: the extension behaves like a product with stateful workflows instead of a stateless demo.

## V8 graph engine

Source: `Version History/09 - Faraday extension V8/app.js`

Evidence:

- Parses graph commands from user prompts and model outputs.
- Supports multi-function expressions separated by new lines, commas, or semicolons.
- Tokenizes mathematical expressions and inserts implicit multiplication.
- Builds and evaluates an AST rather than using unrestricted `eval`.
- Renders graphs to canvas with zoom and pan.
- Estimates graph viewports.
- Finds roots, stationary points, and intersections numerically.

Why it matters: the graph studio is a custom technical subsystem within the AI extension, demonstrating algorithmic work as well as UI work.

## Evidence of design iteration

Sources:

- `Version History/06 - Faraday Copilot - Openrouter V6 Failed UI`
- `Version History/05 - Faraday Copilot - Openrouter V5 UI Revision`
- `Version History/07 - Faraday Copilot - Openrouter V7`
- `Version History/09 - Faraday extension V8`

Evidence:

- V6 grew the side-panel/app UI heavily and was retained as a failed UI branch.
- V5 revised the interface direction.
- V7 separated fullscreen styling with `app.css`.
- V8 separated fullscreen behaviour with `app.js`.

Why it matters: employers often value evidence of iteration, diagnosis, and recovery more than a perfect first pass.
