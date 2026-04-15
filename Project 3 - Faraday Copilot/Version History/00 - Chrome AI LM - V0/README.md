# Seamless AI Search Enhancer Local

This is a Manifest V3 Chrome extension that recreates the same core experience as the earlier Seamless AI build, but swaps the cloud Gemini API for Chrome's built-in local AI.

## What it keeps

- Side panel chat tied to the current page
- Floating selection menu with Explain / Summarise / Cite / Ask AI
- Page-aware prompts and page summaries
- Citation generation in multiple styles
- Best-effort Google Docs assistance overlay
- Bot presets and personality presets

## What changed

- No Gemini API key
- No external model calls
- Uses Chrome's local Prompt API instead

## Requirements

- Chrome 138 or newer
- A device/browser setup that supports Chrome built-in AI
- If the model is not already present, Chrome may need to download it before the extension can answer

## Load it

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select this folder

## Notes

- This version uses the Prompt API for the assistant tasks.
- Citation generation is local and metadata-based, so it is useful but not omniscient. A surprisingly relatable limitation.
- Google Docs support is best effort because Docs still renders like it was designed by a committee that feared peace.
