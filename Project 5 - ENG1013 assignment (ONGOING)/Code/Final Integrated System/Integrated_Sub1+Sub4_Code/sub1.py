# The file containing subsystem 1 logic
# Created By : Team F16
# Updated Date: 2026-05-16
# version ='1.0

# Library imports 
import time

# Project-specific imports
import tl12
import wl12
import config as cfg

def print_alert(height):
    """Prints an alert to the console, including the height provided to the function and the current date/time, IAW requirement 1.R1.

    Parameters
    ----------
    height : int or float
        The measured height (to be printed)
    """
    localTime = time.localtime()
    
    print(f"{localTime.tm_year:>4}-{localTime.tm_mon:0>2}-{localTime.tm_mday:0>2} {localTime.tm_hour:>2}:{localTime.tm_min:0>2}:{localTime.tm_sec:0>2} | ALERT [US1]: Vehicle detected at a height of {height:.1f} metres.")
    return



def sub1_logic(board, sub1Overriden, heights, overheightLimit, us1PrintLast, sub1US1TriggerLast):
    """This function has the logic for the subsystem 1 features and should be called repeatedly in the main loop.

    Parameters
    ----------
    board : Pymata4 Object
        The board on which we are running the program.
    sub1Overriden : Bool
        Whether or not subsystem 1's outputs (e.g. TL1) are overriden IAW 4.I1.
    heights : list of floats
        A list containing the latest distance readings at full scale.
    overheightLimit : float
        The overheight limit selected by the user.
    us1PrintLast : float
        Timestamp of the most recent alert print from US1.
    sub1US1TriggerLast : float
        Timestamp of the last time US1 was triggered.

    Returns
    -------
    us1PrintLast, sub1US1TriggerLast
        Values that hold certain states as described above.
        Can't pass them by reference so they are returned.
    """
    
    # make copies of the sonar distances here to avoid them changing
    # (technically the sonars don't use callbacks so it should be fine, but might as well)

    US1latest = heights[0]
    US2latest = heights[1]
        
    if (US1latest > overheightLimit):
        wl12.WL1_start_flash_slow(sub1Overriden) # 1.G1
        if (time.time() > us1PrintLast + 4): # max 1 alert per 4 seconds
            # print alert per 1.R1
            print_alert(US1latest)
            us1PrintLast = time.time()
        sub1US1TriggerLast = time.time()
        # run 1.R2
        tl12.TL1_start_yellow(redTime=30.0, yellowTime=1.0)
        
    if (US2latest > overheightLimit):
        wl12.WL1_start_flash_slow(sub1Overriden) # 1.G1
        
        # the choice below is for 1.R3, calculation of the threshold is in config.py
        if (time.time() < sub1US1TriggerLast + cfg.sub1ThresholdTime):
            # if we are here it basically means that the vehicle detected is most likely
            # the same as the vehicle detected by US1 earlier
            tl12.TL2_start_yellow(redTime=30.0, yellowTime=1.0)
        else:
            # This is the case where the vehicle US2 has detected is different from the last US1 vehicle
            tl12.TL1_start_yellow(redTime=30.0, yellowTime=1.0)
            tl12.TL2_start_yellow(redTime=30.0, yellowTime=1.0)

    return us1PrintLast, sub1US1TriggerLast

