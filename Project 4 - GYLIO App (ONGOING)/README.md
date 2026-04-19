# Project 4 - GYLIO App (ONGOING)

Status: Ongoing. This folder preserves the current web and mobile prototype iterations while the product concept continues to evolve.

GYLIO, short for Get Your Life In Order, is a productivity app built around a behavioural design brief: help users start their day with intentional action instead of distraction.

I translated a high-level product concept into a working web app with two core MVP systems: a Morning Activation flow and a Structured Execution Dashboard. The app lets users select a character trait, preview motivational training segments, launch a full-screen activation reel, track an alarm countdown, view daily schedule blocks, and manage priority tasks.

This project demonstrates my ability to interpret a product brief, design a clean user experience, implement interactive frontend behaviour, structure a production-ready mobile codebase, and organise a prototype so it can be reviewed by employers or extended in future versions.

## Problem

Most productivity tools organise tasks after the user has already entered the day reactively. GYLIO explores a more targeted intervention: shaping the first interaction after waking so users begin with identity, direction, and a clear next action.

## Solution

The prototype focuses on a calm but decisive user experience. It combines a trait-based morning activation sequence with a lightweight dashboard for schedule awareness, priority task tracking, and execution feedback.

## Technical Highlights

- Built a no-install HTML, CSS, and JavaScript prototype with modular data-driven UI behaviour.
- Implemented trait selection, rotating activation sequences, alarm countdown logic, task completion scoring, and schedule rendering.
- Designed a responsive dashboard layout with custom visual styling, animated UI states, and mobile breakpoints.
- Added PWA foundation files including a web manifest, service worker, and app icon.
- Built a version 2 Expo React Native app with TypeScript, Expo Router, local persistence, notification scheduling, Supabase video lookup, fullscreen activation playback, and a minimal daily home screen.
- Completed a V1 UI revision with a stricter 8-point layout rhythm, layered charcoal surfaces, premium typography, thin outline iconography, and subtle fade/slide motion.

## What I Accomplished

- Converted an abstract behavioural-product brief into a functional MVP prototype.
- Created a disciplined visual identity aligned with the product mission.
- Built the first version of the app without relying on a heavy framework or external build tooling.
- Rebuilt the concept as a native-oriented mobile app with a cleaner service architecture and real Supabase-ready video pipeline.
- Refactored the interface into a consistent product design system across alarm setup, activation, lesson, calendar, task, and journal screens.
- Structured the code and documentation so the project can be reviewed, demonstrated, and iterated.

## Evidence

Evidence is organised by app version so future UI revisions can be reviewed alongside the matching source-code snapshot.

### Version 1

#### Desktop dashboard

![Desktop dashboard](./evidence/version%201/01-dashboard-desktop.png)

#### Morning activation reel

![Morning activation reel](./evidence/version%201/02-morning-activation-modal.png)

#### Trait-based training selection

![Trait selection](./evidence/version%201/03-trait-selection.png)

#### Responsive mobile layout

![Mobile layout](./evidence/version%201/04-mobile-responsive-layout.png)

### Version 2

#### Alarm setup

![Alarm setup](./evidence/version%202/01-alarm-setup.png)

#### Lesson dashboard

![Lesson dashboard](./evidence/version%202/02-home-lesson-dashboard.png)

#### Morning activation video

![Morning activation video](./evidence/version%202/03-activation-video-state.png)

#### Daily planning and journal

![Daily planning and journal](./evidence/version%202/04-daily-planning-journal.png)

## Project Files

- [Engineering design brief](./ENGINEERING_DESIGN_BRIEF.md)
- [Version 1 source code](./version%201/)
- [Version 1 run guide](./version%201/README.md)
- [Version 2 source code](./version%202/)
- [Version 2 run guide](./version%202/README.md)
- [V1 UI revision source code](./V1%20UI%20revision/)
- [V1 UI revision run guide](./V1%20UI%20revision/README.md)
