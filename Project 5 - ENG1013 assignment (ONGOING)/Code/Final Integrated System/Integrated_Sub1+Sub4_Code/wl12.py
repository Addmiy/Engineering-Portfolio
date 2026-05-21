# The file containing functions related to WL1 and WL2
# Created By : Team F16
# Updated Date: 2026-05-16
# version ='1.0'

# library imports
import time

# Project-specific imports
import config as cfg

def setup_WL12(board):
    # set up WL1, ensure it is off
    board.set_pin_mode_digital_output(cfg.wl1LeftPin)
    board.digital_write(cfg.wl1LeftPin, 0)
    board.set_pin_mode_digital_output(cfg.wl1RightPin)
    board.digital_write(cfg.wl1RightPin, 0)
    
    # set up WL2, ensure it is off
    board.set_pin_mode_digital_output(cfg.wl2EnablePin)
    board.digital_write(cfg.wl2EnablePin, 0)
    


#-----------------------------
# WL1 functions (slow = 2hz to 5hz, fast = 5hz to 10hz)
#-----------------------------

# flashPeriod is used to track (obviously) the period of flashing, and if it is zero, both should be off
wl1State = {"flashPeriod": 0.0, "slowRequested": False, "currentlyOn": None, "lastToggleTime": time.time()}

def WL1_update(board, tl1State, tl2State):
    """Updates the state of WL1, switching modes as required.

    Parameters
    ----------
    board : Pymata4 object
        The board which is being communicated with.

    Raises
    ------
    ValueError
        Raised if there was an illegal value put in wl1State["currentlyOn"]
    """
    
    # If switched off, make sure the bit is actually off
    # This is probably not needed but it is free to run
    if (wl1State["flashPeriod"] == 0):
        board.digital_write(cfg.wl1LeftPin, 0)
        board.digital_write(cfg.wl1RightPin, 0)
        wl1State["currentlyOn"] = None
        return    
    
    # switch off WL1 when TL1+TL2 are both back to green
    if tl1State["currMode"] == "green" and tl2State["currMode"] == "green":
        wl1State["flashPeriod"] = 0
        board.digital_write(cfg.wl1LeftPin, 0)
        board.digital_write(cfg.wl1RightPin, 0)
        wl1State["currentlyOn"] = None
        return
    
    # WL1 toggling logic for arbitrary flashPeriod
    if (time.time() - wl1State["lastToggleTime"] >= wl1State["flashPeriod"]):
        if (wl1State["currentlyOn"] == "left" or wl1State["currentlyOn"] == None):
            board.digital_write(cfg.wl1LeftPin, 0)
            board.digital_write(cfg.wl1RightPin, 1)
            wl1State["currentlyOn"] = "right"
            wl1State["lastToggleTime"] = time.time()
            
        elif (wl1State["currentlyOn"] == "right"):
            board.digital_write(cfg.wl1LeftPin, 1)
            board.digital_write(cfg.wl1RightPin, 0)
            wl1State["currentlyOn"] = "left"
            wl1State["lastToggleTime"] = time.time()
        else:
            raise ValueError # the value in the shift reg wasnt a 1 or 0
    return


def WL1_stop_flash(board):
    """Turns off WL1 flashing.

    Parameters
    ----------
    board : Pymata4 object
        The board which is being communicated with.
    """
    wl1State["flashPeriod"] = 0
    board.digital_write(cfg.wl1LeftPin, 0)
    board.digital_write(cfg.wl1RightPin, 0)
    wl1State["currentlyOn"] = None
    return

def WL1_start_flash_slow(sub1Overriden):
    """Turns on WL1 flashing, toggling at 6 Hz as required.
    Parameters
    ----------
    board : Pymata4 object
        The board which is being communicated with.
    """
    if sub1Overriden == False:
        wl1State["flashPeriod"] = 1.0 / 6.0    # 3.0 Hz flash, 6 Hz toggle
    return

def WL1_start_flash_fast():
    """Turns on WL1 flashing, toggling at 12 Hz as required.
    Parameters
    ----------
    board : Pymata4 object
        The board which is being communicated with.
    """
    wl1State["flashPeriod"] = 1.0 / 12.0        # 6.0 Hz flash, 12 Hz toggle
    return


def WL2_start_flash_red(board):
    """This function is called to enable the WL2 flashing sequence by pulling the relevant 556 reset pin high.

    Parameters
    ----------
    board : Pymata4 object
        The board which is connected to WL2
    """
    board.digital_write(cfg.wl2EnablePin, 1)
    return

def WL2_stop_flash_red(board):
    """This function is called to disable the WL2 flashing sequence by pulling the relevant 556 reset pin low.

    Parameters
    ----------
    board : Pymata4 object
        The board which is connected to WL2
    """
    board.digital_write(cfg.wl2EnablePin, 0)
    return