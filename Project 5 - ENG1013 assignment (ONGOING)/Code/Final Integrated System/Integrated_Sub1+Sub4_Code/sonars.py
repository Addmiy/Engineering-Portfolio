# The file containing functions related to the sonars (ultrasonic sensors)
# Created By : Team F16
# Updated Date: 2026-05-16
# version ='1.0'

# Library imports
import time

# Pin definitions
trigPins = [2,4,6,8]
echoPins = [3,5,7,9]

def sonars_setup(board):
    """Function to initialise the sonars, including a custom timeout suited for the range of desired operation.

    Parameters
    ----------
    board : Pymata4 Object.
        The board on which the sonars are being set up.
    """
    for i in range(4):
        board.set_pin_mode_sonar(trigPins[i], echoPins[i], timeout=10000)
        time.sleep(0.2) 
    
def poll_sonars(board, heights, us1Last2, us2Last2, sonarTimestamps):
    """Function to be called repeatedly in the main loop to read and update the height measurements.

    Parameters
    ----------
    board : Pymata4 Object.
        The board on which the sonars are connected.
    heights : list of floats
        A list containing the latest distance readings at full scale.
    us1Last2 : list of floats
        A list of the last 2 readings from US1, used for the moving average filter.
    us2Last2 : list of floats
        A list of the last 2 readings from US2, used for the moving average filter.
    sonarTimestamps : list of floats
        Timestamps used to skip updating if there was not a new reading (indicated by changed timestamp).
    """
    for trigPinIdx in range(4):
        [data, timestamp] = board.sonar_read(trigPins[trigPinIdx])
        
        if (sonarTimestamps[trigPinIdx] == timestamp):
            continue # same data as last time, go next
        
        sonarTimestamps[trigPinIdx] = timestamp
        # US1 and US2 are special cases so that we can implement a 2-element moving-average filter.
        # The filter length of 2 was chosen experimentally for a good balance between noise rejection
        # and latency. Per 1.G4.
        if trigPinIdx == 0:
            us1Last2[0] = us1Last2[1]
            us1Last2[1] = round(7 - (15/100) * data, 2)
            heights[trigPinIdx] = (us1Last2[0] + us1Last2[1]) / 2
        elif trigPinIdx == 1:
            us2Last2[0] = us2Last2[1]
            us2Last2[1] = round(7 - (15/100) * data, 2)
            heights[trigPinIdx] = (us2Last2[0] + us2Last2[1]) / 2
        else:
            heights[trigPinIdx] = round(7 - (15/100) * data, 2)

        if heights[trigPinIdx] < 0.0 or heights[trigPinIdx] == 7.0:
            # result after scaling is outside of the range we want
            heights[trigPinIdx] = 0.0

    return
