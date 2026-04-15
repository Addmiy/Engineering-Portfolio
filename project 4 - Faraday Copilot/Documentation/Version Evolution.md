# Version Evolution

This document records the development path found in the original `Faraday Project` directory and preserved in `Version History/`.

## Timeline table

| Portfolio folder | Original folder | Modified | Manifest version | Main revision |
|---|---|---:|---:|---|
| `00 - Chrome AI LM - V0` | `Chrome AI LM - V0` | 2026-03-14 16:07 | 1.0.0 | Local Chrome AI proof of concept under the earlier Seamless AI name. |
| `01 - Faraday Copilot - Openrouter V1` | `Faraday Copilot - Openrouter V1` | 2026-03-14 16:08 | 1.2.0 | Rebranded as Faraday Copilot and migrated from local AI to OpenRouter. |
| `02 - Faraday Copilot - Openrouter V2` | `Faraday Copilot - Openrouter V2` | 2026-03-14 16:33 | 1.3.0 | Added Apps Script companion and hybrid Google Docs extraction. |
| `03 - Faraday Copilot - Openrouter V3` | `Faraday Copilot - Openrouter V3` | 2026-03-14 16:49 | 1.3.1 | Switched Google Docs support toward strict companion-based extraction. |
| `04 - Faraday Copilot - Openrouter V4` | `Faraday Copilot - Openrouter V4` | 2026-03-15 00:40 | 1.3.4 | Moved companion fetches through the background service worker and added clearer diagnostics. |
| `05 - Faraday Copilot - Openrouter V5 UI Revision` | `Faradap Copilot - Openrouter V5 - UI Revision` | 2026-03-16 15:43 | 1.4.0 | Revised side-panel and fullscreen UI after a larger failed interface branch. |
| `06 - Faraday Copilot - Openrouter V6 Failed UI` | `Faraday Copilot - Openrouter V6 - Failed UI` | 2026-03-16 13:45 | 1.4.0 | Preserved failed UI direction with a large tabbed navigation and graph studio rewrite. |
| `07 - Faraday Copilot - Openrouter V7` | `Faraday Copilot - Openrouter V7` | 2026-03-16 18:50 | 1.4.3 | Added dedicated fullscreen CSS and improved graph/math rendering. |
| `08 - Gemini experimental` | `Gemini experimental` | 2026-03-27 22:56 | 1.4.0 | Experiment folder preserved; comparison indicates no provider-specific code changes from V5. |
| `09 - Faraday extension V8` | `Faraday extension V8` | 2026-03-27 23:28 | 1.4.4 | Final preserved build with separate `app.js`, rebuilt fullscreen workspace, and extended graph analysis. |

Note: Source timestamps show the `V6 - Failed UI` folder was modified before the `V5 UI Revision` folder. The portfolio keeps both the semantic version labels and the source timestamps so the design branch is clear.

## Revision details

### V0 - Local AI prototype

The first build was named `Seamless AI Search Enhancer Local`. It used Chrome's local AI concept and established the first product pattern: side-panel chat, floating selection controls, page summaries, citations, Google Docs assistance, and personality presets.

This version proved the browser-context assistant idea before external model routing was added.

### V1 - OpenRouter migration

V1 renamed the product to `Faraday Copilot`, added `lib/openrouter.js`, removed `lib/local-ai.js`, added `app.html`, and expanded the product into a configurable OpenRouter-powered assistant.

Key additions:

- OpenRouter API key setting.
- Default model `openrouter/hunter-alpha`.
- Custom model selection.
- File-aware prompt support.
- Fullscreen app route.
- Citation notebook.
- Basic graphing support.

### V2 - Google Docs companion

V2 added the `apps-script/` folder and widened host permissions to include Google Docs, Google Apps Script, and Googleusercontent URLs.

The important change was a hybrid Google Docs extraction strategy:

- Prefer Apps Script companion snapshots.
- Fall back to export endpoint text.
- Fall back to DOM bridge extraction when needed.

This demonstrates a practical response to Google Docs being difficult to read reliably through normal DOM scraping.

### V3 - Strict Google Docs mode

V3 changed Google Docs extraction from best-effort fallback behavior to strict companion mode. Instead of silently using weak visible text when companion extraction failed, the extension surfaces configuration errors.

This is an important engineering decision because silent fallbacks can make AI output look confident while using bad context.

### V4 - Background companion fetch and diagnostics

V4 moved companion fetches into the background service worker through a `FETCH_DOCS_COMPANION` message. This avoids content-script cross-origin fetch failure paths under Manifest V3 and adds clearer setup errors for login redirects, non-JSON responses, invalid payloads, and missing URLs.

This version shows improved diagnosis and supportability, not just feature expansion.

### V5 and V6 - UI branch and revision

The project contains both a failed UI branch and a revised UI branch. The failed UI branch greatly expanded `sidepanel.js`, `sidepanel.css`, `sidepanel.html`, and `app.html`, introducing tabbed navigation and a more ambitious graph studio.

The UI revision then reduces and reshapes the interface direction while keeping the useful structure: tabs, graph workspace, files, citations, and page tools. Retaining both versions is useful portfolio evidence because it shows iteration after a design attempt did not land cleanly.

### V7 - Graph and fullscreen polish

V7 adds a dedicated `app.css` file and expands the graph and fullscreen experience. The graph studio becomes more polished with better rendering, analysis sections, and improved side-panel/fullscreen behavior.

This version begins separating fullscreen presentation concerns from the side panel.

### Gemini experimental

The folder name suggests an attempted Gemini branch, but source comparison did not find provider-specific changes. It appears to be a duplicated or placeholder experiment from the V5 UI revision line.

It remains in version history to preserve the original project directory accurately.

### V8 - Final preserved version

V8 adds a dedicated `app.js` file of roughly 1,600 lines and becomes the most complete preserved version. It keeps the extension architecture but rebuilds the fullscreen workspace as its own app surface.

Notable V8 improvements:

- Dedicated fullscreen workspace script.
- `OPEN_FULLSCREEN_APP` flow passes source tab context into the full app.
- Persistent active fullscreen view state.
- Multi-function graph parsing.
- Canvas zoom, pan, and hover inspection.
- Intercept, stationary point, and intersection analysis.
- Inline graph preview support for AI outputs.
- Cleaner separation between side panel and fullscreen app files.

## Line-count growth

| Version | Files | Approx. lines |
|---|---:|---:|
| V0 | 18 | 1,522 |
| V1 | 19 | 2,915 |
| V2 | 22 | 3,143 |
| V3 | 22 | 3,128 |
| V4 | 22 | 3,256 |
| V5 UI Revision | 22 | 3,828 |
| V6 Failed UI | 22 | 4,213 |
| V7 | 23 | 4,590 |
| Gemini experimental | 22 | 3,828 |
| V8 | 24 | 6,077 |

## Most important engineering decisions

- Migrating from local AI to OpenRouter gave the project model flexibility and practical API reliability.
- Adding an Apps Script companion addressed Google Docs extraction more robustly than DOM scraping alone.
- Strict Google Docs mode prioritised correctness over pretending weak context was good enough.
- Moving fetches to the background worker improved Manifest V3 compatibility.
- Preserving the failed UI branch shows an honest design iteration path.
- Separating the fullscreen workspace into `app.css` and `app.js` made V8 more maintainable than earlier shared side-panel code.
