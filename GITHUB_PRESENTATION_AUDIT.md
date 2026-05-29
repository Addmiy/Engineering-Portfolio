# GitHub Presentation Audit

Audit date: 2026-05-29

## Scope

- Authenticated GitHub user: `Addmiy`
- Public repositories found: one, [`Addmiy/Engineering-Portfolio`](https://github.com/Addmiy/Engineering-Portfolio)
- GitHub profile README repository: not found. A repository named `Addmiy/Addmiy` is required before a profile README can appear on the GitHub profile.

## Improvements Made

- Reworked the root README into an evidence-first portfolio overview.
- Added a fast-review section that points reviewers to the strongest software, hardware, mechanical, product, and systems evidence.
- Added a project evidence map so each claim links to a specific folder or file.
- Rewrote the five main project READMEs into a consistent case-study format:
  - review summary
  - problem/context
  - solution or system scope
  - technical proof points
  - best files to inspect
  - limitations or next work
- Fixed the broken Gearbox block-flow link by pointing to the rendered diagram image that actually exists.
- Renamed `CAD Modells` to `CAD Models` in Projects 1 and 2.
- Added a Light Refraction design brief for consistency with the other engineering project folders.
- Added a Code Revisions note for the Light Refraction project explaining why the `.lnk` file is not portable evidence.
- Added `PROFILE_README_DRAFT.md` because the GitHub profile README repo does not currently exist.

## Remaining Issues That Cannot Be Fully Solved From This Repo Alone

| Issue | Why it remains | Recommended action |
| --- | --- | --- |
| GitHub profile README does not show | The special `Addmiy/Addmiy` repository does not exist. | Create a public repository named `Addmiy` under the `Addmiy` account and use `PROFILE_README_DRAFT.md` as the starting README. |
| Private or unpublished GitHub work was not evaluated | Only one public repository was visible through the account/repo inventory. | Add links or local clones for any private repositories that should be included in the portfolio review. |
| Fusion 360 `.f3d` files do not preview as readable GitHub pages | They are binary CAD files. | Add PNG renders and short captions for each major CAD revision. |
| PDFs are useful but slow for fast portfolio review | GitHub can display PDFs, but they are not as scannable as Markdown evidence. | Keep PDFs as primary evidence and add short Markdown extracts for objective, constraints, outcome, and key screenshots. |
| MP4 demonstration files do not work as concise README evidence | They are large binary files and are harder to skim than images or GIFs. | Add short GIFs or still-frame contact sheets that link to the MP4 files. |
| Windows `.lnk` shortcut in Light Refraction code revisions is not portable | It points to a local Windows path outside the repository. | Replace it with the original source file if available, or leave the README note that no portable code evidence is present. |
| Mermaid `.mmd` files are stored as source, not automatically rendered in normal GitHub file browsing | GitHub renders Mermaid inside Markdown code fences, not as diagram previews for every `.mmd` file. | Embed the diagrams in Markdown using fenced `mermaid` blocks or export PNG/SVG copies. |

## Additional Diagrams to Add

| Project | Diagram to add | Why it would help |
| --- | --- | --- |
| Root portfolio | One-page portfolio map linking projects to skills and evidence files | Gives recruiters/assessors a visual entry point before reading project details. |
| Gearbox Model | Gear train layout diagram with motor shaft, countershaft, drive shaft, gear pairs, bearings, and synchroniser | Makes the mechanical system understandable without opening the full report. |
| Gearbox Model | Gear-ratio decision matrix showing planned ratios, removed ratios, and fabrication constraints | Turns the design tradeoff into explicit engineering evidence. |
| Light Refraction System | Optical ray-path diagram from input light to output path | The current diagrams communicate system structure, but not the optical behaviour directly. |
| Light Refraction System | CAD revision comparison board with thumbnails and captions | Makes the binary Fusion 360 files understandable on GitHub. |
| Faraday Copilot | Sequence diagram for selected-text action to AI response | Shows message flow across content script, background worker, storage, OpenRouter, and UI. |
| Faraday Copilot | Data/privacy boundary diagram | Clarifies what stays in local storage and what is sent to AI providers or Apps Script. |
| Faraday Copilot | Graph engine pipeline diagram | Explains prompt detection, expression parsing, AST evaluation, canvas rendering, and analysis output. |
| GYLIO App | User journey diagram from alarm setup to activation, lesson, task planning, and journaling | Shows product flow better than screenshots alone. |
| GYLIO App | Frontend/service architecture diagram | Connects Expo Router screens, services, AsyncStorage, notifications, Supabase, and video playback. |
| ENG1013 Assignment | Feature traceability matrix diagram linking subsystem requirements to code files, circuit sheets, and demo videos | Makes the strongest systems-engineering evidence easier to verify. |
| ENG1013 Assignment | Hardware/software interaction diagram with Arduino, Python/Pymata4, sensors, lights, buzzers, and failure alert | Provides a quick technical overview of the integrated build. |
| ENG1013 Assignment | Test scenario timeline for a vehicle moving through approach detection, exit diversion, tunnel detection, and failure response | Makes the demonstration behaviour easier to understand before watching videos. |

## Presentation Priorities for the Next Pass

1. Create the `Addmiy/Addmiy` profile README repository so GitHub shows a professional profile landing section.
2. Add rendered PNG/SVG versions of key diagrams beside source files.
3. Add a traceability matrix for ENG1013 because it has the richest evidence set and the most moving parts.
4. Add short visual summaries for large PDFs and MP4s so reviewers do not need to open heavy files first.
5. Consider moving very large binary assets to Git LFS if the repository continues to grow.
