# Full Step-by-step Wiring Guide: Subsystem 2 + Subsystem 3

This guide matches `integrated_subsystems_2_3.py`.

## 1. What This Build Implements

Subsystem 2:

- `2.R1`: PB1/PB2 start the pedestrian crossing sequence after 2 seconds.
- `2.R2`: A valid pedestrian request prints to the console once.
- `2.R3`: TL4/TL5 run the normal 20s/10s traffic cycle.
- `2.G1`: PB1/PB2 use hardware debounce, and a 30s pedestrian lockout is enforced after a successful crossing.
- `2.G2`: PL1/PL2 red flashing is generated with one half of the NE556 timer.
- `2.G3`: DS2 changes TL4/TL5 timings at night.
- `2.I1`: US5 forces TL4/TL5 red and PL1/PL2 green while a vehicle is at the over-height exit.

Subsystem 3:

- `3.R1`: US5 triggers TL6 green, yellow, then red.
- `3.R2`: If US5 still detects the vehicle after the green time, TL6 stays green until US5 clears.
- `3.G2`: US5 is filtered in software with a moving average.
- `3.G3`: DS1 turns FL1/FL2 on at night while US5 detects the vehicle.
- `3.G4`: DS1 changes TL6 green timing from 5s to 10s at night.
- `3.I1`: TL6 waits at least 3s for TL4/TL5 to turn red before turning green.

Not implemented:

- `3.G1`: TL6 flashing green with a 555 timer.

## 2. Parts You Need

This guide uses the parts list you provided and keeps the design to one 74HC595 shift register.

- 1 Arduino UNO compatible ATmega328 controller board.
- 1 Type-B USB cable.
- 1 830 point breadboard.
- Breadboard power supply module and 9 V DC jack, or Arduino USB 5 V power.
- 1 74HC595 shift register.
- 1 NE556 dual 555 timer IC.
- 1 HC-SR04 ultrasonic sensor for US5.
- 2 pushbutton switches for PB1/PB2.
- 2 LDR 5516 photoresistors for DS1/DS2.
- 5 red LEDs: TL4 red, TL5 red, PL1 red, PL2 red, TL6 red.
- 3 yellow LEDs: TL4 yellow, TL5 yellow, TL6 yellow.
- 5 green LEDs: TL4 green, TL5 green, PL1 green, PL2 green, TL6 green.
- 2 white LEDs for FL1/FL2.
- LED resistors. Use 1 kOhm where possible for 74HC595 outputs. 330 Ohm is acceptable for direct Arduino outputs.
- 4 x 10 kOhm resistors preferred: DS1, DS2, PB1 pulldown, PB2 pulldown.
- 2 x 100 nF capacitors for PB1/PB2 hardware debounce.
- 1 x 100 nF capacitor for 74HC595 decoupling.
- 2 x 100 kOhm resistors for the NE556 flash timer.
- 1 x 4.7 uF electrolytic capacitor for the NE556 flash timer.
- 1 x 10 nF ceramic capacitor for the NE556 control pin.
- 2 x 1N4007 diodes for pedestrian red output isolation.
- Red/black power wires and blue/yellow signal wires.

Note: If you only have one physical green pedestrian LED, wire it as the shared PL1/PL2 green output. If you have two green LEDs, connect both to the same output with separate resistors.

## 3. Arduino Pin Map

| Arduino pin | Connection |
| --- | --- |
| D2 | 74HC595 data/SER, pin 14 |
| D3 | 74HC595 latch/RCLK/STCP, pin 12 |
| D4 | 74HC595 clock/SRCLK/SHCP, pin 11 |
| D5 | PB1 active-high debounced signal |
| D6 | PB2 active-high debounced signal |
| D7 | US5 trigger |
| D8 | US5 echo |
| D9 | TL6 red LED |
| D10 | TL6 yellow LED |
| D11 | TL6 green LED through current probe `I1` |
| D12 | FL1 and FL2 white LEDs |
| D13 | NE556 reset/enable for PL red flashing |
| A0 | DS2 LDR output |
| A1 | DS1 LDR output |
| 5V | Breadboard 5 V rail, if not using breadboard power module |
| GND | Breadboard ground rail |

## 4. 74HC595 Output Map

| 74HC595 output | 74HC595 pin | Component |
| --- | --- | --- |
| Q0 | pin 15 | TL4 red |
| Q1 | pin 1 | TL4 yellow |
| Q2 | pin 2 | TL4 green |
| Q3 | pin 3 | TL5 red |
| Q4 | pin 4 | TL5 yellow |
| Q5 | pin 5 | TL5 green |
| Q6 | pin 6 | PL1/PL2 solid red path |
| Q7 | pin 7 | PL1/PL2 green |

## 5. Before You Start

1. Disconnect USB and the 9 V power supply.
2. Put the breadboard horizontally with the centre gap running left to right.
3. If the breadboard power rails are split, bridge the left and right `+` rails together.
4. Bridge the left and right `-` rails together.
5. Use red wires only for 5 V.
6. Use black wires only for GND.
7. Use blue/yellow wires for signal connections.

## 6. Power Setup

Use only one 5 V source.

Option A, breadboard power module:

1. Insert the power module onto the breadboard rails.
2. Set the module output jumpers to 5 V.
3. Connect the 9 V DC jack supply to the module.
4. Connect Arduino GND to the breadboard GND rail.
5. Do not connect Arduino 5V to the breadboard 5 V rail.

Option B, Arduino USB power:

1. Do not power the breadboard power module.
2. Arduino 5V -> breadboard 5 V rail.
3. Arduino GND -> breadboard GND rail.

## 7. Place the ICs

1. Place the 74HC595 across the breadboard centre gap.
2. Place the NE556 across the centre gap nearby.
3. Make sure both IC notches face the same direction.
4. Identify pin 1 from the notch/dot before wiring.

## 8. Wire the 74HC595 Power Pins

1. 74HC595 pin 16 -> 5 V rail.
2. 74HC595 pin 8 -> GND rail.
3. 74HC595 pin 10 `SRCLR/MR` -> 5 V rail.
4. 74HC595 pin 13 `OE` -> GND rail.
5. Put a 100 nF capacitor between pin 16 and pin 8, close to the chip.

## 9. Wire the 74HC595 Control Pins

1. Arduino D2 -> 74HC595 pin 14 `SER`.
2. Arduino D3 -> 74HC595 pin 12 `RCLK/STCP`.
3. Arduino D4 -> 74HC595 pin 11 `SRCLK/SHCP`.
4. Leave 74HC595 pin 9 `Q7'` unconnected.

## 10. Wire TL4

Use one resistor per LED.

1. 74HC595 Q0 pin 15 -> 1 kOhm resistor -> TL4 red LED long leg.
2. TL4 red LED short leg -> GND.
3. 74HC595 Q1 pin 1 -> 1 kOhm resistor -> TL4 yellow LED long leg.
4. TL4 yellow LED short leg -> GND.
5. 74HC595 Q2 pin 2 -> 1 kOhm resistor -> TL4 green LED long leg.
6. TL4 green LED short leg -> GND.

## 11. Wire TL5

1. 74HC595 Q3 pin 3 -> 1 kOhm resistor -> TL5 red LED long leg.
2. TL5 red LED short leg -> GND.
3. 74HC595 Q4 pin 4 -> 1 kOhm resistor -> TL5 yellow LED long leg.
4. TL5 yellow LED short leg -> GND.
5. 74HC595 Q5 pin 5 -> 1 kOhm resistor -> TL5 green LED long leg.
6. TL5 green LED short leg -> GND.

## 12. Wire PL1/PL2 Green

PL1 and PL2 green are controlled together.

1. 74HC595 Q7 pin 7 -> 1 kOhm resistor -> PL1 green LED long leg.
2. PL1 green LED short leg -> GND.
3. If using a second green LED, 74HC595 Q7 pin 7 -> second 1 kOhm resistor -> PL2 green LED long leg.
4. PL2 green LED short leg -> GND.

## 13. Wire the NE556 Power Pins

This build uses timer 1 inside the NE556.

1. NE556 pin 14 -> 5 V rail.
2. NE556 pin 7 -> GND rail.
3. Disable unused timer 2:
   - NE556 pin 10 -> GND.
   - NE556 pin 8 -> GND.
   - NE556 pin 12 -> GND.
   - Leave pins 9 and 13 unconnected.

## 14. Build the NE556 Flashing Timer

This produces the `2.G2` red flashing signal for PL1/PL2.

1. Tie NE556 pins 2 and 6 together.
2. NE556 pin 1 -> 100 kOhm resistor -> 5 V rail.
3. NE556 pin 1 -> second 100 kOhm resistor -> tied pins 2 and 6.
4. Tied pins 2 and 6 -> 4.7 uF capacitor positive leg.
5. 4.7 uF capacitor negative leg -> GND.
6. NE556 pin 3 -> 10 nF capacitor -> GND.
7. Arduino D13 -> NE556 pin 4 `RESET`.
8. NE556 pin 5 is the flashing output.

This gives roughly 1 Hz flashing. The code turns D13 HIGH only during the flashing-red stage.

## 15. Wire PL1/PL2 Red with Diode Isolation

Do not directly join the shift-register solid red output and NE556 flashing output.

1. 74HC595 Q6 pin 6 -> 1N4007 diode 1 anode.
2. NE556 pin 5 -> 1N4007 diode 2 anode.
3. Join both diode cathodes, the striped ends, on one row. This is the `PL red drive node`.
4. PL red drive node -> 1 kOhm resistor -> PL1 red LED long leg.
5. PL1 red LED short leg -> GND.
6. If using a second red LED, PL red drive node -> second 1 kOhm resistor -> PL2 red LED long leg.
7. PL2 red LED short leg -> GND.

## 16. Wire TL6

TL6 is driven directly by the Arduino.

1. Arduino D9 -> 330 Ohm resistor -> TL6 red LED long leg.
2. TL6 red LED short leg -> GND.
3. Arduino D10 -> 330 Ohm resistor -> TL6 yellow LED long leg.
4. TL6 yellow LED short leg -> GND.
5. Do not wire TL6 green directly yet. TL6 green will be wired through the removable current probe point in Section 23.

## 17. Wire FL1 and FL2

FL1 and FL2 turn on together from D12. Each LED needs its own resistor.

1. Arduino D12 -> 330 Ohm resistor -> FL1 white LED long leg.
2. FL1 white LED short leg -> GND.
3. Arduino D12 -> second 330 Ohm resistor -> FL2 white LED long leg.
4. FL2 white LED short leg -> GND.

If the white LEDs are too bright or the Arduino pin becomes warm, use 1 kOhm resistors instead.

## 18. Wire US5

US5 is the shared ultrasonic sensor for subsystem 2 integration and subsystem 3 exit detection.

1. US5 `VCC` -> 5 V rail.
2. US5 `GND` -> GND rail.
3. US5 `TRIG` -> Arduino D7.
4. US5 `ECHO` -> Arduino D8.
5. Mount US5 so a vehicle in the exit lane gives a short distance, for example less than 15 cm.

## 19. Wire DS2 LDR

DS2 controls TL4/TL5 day/night timing.

1. 5 V rail -> one DS2 LDR leg.
2. Other DS2 LDR leg -> DS2 signal row.
3. DS2 signal row -> Arduino A0.
4. DS2 signal row -> 10 kOhm resistor.
5. Other side of the 10 kOhm resistor -> GND.

With this wiring, darker light gives a lower A0 value.

## 20. Wire DS1 LDR

DS1 controls FL1/FL2 and TL6 day/night timing.

1. 5 V rail -> one DS1 LDR leg.
2. Other DS1 LDR leg -> DS1 signal row.
3. DS1 signal row -> Arduino A1.
4. DS1 signal row -> 10 kOhm resistor.
5. Other side of the 10 kOhm resistor -> GND.

With this wiring, darker light gives a lower A1 value.

## 21. Wire PB1 Hardware Debounce

PB1 is active-high, matching your push-down switch circuit.

1. Choose one row as the PB1 signal row.
2. PB1 signal row -> Arduino D5.
3. PB1 signal row -> 10 kOhm resistor -> GND.
4. PB1 signal row -> 100 nF capacitor -> GND.
5. PB1 signal row -> one side of PB1.
6. Other side of PB1 -> 5 V rail.
7. When PB1 is pressed, D5 reads HIGH.

## 22. Wire PB2 Hardware Debounce

PB2 is active-high, matching your push-down switch circuit.

1. Choose one row as the PB2 signal row.
2. PB2 signal row -> Arduino D6.
3. PB2 signal row -> 10 kOhm resistor -> GND.
4. PB2 signal row -> 100 nF capacitor -> GND.
5. PB2 signal row -> one side of PB2.
6. Other side of PB2 -> 5 V rail.
7. When PB2 is pressed, D6 reads HIGH.

## 23. Add the Tall-header Current Probe Point

Use one pair from the tall header row and one 2-pin jumper. This gives you the required removable current probe point.

Place it in series with the TL6 green LED branch:

1. Wire Arduino D11 -> 330 Ohm resistor.
2. 330 Ohm resistor output -> tall header pin 1.
3. Tall header pin 2 -> TL6 green LED long leg.
4. TL6 green LED short leg -> GND.
5. Put a 2-pin jumper across tall header pins 1 and 2 for normal operation.
6. Label this probe point `I1 = TL6 green LED current probe`.

To measure current:

1. Turn power off.
2. Move the multimeter red probe to the current socket.
3. Set the multimeter to current mode.
4. Remove the 2-pin jumper from `I1`.
5. Touch one probe to tall header pin 1 and the other probe to tall header pin 2, replacing the jumper with the meter.
6. Turn power on and run the TL6 green state.
7. Turn power off before putting the jumper back.

Do not put the current meter directly across 5 V and GND.

## 24. Pre-power Multimeter Checks

Before connecting USB or the 9 V supply:

1. Set the multimeter to continuity mode.
2. Check that 5 V and GND are not shorted.
3. Check 74HC595 pin 16 has continuity to 5 V.
4. Check 74HC595 pin 8 has continuity to GND.
5. Check NE556 pin 14 has continuity to 5 V.
6. Check NE556 pin 7 has continuity to GND.
7. Check each LED short leg goes to GND.
8. Check each LED long leg goes through a resistor before reaching an Arduino or 74HC595 output.
9. Check the striped ends of both 1N4007 diodes meet at the PL red drive node.
10. Check Arduino GND is connected to breadboard GND.

## 25. First Power-on

1. Connect the Arduino to the computer with the Type-B USB cable.
2. If using the breadboard power module, turn on the 9 V supply and confirm the breadboard rail is 5 V.
3. Upload StandardFirmata to the Arduino if it is not already loaded.
4. Open a terminal in the project folder.
5. Run:

```bash
python integrated_subsystems_2_3.py
```

## 26. Calibration

### US5

1. Run the program with no vehicle in front of US5.
2. Place the model vehicle in the exit lane.
3. If detection is unreliable, edit:

```python
us5TriggerDistanceCm = 15.0
us5ClearDistanceCm = 18.0
```

Set the trigger distance between the empty-lane reading and the vehicle-present reading. Set the clear distance slightly higher than the trigger distance.

### DS2

1. Note DS2 A0 in bright light.
2. Cover DS2 and note DS2 A0 in darkness.
3. Edit `ds2NightThreshold` so it sits between those two readings.
4. With this wiring, dark should be lower than bright.

### DS1

1. Note DS1 A1 in bright light.
2. Cover DS1 and note DS1 A1 in darkness.
3. Edit `ds1NightThreshold` so it sits between those two readings.
4. With this wiring, dark should be lower than bright.

## 27. Expected Behaviour Tests

### Normal subsystem 2 cycle

1. Start the program.
2. TL4 should start green and TL5 red.
3. In day mode, TL4 green lasts 20 seconds.
4. TL4 turns yellow for 3 seconds, then red.
5. TL5 turns green for 10 seconds.
6. TL5 turns yellow for 3 seconds, then red.
7. TL4 returns green and repeats.

### DS2 night mode

1. Cover DS2.
2. The console should report DS2 night mode.
3. New TL4 green cycles should become 30 seconds.
4. New TL5 green cycles should become 5 seconds.

### Pedestrian request

1. Press PB1 or PB2 once.
2. The console should print one accepted request.
3. After 2 seconds, the active road light changes to yellow for 3 seconds.
4. TL4 and TL5 become red.
5. PL1/PL2 turn green for 3 seconds.
6. PL1/PL2 flash red from the NE556 for 2 seconds.
7. PL1/PL2 return solid red.
8. TL4 returns green.
9. Press PB1/PB2 during the next 30 seconds and confirm the lockout message appears.

### US5 subsystem 2 + 3 integration

1. Place a vehicle in front of US5.
2. TL4/TL5 should turn yellow for 3 seconds if either was not already red.
3. TL4/TL5 should become red.
4. PL1/PL2 should turn green.
5. TL6 should then turn green. This is the 3.I1 delay working.
6. If DS1 is in day mode, TL6 base green time is 5 seconds.
7. If DS1 is covered, TL6 base green time is 10 seconds and FL1/FL2 turn on.
8. Keep the vehicle in front of US5 after the green time. TL6 should stay solid green.
9. Remove the vehicle from US5.
10. PL1/PL2 flash red for 2 seconds, then return solid red.
11. TL4 returns green and the TL4/TL5 cycle resumes.
12. TL6 turns yellow for 3 seconds, then red.
13. FL1/FL2 turn off when US5 clears.

## 28. Common Faults

- If TL4/TL5/PL outputs are wrong, check the 74HC595 bit order and output pins.
- If no shift-register LEDs work, check D2, D3, D4, pin 10 to 5 V, and pin 13 to GND.
- If PL red solid works but flashing does not, check Arduino D13 to NE556 pin 4.
- If PL red flashing works but solid red does not, check 74HC595 Q6 and its diode.
- If PB1/PB2 never trigger, check that the button connects the signal row to 5 V when pressed.
- If PB1/PB2 constantly trigger, check the 10 kOhm pulldown to GND.
- If DS1/DS2 are backwards, swap the LDR/resistor positions or reverse the threshold comparison in code.
- If US5 does not detect, check `TRIG` on D7 and `ECHO` on D8, plus 5 V and common GND.
