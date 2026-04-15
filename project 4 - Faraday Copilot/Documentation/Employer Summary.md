# Employer Summary

## One-line description

Faraday Copilot is a Chrome extension prototype that embeds AI research, writing, citation, Google Docs, file, and graphing workflows directly into the browser side panel and a fullscreen workspace.

## Technical highlights

- Built a Manifest V3 Chrome extension using service workers, content scripts, side panel UI, popup UI, options page, and web-accessible resources.
- Integrated OpenRouter's chat-completions API with configurable model selection and custom model IDs.
- Designed a message-driven extension architecture between content scripts, background worker, side panel, and fullscreen app.
- Implemented page context extraction from visible DOM content, metadata, headings, lists, tables, and selected text.
- Added Google Docs support through an Apps Script companion after recognising normal DOM extraction was unreliable.
- Built persistent local storage for settings, personalities, chat history, file payloads, citation notebook, page context, and queued actions.
- Created a custom graphing engine with expression parsing, canvas rendering, zoom/pan, intercepts, stationary points, and intersections.
- Preserved a full version history showing feature growth, failed UI iteration, and recovery into a more maintainable final build.

## Best files to review

- `Version History/09 - Faraday extension V8/manifest.json`
- `Version History/09 - Faraday extension V8/background.js`
- `Version History/09 - Faraday extension V8/content-script.js`
- `Version History/09 - Faraday extension V8/lib/openrouter.js`
- `Version History/09 - Faraday extension V8/lib/storage.js`
- `Version History/09 - Faraday extension V8/app.js`
- `Version History/09 - Faraday extension V8/apps-script/Code.gs`

## Skills demonstrated

Chrome extension development, JavaScript, HTML, CSS, API integration, asynchronous messaging, browser storage, Google Apps Script, UI iteration, product documentation, canvas rendering, numerical methods, and AI workflow design.

## Honest limitations

The project is a prototype. A production version should proxy AI requests through a backend, stream responses, add automated tests, harden privacy controls, and package the extension for formal distribution.
