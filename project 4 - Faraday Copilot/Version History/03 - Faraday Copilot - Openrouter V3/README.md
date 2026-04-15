# Faraday Copilot

A Manifest V3 Chrome extension that brings page-aware AI into the browser using OpenRouter.

## What this build includes

- Persistent side panel chat
- OpenRouter API support with **Hunter Alpha** as the default model
- Model switching with a custom model input
- Highlight toolbar for explain, ask AI, cite, summarise, rewrite, flashcards, and notes
- Page context extraction from visible DOM content, headings, lists, and tables
- Google Docs hybrid extraction: Apps Script companion (optional), export fallback, then DOM bridge
- Quiz, notes, flashcard, and citation workflows
- Session file uploads for text-based AI prompts
- Basic function graphing inside the side panel
- Personality presets plus custom personalities
- Citation notebook with copy-to-clipboard support

## OpenRouter notes

This version uses OpenRouter's OpenAI-compatible chat completions endpoint.

Default model:
- `openrouter/hunter-alpha`

You can switch models in the side panel or settings, and you can add any OpenRouter model ID manually.

## Setup

1. Open `chrome://extensions`
2. Turn on **Developer mode**
3. Click **Load unpacked**
4. Select the `faraday-copilot` folder
5. Open **Settings** and paste your **OpenRouter API key**
6. Keep `openrouter/hunter-alpha` as the default model or change it to another model ID

## Important prototype limitations

- The API key is stored in `chrome.storage.local` for convenience. That is okay for a prototype and not okay for a serious production release.
- Google Docs support is best-effort because Docs has a hostile, ever-changing DOM built by people who apparently dislike other software.
- File upload support is strongest for text-like files. Binary files are passed as metadata only.
- The graphing tool is intentionally simple and supports common maths functions rather than a full CAS.

## Recommended next upgrades

- Proxy OpenRouter requests through your own backend
- True streaming responses in the side panel
- Better Google Docs insertion and anchored suggestion application
- Export quizzes, notes, and flashcards to Markdown/CSV/Anki
- Image/file multimodal upload handling for models that support it


## Google Docs integration

This build no longer treats Google Docs like a normal webpage unless it has to. It now uses this order:

1. Optional Apps Script companion web app for structured snapshots
2. Native Google Docs text export endpoint as the main built-in workaround
3. DOM bridge fallback only when the above are unavailable

A deployable Apps Script starter is included in `apps-script/`. Deploy it as a web app, paste the URL into Settings, and the extension will use it automatically for Docs reads.


## Strict Google Docs mode

This build only uses the configured Apps Script companion URL for Google Docs extraction. It does not fall back to export, DOM bridge, or visible-text scraping for Docs pages. If the companion is missing or fails, the extension shows an error instead of silently using garbage text.
