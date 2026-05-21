# ENG1013 Subsystem 3 Wiring Instructions

These instructions match `subsystem3_overheight_exit.py`.

## Features Built

- `3.R1`: US5 triggers TL6 green -> yellow -> red.
- `3.R2`: TL6 stays green if US5 still detects the vehicle after the base green time.
- `3.G2`: US5 uses a moving average filter in software.
- `3.G3`: FL1 and FL2 turn on at night while US5 detects a vehicle.
- `3.G4`: DS1 changes TL6 green time from 5 seconds to 10 seconds at night.
- `3.G1` is intentionally excluded.

## Pin Map

| Component | Arduino pin |
| --- | --- |
| US5 trigger | D6 |
| US5 echo | D7 |
| TL6 red LED | D8 |
| TL6 yellow LED | D9 |
| TL6 green LED | D10 |
| FL1 white LED | D11 |
| FL2 white LED | D12 |
| DS1 LDR divider output | A0 |
| 5 V rail | Arduino 5V |
| Ground rail | Arduino GND |

## Parts

- 1 Arduino running the Firmata sketch used for Pymata4.
- 1 breadboard.
- 1 HC-SR04 ultrasonic sensor for `US5`.
- 1 LDR for `DS1`.
- 1 10 kOhm resistor for the LDR voltage divider.
- 1 red LED, 1 yellow LED, and 1 green LED for `TL6`.
- 2 white LEDs for `FL1` and `FL2`.
- 5 current-limiting resistors for the LEDs, normally 220 Ohm to 330 Ohm.
- Jumper wires.

## Step-by-step Build

1. Connect Arduino `5V` to the breadboard positive rail.
2. Connect Arduino `GND` to the breadboard ground rail.
3. Build `TL6` red:
   - Arduino `D8` -> 220 Ohm resistor -> red LED long leg/anode.
   - Red LED short leg/cathode -> ground rail.
4. Build `TL6` yellow:
   - Arduino `D9` -> 220 Ohm resistor -> yellow LED long leg/anode.
   - Yellow LED short leg/cathode -> ground rail.
5. Build `TL6` green:
   - Arduino `D10` -> 220 Ohm resistor -> green LED long leg/anode.
   - Green LED short leg/cathode -> ground rail.
6. Build `FL1`:
   - Arduino `D11` -> 220 Ohm resistor -> white LED long leg/anode.
   - White LED short leg/cathode -> ground rail.
7. Build `FL2`:
   - Arduino `D12` -> 220 Ohm resistor -> white LED long leg/anode.
   - White LED short leg/cathode -> ground rail.
8. Wire `US5`:
   - `VCC` -> 5 V rail.
   - `GND` -> ground rail.
   - `TRIG` -> Arduino `D6`.
   - `ECHO` -> Arduino `D7`.
9. Place `US5` so it sees the exit lane. A simple model setup is to aim it sideways across the lane so a vehicle passing through gives a much smaller distance than an empty lane.
10. Wire `DS1` so darker light gives a lower A0 reading:
   - 5 V rail -> one LDR leg.
   - Other LDR leg -> junction row.
   - Junction row -> Arduino `A0`.
   - Junction row -> 10 kOhm resistor.
   - Other side of 10 kOhm resistor -> ground rail.
11. Check LED polarity before powering the Arduino. The longer LED leg normally goes toward the Arduino output pin through the resistor; the shorter leg goes to ground.
12. Upload the Firmata sketch required by Pymata4 to the Arduino.
13. Run `python subsystem3_overheight_exit.py`.

## Calibration

1. Watch the console while US5 has no vehicle in front of it, then place the model vehicle in the exit lane.
2. In `subsystem3_overheight_exit.py`, set `exitLaneTriggerDistanceCm` between the empty-lane distance and the vehicle-present distance. Example: empty lane around 40 cm and vehicle around 8 cm means a threshold around 15 cm is sensible.
3. Set `exitLaneClearDistanceCm` slightly higher than `exitLaneTriggerDistanceCm`, for example 18 cm if the trigger value is 15 cm.
4. Watch the console with DS1 uncovered and then covered.
5. Set `nightLdrThreshold` between the bright reading and the covered/dark reading. With the wiring above, darker light gives a lower analog value.

## Expected Behaviour

- Day + vehicle: TL6 green for 5 seconds, hold green if the vehicle remains, yellow for 3 seconds, then red.
- Night + vehicle: FL1 and FL2 turn on, TL6 green for 10 seconds, hold green if the vehicle remains, yellow for 3 seconds, then red.
- When US5 clears: FL1 and FL2 turn off.
