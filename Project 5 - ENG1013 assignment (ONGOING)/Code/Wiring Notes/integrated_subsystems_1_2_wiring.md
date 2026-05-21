# Full Step-by-step Wiring Guide

This guide builds subsystem 1 and subsystem 2 on one Arduino UNO using the code in `integrated_subsystems_1_2.py`.

## 1. What You Are Building

Subsystem 1 chosen features:

- `1.R1`: US1 prints an over-height alert with vehicle height and date/time.
- `1.R2`: US1 triggers TL1 yellow for 1 second, red for 30 seconds, then green.
- `1.R3`: US2 triggers TL2 only if US1 recently saw the same vehicle, otherwise TL1 and TL2 both respond.
- `1.R4`: The code asks for an over-height limit, defaulting to 4.0 m.
- `1.G1`: WL1 yellow warning LEDs alternate at 2-5 Hz while TL1 or TL2 is not green.
- `1.G4`: US1 and US2 are filtered with moving averages.

Subsystem 2 chosen features:

- `2.R1`: PB1/PB2 trigger the pedestrian sequence after a 2 second wait.
- `2.R2`: Each accepted pedestrian request is printed once.
- `2.R3`: TL4/TL5 run a normal 20 second / 10 second cycle.
- `2.G1`: After a successful pedestrian sequence, there is a 30 second lockout.
- `2.G2`: PL1/PL2 red flashing is produced by a hardware 555 timer circuit.
- `2.G3`: DS2 changes TL4/TL5 timings at night.
- `2.I1`: US5 forces TL4/TL5 red and PL1/PL2 green while the over-height exit is occupied.

Important: `2.I1` uses US5 from subsystem 3 as an input only. This build does not include TL6, DS1, FL1, or FL2.

## 2. Parts Needed

The exact one-breadboard integrated build needs more than one of some kit parts. The project spec allows your team to combine kit components.

Minimum parts:

- 1 Arduino UNO compatible ATmega328 board.
- 1 Type-B USB cable.
- 1 830 point breadboard.
- 1 breadboard power supply module and 9 V DC jack supply, or USB/Arduino 5 V power.
- 3 HC-SR04 ultrasonic sensors: US1, US2, US5.
- 3 74HC595 shift registers.
- 1 NE556 dual 555 timer IC.
- 2 pushbutton switches: PB1, PB2.
- 1 LDR 5516: DS2.
- 6 red LEDs: TL1 red, TL2 red, TL4 red, TL5 red, PL1 red, PL2 red.
- 6 yellow LEDs: TL1 yellow, TL2 yellow, TL4 yellow, TL5 yellow, WL1 LED 1, WL1 LED 2.
- 6 green LEDs: TL1 green, TL2 green, TL4 green, TL5 green, PL1 green, PL2 green.
- 18 LED resistors. Use 1 kOhm if possible to keep 74HC595 current low.
- 3 x 100 nF capacitors for shift-register decoupling.
- 2 x 100 kOhm resistors for the NE556 flashing circuit.
- 1 x 4.7 uF electrolytic capacitor for the NE556 flashing circuit.
- 1 x 10 nF ceramic capacitor for the NE556 control pin.
- 1 x 10 kOhm resistor for DS2.
- 2 x 10 kOhm resistors for PB1/PB2 pull-ups.
- 2 x 100 nF capacitors for PB1/PB2 hardware debounce.
- 2 x 1N4007 diodes for combining solid red and flashing red pedestrian outputs.
- Red/black power wires and blue/yellow signal wires.

Not used by this chosen feature set:

- Buzzer, thermistor, potentiometer, RGB LED, TL074 op-amp, 2N7000 FET, slide switch, blue LED.

## 3. Arduino Pin Map

| Arduino pin | Connects to |
| --- | --- |
| D2 | 74HC595 register A `SER` / data, pin 14 |
| D3 | All 74HC595 `RCLK/STCP` / latch pins, pin 12 |
| D4 | All 74HC595 `SRCLK/SHCP` / clock pins, pin 11 |
| D5 | US1 trigger |
| D6 | US1 echo |
| D7 | US2 trigger |
| D8 | US2 echo |
| D9 | PB1 debounced signal |
| D10 | PB2 debounced signal |
| D11 | US5 trigger |
| D12 | US5 echo |
| A0 | DS2 LDR voltage divider output |
| GND | Breadboard ground rail |

## 4. Shift Register Output Map

Register A is nearest to the Arduino. Register C is furthest from the Arduino.

| Code output | Shift register output | Component |
| --- | --- | --- |
| 0 | Register A Q0, pin 15 | TL1 red |
| 1 | Register A Q1, pin 1 | TL1 yellow |
| 2 | Register A Q2, pin 2 | TL1 green |
| 3 | Register A Q3, pin 3 | TL2 red |
| 4 | Register A Q4, pin 4 | TL2 yellow |
| 5 | Register A Q5, pin 5 | TL2 green |
| 6 | Register A Q6, pin 6 | WL1 yellow LED 1 |
| 7 | Register A Q7, pin 7 | WL1 yellow LED 2 |
| 8 | Register B Q0, pin 15 | TL4 red |
| 9 | Register B Q1, pin 1 | TL4 yellow |
| 10 | Register B Q2, pin 2 | TL4 green |
| 11 | Register B Q3, pin 3 | TL5 red |
| 12 | Register B Q4, pin 4 | TL5 yellow |
| 13 | Register B Q5, pin 5 | TL5 green |
| 14 | Register B Q6, pin 6 | PL1/PL2 solid red path |
| 15 | Register B Q7, pin 7 | PL1/PL2 green |
| 16 | Register C Q0, pin 15 | NE556 reset/enable for PL flashing red |

Outputs 17-23 on register C are not used.

## 5. Before Wiring

1. Disconnect the Arduino USB cable and the 9 V power supply.
2. Put the breadboard horizontally with the power rails along the top and bottom.
3. If the power rails are split in the middle, bridge the left and right red rails together and bridge the left and right blue/black rails together.
4. Choose one rail as `+5 V` and one rail as `GND`.
5. Use red wires only for `+5 V` and black wires only for `GND`.
6. Keep signal wires blue/yellow so the circuit is easier to debug.

## 6. Power Setup

Recommended method with the breadboard power module:

1. Insert the breadboard power module at one end of the breadboard.
2. Set both power-module jumpers to `5V`.
3. Connect the 9 V DC jack supply to the power module.
4. Do not turn it on yet.
5. Connect Arduino `GND` to the breadboard `GND` rail.
6. Do not connect Arduino `5V` to the breadboard `+5 V` rail when the power module is powering the rail.

Alternative USB-only method:

1. Do not use the breadboard power module.
2. Connect Arduino `5V` to the breadboard `+5 V` rail.
3. Connect Arduino `GND` to the breadboard `GND` rail.

Only use one 5 V source for the breadboard rail.

## 7. Place the ICs

1. Place the three 74HC595 ICs across the centre gap of the breadboard.
2. Put them in a row from left to right: register A, register B, register C.
3. Make sure each notch or dot faces the same direction.
4. Place the NE556 across the centre gap after register C.
5. Make sure the NE556 notch or dot is visible so pin 1 is identifiable.

## 8. Wire the 74HC595 Power Pins

For each 74HC595:

1. Pin 16 -> `+5 V`.
2. Pin 8 -> `GND`.
3. Pin 10 `SRCLR/MR` -> `+5 V`.
4. Pin 13 `OE` -> `GND`.
5. Put one 100 nF capacitor between pin 16 and pin 8. Place it physically close to the IC.

## 9. Wire the 74HC595 Arduino Control Pins

1. Arduino D2 -> register A pin 14 `SER`.
2. Arduino D3 -> register A pin 12 `RCLK/STCP`.
3. Arduino D3 -> register B pin 12.
4. Arduino D3 -> register C pin 12.
5. Arduino D4 -> register A pin 11 `SRCLK/SHCP`.
6. Arduino D4 -> register B pin 11.
7. Arduino D4 -> register C pin 11.

## 10. Daisy-chain the 74HC595 Registers

1. Register A pin 9 `Q7'` -> register B pin 14 `SER`.
2. Register B pin 9 `Q7'` -> register C pin 14 `SER`.
3. Register C pin 9 can be left unconnected.

## 11. Wire TL1 LEDs

Use one resistor per LED.

1. Register A Q0 pin 15 -> 1 kOhm resistor -> TL1 red LED long leg.
2. TL1 red LED short leg -> `GND`.
3. Register A Q1 pin 1 -> 1 kOhm resistor -> TL1 yellow LED long leg.
4. TL1 yellow LED short leg -> `GND`.
5. Register A Q2 pin 2 -> 1 kOhm resistor -> TL1 green LED long leg.
6. TL1 green LED short leg -> `GND`.

## 12. Wire TL2 LEDs

1. Register A Q3 pin 3 -> 1 kOhm resistor -> TL2 red LED long leg.
2. TL2 red LED short leg -> `GND`.
3. Register A Q4 pin 4 -> 1 kOhm resistor -> TL2 yellow LED long leg.
4. TL2 yellow LED short leg -> `GND`.
5. Register A Q5 pin 5 -> 1 kOhm resistor -> TL2 green LED long leg.
6. TL2 green LED short leg -> `GND`.

## 13. Wire WL1 Warning LEDs

1. Register A Q6 pin 6 -> 1 kOhm resistor -> WL1 yellow LED 1 long leg.
2. WL1 yellow LED 1 short leg -> `GND`.
3. Register A Q7 pin 7 -> 1 kOhm resistor -> WL1 yellow LED 2 long leg.
4. WL1 yellow LED 2 short leg -> `GND`.

## 14. Wire TL4 LEDs

1. Register B Q0 pin 15 -> 1 kOhm resistor -> TL4 red LED long leg.
2. TL4 red LED short leg -> `GND`.
3. Register B Q1 pin 1 -> 1 kOhm resistor -> TL4 yellow LED long leg.
4. TL4 yellow LED short leg -> `GND`.
5. Register B Q2 pin 2 -> 1 kOhm resistor -> TL4 green LED long leg.
6. TL4 green LED short leg -> `GND`.

## 15. Wire TL5 LEDs

1. Register B Q3 pin 3 -> 1 kOhm resistor -> TL5 red LED long leg.
2. TL5 red LED short leg -> `GND`.
3. Register B Q4 pin 4 -> 1 kOhm resistor -> TL5 yellow LED long leg.
4. TL5 yellow LED short leg -> `GND`.
5. Register B Q5 pin 5 -> 1 kOhm resistor -> TL5 green LED long leg.
6. TL5 green LED short leg -> `GND`.

## 16. Wire PL1/PL2 Green LEDs

PL1 and PL2 green turn on together from one shift-register output. Give each LED its own resistor.

1. Register B Q7 pin 7 -> 1 kOhm resistor -> PL1 green LED long leg.
2. PL1 green LED short leg -> `GND`.
3. Register B Q7 pin 7 -> second 1 kOhm resistor -> PL2 green LED long leg.
4. PL2 green LED short leg -> `GND`.

## 17. Wire the NE556 Power and Unused Half

The NE556 contains two 555 timers. This build uses timer 1 only.

1. NE556 pin 14 -> `+5 V`.
2. NE556 pin 7 -> `GND`.
3. Disable unused timer 2: NE556 pin 10 -> `GND`.
4. NE556 pin 8 -> `GND`.
5. NE556 pin 12 -> `GND`.
6. Leave NE556 pins 9 and 13 unconnected.

## 18. Build the NE556 Flashing Timer for 2.G2

This creates the PL flashing red signal.

1. Tie NE556 pins 2 and 6 together.
2. NE556 pin 1 -> 100 kOhm resistor -> `+5 V`.
3. NE556 pin 1 -> second 100 kOhm resistor -> tied pins 2 and 6.
4. Tied pins 2 and 6 -> 4.7 uF capacitor positive leg.
5. 4.7 uF capacitor negative leg -> `GND`.
6. NE556 pin 3 -> 10 nF capacitor -> `GND`.
7. Register C Q0 pin 15 -> NE556 pin 4 `RESET`.
8. NE556 pin 5 is the flashing output.

Approximate flash rate is about 1 Hz using 100 kOhm, 100 kOhm, and 4.7 uF.

## 19. Wire PL1/PL2 Red LEDs with Diode Isolation

The pedestrian red LEDs need two sources:

- Solid red from register B Q6.
- Flashing red from NE556 pin 5.

Do not directly connect those two outputs together. Use two 1N4007 diodes.

1. Register B Q6 pin 6 -> diode 1 anode.
2. NE556 pin 5 -> diode 2 anode.
3. Join diode 1 cathode and diode 2 cathode at one breadboard row. This is the `PL red drive node`.
4. PL red drive node -> 1 kOhm resistor -> PL1 red LED long leg.
5. PL1 red LED short leg -> `GND`.
6. PL red drive node -> second 1 kOhm resistor -> PL2 red LED long leg.
7. PL2 red LED short leg -> `GND`.

The diode cathode is the striped end of the 1N4007.

## 20. Wire US1

US1 is the first approach height sensor.

1. US1 `VCC` -> `+5 V`.
2. US1 `GND` -> `GND`.
3. US1 `TRIG` -> Arduino D5.
4. US1 `ECHO` -> Arduino D6.
5. Mount US1 facing down toward the model road.

## 21. Wire US2

US2 is the second approach height sensor.

1. US2 `VCC` -> `+5 V`.
2. US2 `GND` -> `GND`.
3. US2 `TRIG` -> Arduino D7.
4. US2 `ECHO` -> Arduino D8.
5. Mount US2 downstream from US1.

## 22. Wire US5 for the 2.I1 Integration Input

US5 detects an over-height vehicle at the exit lane.

1. US5 `VCC` -> `+5 V`.
2. US5 `GND` -> `GND`.
3. US5 `TRIG` -> Arduino D11.
4. US5 `ECHO` -> Arduino D12.
5. Mount US5 so a model vehicle in the exit lane gives a close reading, for example under 15 cm.

## 23. Wire DS2 LDR

This divider matches the code assumption that darker light gives a lower A0 value.

1. `+5 V` -> one LDR leg.
2. Other LDR leg -> DS2 signal row.
3. DS2 signal row -> Arduino A0.
4. DS2 signal row -> 10 kOhm resistor.
5. Other side of the 10 kOhm resistor -> `GND`.

## 24. Wire PB1 with Hardware Debounce

PB1 is active-low.

1. Choose a row as the PB1 signal row.
2. PB1 signal row -> Arduino D9.
3. PB1 signal row -> 10 kOhm resistor -> `+5 V`.
4. PB1 signal row -> 100 nF capacitor -> `GND`.
5. PB1 signal row -> one side of PB1.
6. Other side of PB1 -> `GND`.

When PB1 is not pressed, D9 reads HIGH. When pressed, D9 reads LOW.

## 25. Wire PB2 with Hardware Debounce

PB2 is active-low.

1. Choose a row as the PB2 signal row.
2. PB2 signal row -> Arduino D10.
3. PB2 signal row -> 10 kOhm resistor -> `+5 V`.
4. PB2 signal row -> 100 nF capacitor -> `GND`.
5. PB2 signal row -> one side of PB2.
6. Other side of PB2 -> `GND`.

## 26. Pre-power Checks with the Multimeter

Do these before plugging in USB or 9 V power.

1. Set the multimeter to continuity mode.
2. Check that `+5 V` and `GND` are not shorted.
3. Check every IC has the correct power pins:
   - 74HC595 pin 16 to `+5 V`.
   - 74HC595 pin 8 to `GND`.
   - NE556 pin 14 to `+5 V`.
   - NE556 pin 7 to `GND`.
4. Check each LED short leg goes to `GND`.
5. Check each LED long leg is connected through a resistor, not directly to a shift register output.
6. Check the striped ends of the two PL red diodes meet at the PL red drive node.

## 27. First Power-on

1. Connect the Arduino to the computer using the Type-B USB cable.
2. If using the breadboard power module, turn on the 9 V supply and confirm the rail is 5 V with the multimeter.
3. Confirm Arduino GND and breadboard GND are connected.
4. Upload StandardFirmata to the Arduino if Pymata4 has not already been set up.
5. Run:

```bash
python integrated_subsystems_1_2.py
```

6. At the prompt, press Enter to use the 4.0 m over-height default.

## 28. Calibration

### US1 and US2 height scaling

1. Measure the empty-road distance from US1 to the model road surface.
2. Put that value into `heightSensorRoadDistanceCm`.
3. Decide what real-world height the model sensor mounting represents.
4. Put that value into `heightSensorMountHeightM`.
5. Example: if the sensor is 50 cm above the model road and that represents 5.0 m, keep:

```python
heightSensorRoadDistanceCm = 50.0
heightSensorMountHeightM = 5.0
```

### US5 exit detection

1. Place no vehicle in front of US5.
2. Place the vehicle in the exit lane.
3. Set `us5TriggerDistanceCm` between those two readings.
4. Set `us5ClearDistanceCm` slightly higher than `us5TriggerDistanceCm`.

### DS2 day/night threshold

1. Run the program and note the DS2 A0 value in bright light.
2. Cover DS2 and note the dark value.
3. Set `ds2NightThreshold` between those readings.
4. With the wiring in this guide, dark should be the lower value.

## 29. Expected Tests

### Subsystem 1 tests

1. Trigger US1 with an over-height model.
2. Confirm the console prints the height and date/time.
3. Confirm TL1 goes yellow for 1 second, red for 30 seconds, then green.
4. Confirm WL1 alternates while TL1 is not green.
5. Trigger US2 shortly after US1 and confirm only TL2 runs its sequence.
6. Trigger US2 without recent US1 detection and confirm TL1 and TL2 both run.

### Subsystem 2 tests

1. Let the system idle and confirm TL4/TL5 run the normal cycle.
2. Press PB1 or PB2 once.
3. Confirm the console prints one pedestrian request.
4. Confirm the program waits 2 seconds.
5. Confirm TL4 or TL5 is stopped safely, then PL1/PL2 turn green for 3 seconds.
6. Confirm PL1/PL2 red flashes from the NE556 for 2 seconds.
7. Confirm PL1/PL2 return to solid red and TL4 returns green.
8. Press PB1/PB2 again during the next 30 seconds and confirm the request is ignored during lockout.
9. Cover DS2 and confirm night mode changes TL4 to 30 seconds green and TL5 to 5 seconds green.

### Integration test for 2.I1

1. Put a model vehicle in front of US5.
2. Confirm TL4 and TL5 are forced to red, using yellow first if either was not already red.
3. Confirm PL1/PL2 turn green while US5 still detects the vehicle.
4. Remove the vehicle from US5.
5. Confirm PL1/PL2 flash red for 2 seconds, return to solid red, and the TL4/TL5 cycle resumes with TL4 green.

## 30. Common Faults

- If no LEDs work, check the 74HC595 latch, clock, data, power, `OE`, and `SRCLR` pins.
- If outputs appear on the wrong LEDs, the shift-register chain order is probably reversed.
- If PL red never flashes, check NE556 pin 4 reset is connected to register C Q0.
- If PL red flashes but solid red does not work, check the diode from register B Q6.
- If buttons always read pressed, check the 10 kOhm pull-up and button-to-ground wiring.
- If DS2 day/night is backwards, swap the LDR and 10 kOhm resistor positions or reverse the code threshold comparison.
- If ultrasonic readings are unstable, check every sensor has 5 V and common GND.
