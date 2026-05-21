# Engineering Design Brief - ENG1013 Assignment (ONGOING)

## Context

ENG1013 asks student teams to design, build, and demonstrate a simplified smart traffic-control safety system based on the Blackwall Tunnel southern approach. The system models the problem of over-height vehicles approaching a tunnel with a fixed height limit and requiring safe diversion, warning, and fail-safe behaviour.

## Design Objective

Design and implement an Arduino-linked traffic-control prototype that detects over-height vehicles, manages traffic and pedestrian lights, provides an exit path before the tunnel, confirms unsafe vehicles at the tunnel entrance, and triggers a hardware-only failure alert if the tunnel-height detection subsystem loses power.

## Intended Users

- Demonstrators assessing whether the prototype meets the official subsystem requirements.
- Team members integrating software, wiring, circuit diagrams, and hardware evidence.
- Future portfolio reviewers evaluating systems thinking, planning, implementation discipline, and technical communication.

## Requirements

- Use ultrasonic sensors to detect vehicle height and vehicle presence.
- Control red/yellow/green traffic lights, pedestrian lights, warning lights, floodlights, push buttons, buzzers, LDRs, and hardware override circuits.
- Keep the system running until the user exits with KeyboardInterrupt.
- Shut down cleanly by turning off pins and closing Arduino communication.
- Use the allowed Python 3.10.x package set and Pymata4-based Arduino communication.
- Provide circuit diagrams for every demonstrated feature.
- Submit code in Python files with no spaces in filenames.
- Demonstrate the physical system in person, with backup video evidence if required.

## Constraints

- Hardware must come from supplied team kits, plus permitted single-core wire and additional breadboards.
- Maximum integration marks require one Arduino and one code launch point.
- The official test case considers a single vehicle passing through the system.
- The Failure Alert Subsystem must be hardware-only and electrically controlled.
- Generative AI use must be declared for Milestones 1 and 2, and is not permitted for the Milestone 3 reflection task.

## Current Outcome

Milestone 1 produced the planning package: system interaction block diagram, high-level flowcharts, feature selections, proposed schedule, communication plan, conflict resolution plan, and meeting-minutes template. The latest implementation evidence adds Python source snapshots, wiring notes, exported circuit diagrams, prototype photos, and demonstration videos from the working traffic-control system. The project remains ongoing because final viva/reflection evidence is still future work.

## Planned Build Direction

- Preserve the final integrated build evidence against the official feature IDs.
- Keep circuit diagrams, wiring notes, code, photos, and video evidence aligned for later viva discussion.
- Continue refining toward the cleanest single-launch system where hardware and time constraints allow.
- Keep feature IDs traceable from the specification to code, circuit diagrams, and demonstration evidence.
- Preserve build evidence in this portfolio as each milestone is completed.

## Skills Demonstrated

- Requirement extraction
- Systems engineering decomposition
- Arduino and Python planning
- Arduino and Python implementation
- Pymata4-based hardware control planning
- Pymata4-based hardware control implementation
- Ultrasonic sensing and traffic-light sequencing
- LDR-based day/night detection
- Flowchart design
- Block diagram communication
- Circuit documentation
- Physical prototype integration
- Demonstration evidence capture
- Project scheduling
- Team communication planning
- Conflict resolution planning
- Portfolio evidence curation
