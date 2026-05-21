# The file containing functions related to TL1 and TL2
# Created By : Team F16
# Updated Date: 2026-05-16
# version ='1.0'

# library imports
import time

# Project-specific imports
import config as cfg

#-----------------------------
# TL1 functions
#-----------------------------

tl1State = {"currMode": "green",         # The color requested by sub 1
            "yellowStartTime": 0.0,      # The time at which yellow began to be requested
            "redStartTime": 0.0,         # The time at which red began to be requested
            "yellowDuration" : 1.0,      # The duration that yellow should be on before switching to red
            "redDuration" : 30.0         # The duration that red should be on before switching to green
            }


def TL1_update(sub1Overriden, shiftRegBits):
    """Updates the state of TL1, switching modes as required.
    """
    # update the state of TL1, don't change outputs yet
    if (tl1State["currMode"] == "green"):
        pass   # do nothing
        
    elif (tl1State["currMode"] == "yellow"):
        if (time.time() - tl1State["yellowStartTime"] > tl1State["yellowDuration"]):
            # time to switch to red
            tl1State["redStartTime"] = time.time()
            tl1State["currMode"] = "red"
            
    elif (tl1State["currMode"] == "red"):
        if (time.time() - tl1State["redStartTime"] > tl1State["redDuration"]):
            # time to switch to green
            tl1State["currMode"] = "green"
            

    else:
        raise ValueError # illegal value in currMode

    # now to decide the output state
    if sub1Overriden == False:
        # if we are here sub1 still has control, so
        # we set outputs according to it's request
        if (tl1State["currMode"] == "green"):
            shiftRegBits[cfg.srTL1Red] = 0
            shiftRegBits[cfg.srTL1Ylw] = 0
            shiftRegBits[cfg.srTL1Grn] = 1
        elif (tl1State["currMode"] == "yellow"):
            shiftRegBits[cfg.srTL1Red] = 0
            shiftRegBits[cfg.srTL1Ylw] = 1
            shiftRegBits[cfg.srTL1Grn] = 0
        elif (tl1State["currMode"] == "red"):
            shiftRegBits[cfg.srTL1Red] = 1
            shiftRegBits[cfg.srTL1Ylw] = 0
            shiftRegBits[cfg.srTL1Grn] = 0
        else:
            raise ValueError # illegal value in currMode
    else:
        # if we are here, sub1 has been overriden by sub4
        # in this case we just go red
        shiftRegBits[cfg.srTL1Red] = 1
        shiftRegBits[cfg.srTL1Ylw] = 0
        shiftRegBits[cfg.srTL1Grn] = 0
    return tl1State

def TL1_start_yellow(redTime, yellowTime = 1.0):
    """Usually sets TL1 to yellow immediately, and turns red after yellowTime, then green after redTime.
    If the light is already red, we just restart the redTime counter (so don't actaully go back to yellow).
    This is for use by subsystem 1.

    Parameters
    ----------
    board : Pymata4 object
        The board being used.
    yellowTime (optional): int or float
        The amount of time after which TL1 will end up being red
    redTime : int or float
        The amount of time after which TL1 will go from red to green.
    """
    
    if (tl1State["currMode"] == "green" or tl1State["currMode"] == "yellow"):
        tl1State["yellowStartTime"] = time.time()
        tl1State["yellowDuration"]  = float(yellowTime)
        tl1State["redDuration"]     = float(redTime)
        tl1State["currMode"]        = "yellow"
        return
    
    elif (tl1State["currMode"] == "red"): # don't go back to yellow!
        tl1State["redStartTime"]    = time.time()
        tl1State["yellowDuration"]  = float(yellowTime)
        tl1State["redDuration"]     = float(redTime)
        tl1State["currMode"]        = "red"
        return
    
    else:
        return ValueError


#-----------------------------
# TL2 functions
#-----------------------------

tl2State = {"currMode": "green",         # The color requested by sub 1
            "yellowStartTime": 0.0,      # The time at which yellow began to be requested
            "redStartTime": 0.0,         # The time at which red began to be requested
            "yellowDuration" : 1.0,      # The duration that yellow should be on before switching to red
            "redDuration" : 30.0         # The duration that red should be on before switching to green
            }


def TL2_update(sub1Overriden, shiftRegBits):
    """Updates the state of TL2, switching modes as required.
    """
    # update the state of TL2, don't change outputs yet
    if (tl2State["currMode"] == "green"):
        pass   # do nothing
        
    elif (tl2State["currMode"] == "yellow"):
        if (time.time() - tl2State["yellowStartTime"] > tl2State["yellowDuration"]):
            # time to switch to red
            tl2State["redStartTime"] = time.time()
            tl2State["currMode"] = "red"
            
    elif (tl2State["currMode"] == "red"):
        if (time.time() - tl2State["redStartTime"] > tl2State["redDuration"]):
            # time to switch to green
            tl2State["currMode"] = "green"
            

    else:
        raise ValueError # illegal value in currMode

    # now to decide the output state
    if sub1Overriden == False:
        # if we are here sub1 still has control, so
        # we set outputs according to it's request
        if (tl2State["currMode"] == "green"):
            shiftRegBits[cfg.srTL2Red] = 0
            shiftRegBits[cfg.srTL2Ylw] = 0
            shiftRegBits[cfg.srTL2Grn] = 1
        elif (tl2State["currMode"] == "yellow"):
            shiftRegBits[cfg.srTL2Red] = 0
            shiftRegBits[cfg.srTL2Ylw] = 1
            shiftRegBits[cfg.srTL2Grn] = 0
        elif (tl2State["currMode"] == "red"):
            shiftRegBits[cfg.srTL2Red] = 1
            shiftRegBits[cfg.srTL2Ylw] = 0
            shiftRegBits[cfg.srTL2Grn] = 0
        else:
            raise ValueError # illegal value in currMode
    else:
        # if we are here, sub1 has been overriden by sub4
        # in this case we just go red
        shiftRegBits[cfg.srTL2Red] = 1
        shiftRegBits[cfg.srTL2Ylw] = 0
        shiftRegBits[cfg.srTL2Grn] = 0
    return tl2State

def TL2_start_yellow(redTime, yellowTime = 1.0):
    """Usually sets TL2 to yellow immediately, and turns red after yellowTime, then green after redTime.
    If the light is already red, we just restart the redTime counter (so don't actaully go back to yellow).
    This is for use by subsystem 1.

    Parameters
    ----------
    board : Pymata4 object
        The board being used.
    yellowTime (optional): int or float
        The amount of time after which TL2 will end up being red
    redTime : int or float
        The amount of time after which TL2 will go from red to green.
    """
    
    if (tl2State["currMode"] == "green" or tl2State["currMode"] == "yellow"):
        tl2State["yellowStartTime"] = time.time()
        tl2State["yellowDuration"]  = float(yellowTime)
        tl2State["redDuration"]     = float(redTime)
        tl2State["currMode"]        = "yellow"
        return
    
    elif (tl2State["currMode"] == "red"): # don't go back to yellow!
        tl2State["redStartTime"]    = time.time()
        tl2State["yellowDuration"]  = float(yellowTime)
        tl2State["redDuration"]     = float(redTime)
        tl2State["currMode"]        = "red"
        return
    
    else:
        return ValueError
