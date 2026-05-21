# Project 5 - ENG1013 Assignment (ONGOING)

Status: Ongoing. Milestone 1 planning evidence has been preserved, and the latest portfolio update adds implementation code, circuit diagrams, prototype photos, and demonstration videos from the working traffic-control system. Final viva/reflection evidence will still be added after the assignment is complete.

ENG1013 is a smart-systems engineering assignment focused on designing, building, and demonstrating a simplified traffic-control safety system for the Blackwall Tunnel southern approach. The system is intended to reduce over-height vehicle collision risk by detecting vehicle height, warning drivers, managing traffic and pedestrian lights, providing an over-height exit path, and failing safely if the tunnel-height detection subsystem loses power.

This portfolio folder captures the assignment requirements, Team F16's Milestone 1 System Design Document evidence, implementation source snapshots, circuit documentation, and media evidence from the build. The public portfolio copy redacts student IDs, staff email details, and individual team member names from preserved documents, code comments, and circuit title blocks.

## Assignment Overview

![Assignment system overview](./Evidence/Screenshots/assignment-system-overview.png)

The assignment modelled the Blackwall Tunnel southern approach in the UK, where over-height vehicles must be detected and redirected before reaching a tunnel entrance with a 4.0 m clearance limit. The task was to build a simplified smart traffic-control demonstrator that could sense vehicle height, warn drivers, control road and pedestrian signals, provide an over-height exit route, and respond safely if part of the detection system lost power.

Our build represented the road layout using an Arduino-based prototype with ultrasonic sensors, traffic lights, pedestrian buttons and lights, warning lights, buzzers, daylight sensing, and backup failure-alert circuitry. The system was split into five subsystems: approach height detection, Tunnel Ave control, over-height exit control, tunnel entrance height detection, and hardware failure alert. Subsystems 1 and 2 were responsible for measuring actual vehicle height at the approach, while Subsystems 3 and 4 focused on detecting over-height vehicles passing key points and changing the traffic-light states accordingly.

The final objective was not just to write isolated code, but to integrate the sensors, circuits, Python control logic, and physical breadboard wiring into a working traffic safety model that demonstrated the required behaviours.

## Current Stage

The project has progressed from Milestone 1 planning into build and integration. The available evidence now shows requirement extraction, system decomposition, hardware interaction planning, integrated Python control logic, subsystem wiring notes, exported circuit diagrams, physical prototype construction, and recorded system demonstrations.

## Problem

Over-height vehicles present a safety risk when approaching tunnel entrances with fixed clearance limits. This assignment models that safety problem through a simplified traffic-control system that must identify over-height vehicles, prevent unsafe tunnel entry, manage nearby traffic flows, and provide a hardware-only failure response.

## Solution Direction

The planned system is divided into five subsystems:

- Approach Height Detection Subsystem: detects over-height vehicles before the exit and controls warning signals.
- Tunnel Ave Control Subsystem: manages Tunnel Ave traffic lights and pedestrian crossings.
- Over-height Exit Subsystem: allows detected over-height vehicles to leave the route before the tunnel.
- Tunnel Height Detection Subsystem: provides a final detection and closure point at the tunnel entrance.
- Failure Alert Subsystem: provides a hardware-only alert and override path during power failure.

## Milestone 1 Evidence

Milestone 1 produced a System Design Document containing:

- A system interaction block diagram showing Arduino, laptop, sensors, lights, buttons, buzzers, battery, and hardware override circuits.
- High-level flowcharts for Subsystems 1 to 4.
- A feature-selection page for the hardware-only Failure Alert Subsystem.
- A proposed timeline covering programming, wiring, circuit diagrams, and demonstrator check-in work.
- A communications plan using primary, secondary, and backup communication channels.
- A conflict resolution plan covering disagreements, low-quality work, incomplete work, late work, and lack of participation.
- A meeting-minutes template for later project-management evidence.

## Technical Highlights

- Extracted and condensed a 30-page assignment specification into a seven-page overview PDF.
- Preserved original assignment requirements alongside portfolio-friendly summaries.
- Converted official and team PDF pages into screenshot evidence.
- Mapped the assignment into five subsystem responsibilities and milestone deliverables.
- Documented feature IDs selected during Milestone 1 for later traceability into code and circuit evidence.
- Preserved Python source snapshots for the final integrated system and earlier integration stages.
- Added wiring notes for integrated subsystem builds and Subsystem 3.
- Exported 24 circuit-diagram pages from the latest circuit PDF into reviewable PNG evidence.
- Added physical prototype photos covering lab integration, oscilloscope testing, full breadboard wiring, and LDR/LED close-up evidence.
- Added five demonstration videos from the working system.
- Redacted public portfolio copies to avoid publishing student IDs, staff email details, and individual team member names.

## Key Evidence

![System interaction block diagram](./Evidence/Screenshots/milestone-1-system-interaction-block-diagram.png)

![Prototype breadboard build](./Evidence/Photos/photo-03-full-breadboard-prototype.jpg)

## High-Level Flowcharts

![Subsystem 1 high-level flowchart](./Evidence/Screenshots/milestone-1-subsystem-1-flowchart.png)

![Subsystem 2 high-level flowchart](./Evidence/Screenshots/milestone-1-subsystem-2-flowchart.png)

![Subsystem 3 high-level flowchart](./Evidence/Screenshots/milestone-1-subsystem-3-flowchart.png)

![Subsystem 4 high-level flowchart](./Evidence/Screenshots/milestone-1-subsystem-4-flowchart.png)

## Subsystem 2 Circuit Diagrams

![Subsystem 2 circuit diagram sheet 5](./Circuit%20Diagrams/Exported%20PNG/circuit-diagram-05-sheet-5-subsystem-2.png)

![Subsystem 2 circuit diagram sheet 6](./Circuit%20Diagrams/Exported%20PNG/circuit-diagram-06-sheet-6-subsystem-2.png)

![Subsystem 2 circuit diagram sheet 7](./Circuit%20Diagrams/Exported%20PNG/circuit-diagram-07-sheet-7-subsystem-2.png)

## Subsystem 3 Circuit Diagrams

![Subsystem 3 circuit diagram sheet 8](./Circuit%20Diagrams/Exported%20PNG/circuit-diagram-08-sheet-8-subsystem-3.png)

![Subsystem 3 circuit diagram sheet 9](./Circuit%20Diagrams/Exported%20PNG/circuit-diagram-09-sheet-9-subsystem-3.png)

![Subsystem 3 circuit diagram sheet 3 export 1](./Circuit%20Diagrams/Exported%20PNG/circuit-diagram-21-sheet-3-subsystem-3.png)

![Subsystem 3 circuit diagram sheet 3 export 2](./Circuit%20Diagrams/Exported%20PNG/circuit-diagram-22-sheet-3-subsystem-3.png)

![Subsystem 3 circuit diagram sheet 3 export 3](./Circuit%20Diagrams/Exported%20PNG/circuit-diagram-23-sheet-3-subsystem-3.png)

![Subsystem 3 circuit diagram sheet 3 export 4](./Circuit%20Diagrams/Exported%20PNG/circuit-diagram-24-sheet-3-subsystem-3.png)

## Project Files

- [Project overview PDF](./Project%20Overview.pdf)
- [Requirements summary](./Documentation/Requirements%20Summary.md)
- [Milestone 1 summary](./Documentation/Milestone%201%20Summary.md)
- [Build and integration summary](./Documentation/Build%20and%20Integration%20Summary.md)
- [Engineering design brief](./ENGINEERING_DESIGN_BRIEF.md)
- [Code index](./Code/README.md)
- [Circuit diagram index](./Circuit%20Diagrams/README.md)
- [Evidence index](./Evidence/README.md)
- [Prototype photo index](./Evidence/Photos/README.md)
- [Demonstration video index](./Evidence/Videos/README.md)
- [Original assignment specification](./Original%20Documents/ENG1013%20Traffic%20System%20Project%20Specification.pdf)
- [Redacted Milestone 1 System Design Document](./Original%20Documents/TeamF16%20Milestone%201%20System%20Design%20Document%20-%20Redacted.pdf)

## Next Portfolio Updates

- Add viva/reflection notes after Milestone 3 is complete.
- Update this folder from ongoing to complete once final marking evidence and reflection artifacts are available.
