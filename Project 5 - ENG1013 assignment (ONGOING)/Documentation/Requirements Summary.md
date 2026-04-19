# Requirements Summary

This summary condenses the key information from the ENG1013 Traffic System Project Specification v11.1.1 2026.

## Mission

Design, build, and demonstrate a simplified smart traffic-control safety system for the Blackwall Tunnel southern approach. The system must reduce over-height vehicle collision risk by detecting vehicle height, warning drivers, controlling traffic and pedestrian lights, directing over-height vehicles to an exit path, and failing safely when tunnel-height detection loses power.

## System Context

The model is based on the A102 freeway approach, Tunnel Ave, an over-height exit, and the tunnel entrance. The tunnel limit defaults to 4.0 m. US1 and US2 are expected to measure actual vehicle height, while later sensors are mainly required to detect over-height vehicle presence.

## Project Restrictions

- Hardware must come from the team's supplied kits, plus single-core wire and additional breadboards.
- Maximum integration marks require one Arduino and one code launch point.
- Multiple Arduinos may be used only if the team is not targeting full integration marks, and only one can be active at once.
- Software must use Python 3.10.x.
- Supported packages are Pymata4, Time, Math, Matplotlib, and Random.
- NumPy and CSV are permitted but unsupported by demonstrators.
- Other packages, classes, and assert statements are not permitted for marking.
- Generative AI must be declared in a PDF for Milestones 1 and 2.
- Generative AI is not permitted for the Milestone 3 reflection task.

## Milestone 1

Milestone 1 is the design and planning stage, worth 80 points. It is due at the end of Week 5 on Friday at 11:55pm.

Required submissions:

- TeamNNN-M1_AIDeclaration.pdf
- TeamNNN-M1_SDD.pdf

The System Design Document must include:

- System interaction block diagram.
- High-level software flowcharts with hardware interactions.
- Proposed project timeline.
- Communications plan.
- Conflict resolution plan.

Point weighting:

- System interaction block diagram: 20 points.
- High-level flowcharts: 30 points.
- Proposed timeline: 10 points.
- Communications plan: 10 points.
- Conflict resolution plan: 10 points.

## Milestone 2

Milestone 2 is the build, submission, and demonstration stage, worth 180 points. Submission is due at the end of Week 10 on Friday at 11:55pm, with demonstration in Week 11.

The submission must be a single TeamNNN-M2.zip containing:

- TeamNNN-M2_AIDeclaration.pdf.
- circuit_diagrams.pdf.
- Python source files with no spaces in filenames.
- backup_video_url.txt.

Point weighting:

- Required features across the five subsystems: 80 points.
- Selected general and integration features: 80 points.
- Full system integration on one Arduino and one code launch point: 20 points.

Feature marking:

- Fully functional demonstration: 100% of available feature points.
- Worked in submitted backup video but failed live: 66%.
- Can explain how to fix a non-working feature: 33%.
- Required feature not attempted: 33% deduction.
- Attempted but not working and cannot explain: 0%.

## Milestone 3

Milestone 3 includes the reflection task and viva process. Reflection is due at the end of Week 11 and the viva occurs in Week 12.

The reflection quiz is required before the viva. Students must submit team meeting minutes through the quiz and cannot use generative AI for the reflection task. Viva performance confirms each student's understanding of the code and circuits. Missing the viva results in no project marks.

## Mark Scaling

The project is graded out of 260 points and contributes to 26% of ENG1013 after scaling. Individual scaling uses the third ITP Metrics peer assessment score and the viva interview score at 50% weighting each.

## Subsystems

### Subsystem 1 - Approach Height Detection

Primary over-height detection using US1 and US2. It controls TL1 and TL2, warning lights WL1, and buzzer PA1. It includes height configuration, console alerts, light sequencing, warning flashes, and optional integration with the exit subsystem.

### Subsystem 2 - Tunnel Ave Control

Traffic and pedestrian control for Tunnel Ave using TL4, TL5, PL1, PL2, PB1, PB2, and DS2. It includes pedestrian crossing sequences, debouncing, 20/10 second traffic light cycling, day/night timing, and integration with US5 vehicle detection.

### Subsystem 3 - Over-height Exit

Exit-route control using US5, TL6, DS1, and floodlights FL1/FL2. It lets detected over-height vehicles exit, extends green timing while a vehicle remains present, filters sensor data, and can adjust night behaviour.

### Subsystem 4 - Tunnel Height Detection

Final over-height detection at the tunnel entrance using US3, US4, TL3, and WL2. It supports sensor verification, configurable height limits, red warning light flashing, and overrides for earlier subsystems.

### Subsystem 5 - Failure Alert

Hardware-only power failure response using an external battery supply, override switch OS1, PA2 speaker, comparator op-amp logic, and red-light overrides. It must not be powered from Arduino pins.
