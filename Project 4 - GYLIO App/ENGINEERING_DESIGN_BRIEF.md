# Engineering Design Brief - GYLIO App

## Project Purpose

GYLIO, short for Get Your Life In Order, is a character-development productivity prototype designed to help users begin their day with intentional action. The MVP focuses on one high-impact behavioural moment: the first interaction after waking.

## Engineering Objective

Build a lightweight, browser-accessible prototype that demonstrates the core product experience without requiring a backend, account system, app store deployment, or framework build pipeline.

## Core User Problem

Many productivity tools organise tasks but do not influence behaviour at the moment decisions are made. GYLIO addresses the morning decision point by combining motivational priming with immediate execution planning.

## MVP Systems

1. Morning Activation System: trait selection, alarm countdown, motivational sequence preview, and full-screen activation reel.
2. Structured Execution Dashboard: daily schedule blocks, priority tasks, completion scoring, and visual progress feedback.

## Technical Approach

The first version is implemented with HTML, CSS, and vanilla JavaScript to keep the prototype simple, inspectable, and easy to run. The interface uses data-driven rendering for traits, activation segments, schedule blocks, and task state.

## Engineering Decisions

- Used static frontend files to avoid unnecessary setup friction.
- Used vanilla JavaScript to demonstrate direct DOM manipulation, state updates, event handling, and UI rendering.
- Used responsive CSS layouts to support desktop and mobile viewing.
- Added PWA foundation files, including a manifest, service worker, and app icon, to show awareness of installable web app patterns.
- Kept product scope focused on the two MVP systems from the design brief.

## Constraints

- No backend persistence in version 1.
- Alarm wake-screen auto-launch is represented as a prototype interaction because true alarm-trigger behaviour requires native mobile platform APIs.
- Motivational videos are represented as a scripted activation reel rather than external media files.

## Skills Demonstrated

- Frontend architecture
- Product brief interpretation
- Responsive interface design
- JavaScript state and event handling
- PWA fundamentals
- Technical documentation
- User-centred engineering tradeoffs

## Future Improvements

- Persist user tasks and selected trait with local storage or a backend.
- Add real video/audio activation content.
- Build native mobile alarm integrations.
- Add analytics for activation completion, task completion, and streak continuation.
