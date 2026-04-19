# Milestone 1 Summary

This summary extracts the key portfolio-relevant information from Team F16's Milestone 1 System Design Document. Public copies redact student IDs, staff email details, and individual team member names.

## Submitted Artifact

Team F16 produced a System Design Document with the following sections:

- System interaction block diagram.
- High-level flowcharts.
- Proposed timeline.
- Communications plan.
- Conflict resolution plan.
- Meeting-minutes template.

## System Interaction Block Diagram

The block diagram maps the laptop and Arduino at the centre of the system, then connects the major traffic-control hardware grouped by subsystem:

- Approach Height Detection: WL1, PA1, TL1, TL2, US1, and US2.
- Tunnel Ave Control: PL1, PL2, PB1, PB2, TL4, TL5, and DS2.
- Over-height Exit: DS1, TL6, US5, FL1, and FL2.
- Tunnel Height Detection: TL3, US3, US4, and WL2.
- Failure Alert: override switch OS1, failure detection, light override circuits, light pattern generation, tone generation, external battery supply, and PA2.

## Chosen Features

### Subsystem 1 - Approach Height Detection

Selected features:

- 1.R1
- 1.R2
- 1.R3
- 1.R4
- 1.G1
- 1.G4

Flowchart summary:

- Prompt for the over-height limit, defaulting to 4.0 m.
- Initialise components and default states.
- Read US1 and US2.
- Filter US1 and US2 data with a moving average filter.
- If US1 detects an over-height vehicle, flash WL1 and print an alert with date/time and measured height, then run the TL1 sequence.
- If US2 detects an over-height vehicle, decide whether it is the same vehicle and run the relevant TL1/TL2 sequence.
- Turn WL1 off once TL1 and TL2 return to green.

### Subsystem 2 - Tunnel Ave Control

Selected features:

- 2.R1
- 2.R2
- 2.R3
- 2.G1
- 2.G2
- 2.G3
- 2.I1

Flowchart summary:

- Initialise components and continue the normal TL4/TL5 cycle.
- Update pedestrian lockout state.
- Use US5 integration data from Subsystem 3 to force TL4/TL5 red and allow exit movement if required.
- Read DS2 to determine day/night timing.
- Read PB1/PB2, with hardware debouncing.
- Print pedestrian request once.
- Run the pedestrian crossing sequence and apply a 30-second lockout before the next successful request.

### Subsystem 3 - Over-height Exit

Selected features:

- 3.R1
- 3.R2
- 3.G2
- 3.G3
- 3.G4

Flowchart summary:

- Initialise components.
- Read DS1 and US5.
- Filter US5 data with a moving average filter.
- If US5 detects an over-height vehicle, check night conditions.
- Use DS1 to control night floodlights and green timing.
- Set TL6 green, keep it green while required, then switch through yellow and back to red once the vehicle has exited.

### Subsystem 4 - Tunnel Height Detection

Selected features:

- 4.R1
- 4.R2
- 4.R3
- 4.G1
- 4.G2
- 4.I1

Flowchart summary:

- Prompt for a height limit, defaulting to 4.0 m.
- Read US3 and US4.
- Confirm over-height detection using both sensors.
- Set TL3 red and enable WL2 flashing.
- Override Subsystem 1 by setting TL1 and TL2 red, sounding PA1, and flashing WL1.
- Reset TL3 and release overrides once the over-height state ends.

### Subsystem 5 - Failure Alert

Selected features:

- 5.R1
- 5.G1
- 5.G2
- 5.G3
- 5.I1

The SDD notes that no high-level flowchart is included for Subsystem 5 because it is hardware-only.

## Timeline

The proposed timeline assigns work across March, April, and May. Milestone 1 planning tasks are marked complete. Later work is scheduled around:

- Core feature programming.
- General feature programming.
- Core feature wiring.
- General feature wiring.
- Circuit diagrams.
- A demonstrator check-in.

The public timeline screenshot redacts individual names while preserving the schedule structure.

## Communications Plan

Communication methods:

- Primary: group chat for attendance updates, workload distribution, meeting organisation, and general project communication.
- Secondary: email for detailed information and better record keeping.
- Backup: SMS when someone is not responding through the primary or secondary method.

Meeting expectations:

- Meet outside practical class time, especially near submission dates.
- Meet at least fortnightly, increasing frequency as due dates approach.
- Keep meeting minutes recording dates, attendance, discussions, decisions, and action items.

Response expectations:

- Standard weeks: respond within 24 hours where possible.
- Submission week: respond on the same day if the message is sent before 8:00pm.
- Final 2 to 3 days before a milestone: respond ideally within 3 hours where possible.
- Submission day: actively communicate until submission is complete.

## Conflict Resolution Plan

Conflict avoidance and resolution covers:

- Group discussion and voting for major decisions.
- Subsystem lead decision-making if consensus is not possible.
- Feedback, correction deadlines, peer review, and possible task reassignment for low-quality work.
- New deadlines or reassignment for incomplete work.
- Early notice and revised completion times for late work.
- Reassignment and escalation for repeated lack of participation.

Escalation steps:

1. Direct private communication.
2. Team discussion.
3. Task reallocation or support.
4. Formal escalation to teaching staff.

## Evidence Files

- System interaction block diagram: `Evidence/Screenshots/milestone-1-system-interaction-block-diagram.png`
- Subsystem 1 flowchart: `Evidence/Screenshots/milestone-1-subsystem-1-flowchart.png`
- Subsystem 2 flowchart: `Evidence/Screenshots/milestone-1-subsystem-2-flowchart.png`
- Subsystem 3 flowchart: `Evidence/Screenshots/milestone-1-subsystem-3-flowchart.png`
- Subsystem 4 flowchart: `Evidence/Screenshots/milestone-1-subsystem-4-flowchart.png`
- Subsystem 5 feature selection: `Evidence/Screenshots/milestone-1-subsystem-5-feature-selection.png`
- Proposed timeline: `Evidence/Screenshots/milestone-1-proposed-timeline.png`
