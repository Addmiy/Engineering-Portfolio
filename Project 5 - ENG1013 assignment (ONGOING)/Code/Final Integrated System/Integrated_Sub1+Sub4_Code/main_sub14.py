# The main file for the traffic light project
# Created By : Team F16
# Created Date: 2026-05-16
# version ='1.0'

# Library imports
from pymata4 import pymata4

# Project-specific imports
import config as cfg
import sonars as sn
import shift_reg as sr
import utils
import sub1
import sub4
import tl12
import tl3
import wl12
import pa1

# global variables for state
shiftRegBits = [1,0,0,1, 0,0,0,0]
lastShiftRegBits = [0,0,0,0, 0,0,0,0]
usLatestHeights = [0.0,0.0,0.0,0.0]
us1Last2        = [0.0,0.0]
us2Last2        = [0.0,0.0]
sonarTimestamps = [0.0, 0.0, 0.0, 0.0]
us1PrintLast = 0.0
sub1US1TriggerLast = 0.0
overheightLimit = cfg.overheightLimDefault
sub1Overriden = False


try:
    # Initialise Arduino board comms
    board = pymata4.Pymata4()
    board.set_sampling_interval(100)
    
    # configure sonar pins
    sn.sonars_setup(board)
    
    # configure shift reg
    sr.shift_reg_setup(board)
    sr.shift_out_bits(board, shiftRegBits, lastShiftRegBits)
    
    # setup WL1, WL2
    wl12.setup_WL12(board)
    
    # setup TL3
    tl3.setup_TL3(board)
    
    # setup PA1
    pa1.PA1_setup(board)
    
    # get overheight limit from user (1.R4, 4.R3)
    overheightLimit = utils.get_overheight_limit()
    
    while(True):
        # get inputs from sonars
        sn.poll_sonars(board, usLatestHeights, us1Last2, us2Last2, sonarTimestamps)
        
        # run subsystem 1 logic
        us1PrintLast, sub1US1TriggerLast = sub1.sub1_logic(board, sub1Overriden, usLatestHeights , overheightLimit, us1PrintLast, sub1US1TriggerLast)
        sub1Overriden = sub4.sub4_logic(board, sub1Overriden, usLatestHeights, overheightLimit)
        
        # update states of outputs
        tl1State = tl12.TL1_update(sub1Overriden, shiftRegBits)
        tl2State = tl12.TL2_update(sub1Overriden, shiftRegBits)
        wl12.WL1_update(board, tl1State, tl2State)

        # send out TL1, TL2 bits to shift registers
        sr.shift_out_bits(board, shiftRegBits, lastShiftRegBits)
except KeyboardInterrupt: # quit requested
    print("\n\nDetected Ctrl+C, shutting down and quitting...")
    sr.shift_out_bits(board, [0,0,0,0, 0,0,0,0], [0,0,0,0, 0,0,0,0]) # this turns everything off
    board.shutdown()
    quit()