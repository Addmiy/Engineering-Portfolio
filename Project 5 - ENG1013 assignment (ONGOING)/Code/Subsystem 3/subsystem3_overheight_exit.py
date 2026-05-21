"""
ENG1013 Traffic System Project
Subsystem 3: Over-height Exit Subsystem

This version is based on the older working code and keeps the same pin map.

Implemented features:
    3.R1 - US5 detects a vehicle, then TL6 goes green, yellow, red.
    3.R2 - If the vehicle is still present, TL6 stays green until it clears.
    3.G2 - US5 readings are smoothed using a moving average.
    3.G3 - At night, FL1 and FL2 turn on while US5 detects a vehicle.
    3.G4 - At night, TL6 green time changes from 5 seconds to 10 seconds.

Not implemented:
    3.G1 - TL6 flashing green with a 555 timer is intentionally excluded.
"""

from pymata4 import pymata4
import time


# ---------------------------------------------------------------------------
# User-editable setup values
# ---------------------------------------------------------------------------

# Use None for automatic Arduino detection. If auto-detection fails, change
# this to the Arduino port shown in Device Manager, for example "COM4".
boardComPort = None


# ---------------------------------------------------------------------------
# Pin mapping
# ---------------------------------------------------------------------------

# US5 is the ultrasonic sensor at the over-height exit lane.
us5TriggerPin = 6
us5EchoPin = 7

# TL6 is the red/yellow/green exit traffic light.
tl6RedPin = 8
tl6YellowPin = 9
tl6GreenPin = 10

# FL1 and FL2 are the two white floodlights.
fl1Pin = 11
fl2Pin = 12

# DS1 is the light dependent resistor. In Pymata4, A0 is analog pin 0.
ds1AnalogPin = 0


# ---------------------------------------------------------------------------
# Calibration values
# ---------------------------------------------------------------------------

# Hysteresis is used so the vehicle state does not flicker near the threshold.
# A vehicle appears when it is closer than 15 cm and clears after it is farther
# than 18 cm. Adjust these two values after testing your model.
exitLaneTriggerDistanceCm = 15.0
exitLaneClearDistanceCm = 18.0

# The moving average smooths noisy ultrasonic measurements.
us5MovingAverageWindow = 5
us5MaxValidDistanceCm = 300.0

# With this LDR wiring, a lower A0 reading means darker conditions.
# Adjust this after testing DS1 covered and uncovered.
nightLdrThreshold = 600


# ---------------------------------------------------------------------------
# Timing values
# ---------------------------------------------------------------------------

dayGreenSeconds = 5.0
nightGreenSeconds = 10.0
yellowSeconds = 3.0
pollDelaySeconds = 0.1


# ---------------------------------------------------------------------------
# Global runtime state
# ---------------------------------------------------------------------------

board = None
us5Samples = []
lastDayNightState = -1


def setup_board():
    """
    Connect to the Arduino and configure every pin used by subsystem 3.
    """
    global board

    if boardComPort is None:
        board = pymata4.Pymata4()
    else:
        board = pymata4.Pymata4(com_port=boardComPort)

    board.set_pin_mode_digital_output(tl6RedPin)
    board.set_pin_mode_digital_output(tl6YellowPin)
    board.set_pin_mode_digital_output(tl6GreenPin)
    board.set_pin_mode_digital_output(fl1Pin)
    board.set_pin_mode_digital_output(fl2Pin)
    board.set_pin_mode_analog_input(ds1AnalogPin)
    board.set_pin_mode_sonar(us5TriggerPin, us5EchoPin)

    # Give Pymata4 time to start receiving readings before the main loop runs.
    time.sleep(1.0)

    set_tl6_red()
    set_floodlights(0)

    print("Subsystem 3 started.")
    print("3.G1 flashing-green / 555 timer feature is not included.")
    print("US5 trigger threshold:", exitLaneTriggerDistanceCm, "cm")
    print("US5 clear threshold:", exitLaneClearDistanceCm, "cm")
    print("Night threshold (A0):", nightLdrThreshold)
    print("Press Ctrl+C to stop cleanly.")


def set_tl6_red():
    """
    Set TL6 to red only.
    """
    board.digital_write(tl6RedPin, 1)
    board.digital_write(tl6YellowPin, 0)
    board.digital_write(tl6GreenPin, 0)


def set_tl6_yellow():
    """
    Set TL6 to yellow only.
    """
    board.digital_write(tl6RedPin, 0)
    board.digital_write(tl6YellowPin, 1)
    board.digital_write(tl6GreenPin, 0)


def set_tl6_green():
    """
    Set TL6 to green only.
    """
    board.digital_write(tl6RedPin, 0)
    board.digital_write(tl6YellowPin, 0)
    board.digital_write(tl6GreenPin, 1)


def all_outputs_off():
    """
    Turn off every LED before the program shuts down.
    """
    board.digital_write(tl6RedPin, 0)
    board.digital_write(tl6YellowPin, 0)
    board.digital_write(tl6GreenPin, 0)
    board.digital_write(fl1Pin, 0)
    board.digital_write(fl2Pin, 0)


def set_floodlights(state):
    """
    Turn FL1 and FL2 on or off together.
    """
    board.digital_write(fl1Pin, state)
    board.digital_write(fl2Pin, state)


def clear_us5_filter():
    """
    Empty old ultrasonic readings so the next vehicle starts with fresh data.
    """
    us5Samples.clear()


def read_us5_filtered_distance():
    """
    Read US5 and return the moving average distance in centimetres.

    Invalid ultrasonic readings are ignored by returning None.
    """
    reading = board.sonar_read(us5TriggerPin)

    if reading is None or reading[0] is None:
        return None

    distanceCm = reading[0]

    if distanceCm <= 0:
        return None

    if distanceCm > us5MaxValidDistanceCm:
        return None

    us5Samples.append(distanceCm)

    if len(us5Samples) > us5MovingAverageWindow:
        us5Samples.pop(0)

    total = 0.0
    sampleCount = 0

    for sample in us5Samples:
        total = total + sample
        sampleCount = sampleCount + 1

    if sampleCount == 0:
        return None

    return total / sampleCount


def vehicle_present_in_exit_lane(currentlyActive):
    """
    Decide if US5 currently detects a vehicle.

    The trigger threshold starts detection. The wider clear threshold keeps the
    detection stable while the vehicle is already active.
    """
    filteredDistance = read_us5_filtered_distance()

    if filteredDistance is None:
        return 0, None

    if currentlyActive == 1:
        if filteredDistance <= exitLaneClearDistanceCm:
            return 1, filteredDistance
        return 0, filteredDistance

    if filteredDistance <= exitLaneTriggerDistanceCm:
        return 1, filteredDistance

    return 0, filteredDistance


def read_day_night_state():
    """
    Read DS1 and return 1 for night or 0 for day.
    """
    reading = board.analog_read(ds1AnalogPin)

    if reading is None or reading[0] is None:
        return 0, 0

    ldrValue = reading[0]

    if ldrValue <= nightLdrThreshold:
        return 1, ldrValue

    return 0, ldrValue


def update_floodlights(currentlyActive):
    """
    Keep FL1 and FL2 matching feature 3.G3 during waits and green holds.
    """
    vehiclePresent, filteredDistance = vehicle_present_in_exit_lane(currentlyActive)
    isNight, ldrValue = read_day_night_state()

    if vehiclePresent == 1 and isNight == 1:
        set_floodlights(1)
    else:
        set_floodlights(0)

    return vehiclePresent, filteredDistance, isNight, ldrValue


def wait_with_sensor_updates(durationSeconds):
    """
    Wait for a duration while still updating US5 filtering and the floodlights.
    """
    finishTime = time.time() + durationSeconds

    while time.time() < finishTime:
        update_floodlights(1)
        time.sleep(pollDelaySeconds)


def log_day_night_change():
    """
    Print day/night changes only once, so the console does not get spammed.
    """
    global lastDayNightState

    isNight, ldrValue = read_day_night_state()

    if isNight != lastDayNightState:
        if isNight == 1:
            print("DS1: NIGHT mode detected. A0 =", ldrValue)
        else:
            print("DS1: DAY mode detected. A0 =", ldrValue)

        lastDayNightState = isNight


def run_exit_sequence(filteredDistance):
    """
    Run the complete TL6 exit sequence after US5 detects a vehicle.

    This is where 3.R1, 3.R2, 3.G3 and 3.G4 work together.
    """
    isNight, ldrValue = read_day_night_state()

    if isNight == 1:
        greenTime = nightGreenSeconds
        set_floodlights(1)
        print("US5 detected vehicle at", round(filteredDistance, 2), "cm.")
        print("Night detected by DS1 (A0 =", ldrValue, ").")
        print("FL1 and FL2 -> ON. TL6 green time set to 10 seconds.")
    else:
        greenTime = dayGreenSeconds
        set_floodlights(0)
        print("US5 detected vehicle at", round(filteredDistance, 2), "cm.")
        print("Day detected by DS1 (A0 =", ldrValue, ").")
        print("TL6 green time set to 5 seconds.")

    # 3.R1: TL6 first turns green for the base green time.
    set_tl6_green()
    print("TL6 -> GREEN")
    wait_with_sensor_updates(greenTime)

    # 3.R2: no flashing is used. If the vehicle is still present, TL6 simply
    # stays green until US5 says the exit lane is clear.
    stillPresent, filteredDistance = vehicle_present_in_exit_lane(1)

    if stillPresent == 1:
        print("3.R2 active: vehicle still present after minimum green time.")
        print("TL6 will stay GREEN until US5 clears.")

    while stillPresent == 1:
        set_tl6_green()
        stillPresent, filteredDistance, isNight, ldrValue = update_floodlights(1)
        time.sleep(pollDelaySeconds)

    set_floodlights(0)
    print("Vehicle cleared exit lane. FL1 and FL2 -> OFF")

    # 3.R1 continues after the green stage: yellow for 3 seconds, then red.
    set_tl6_yellow()
    print("TL6 -> YELLOW")
    wait_with_sensor_updates(yellowSeconds)

    set_tl6_red()
    print("TL6 -> RED")

    clear_us5_filter()


def shutdown_system():
    """
    Return the Arduino outputs to a safe state and close the Pymata4 connection.
    """
    global board

    if board is None:
        return

    all_outputs_off()
    time.sleep(0.2)
    board.shutdown()
    board = None


def main():
    """
    Main program loop. TL6 stays red until US5 detects a vehicle.
    """
    setup_board()

    try:
        while True:
            log_day_night_change()

            vehicleDetected, filteredDistance = vehicle_present_in_exit_lane(0)

            if vehicleDetected == 1:
                run_exit_sequence(filteredDistance)
            else:
                set_tl6_red()
                set_floodlights(0)
                time.sleep(pollDelaySeconds)

    except KeyboardInterrupt:
        print("\nKeyboardInterrupt received. Shutting down Subsystem 3.")
    finally:
        shutdown_system()


if __name__ == "__main__":
    main()
