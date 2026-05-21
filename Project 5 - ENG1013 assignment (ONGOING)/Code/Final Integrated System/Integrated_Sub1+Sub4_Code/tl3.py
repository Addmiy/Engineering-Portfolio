# The file containing functions related to TL3
# Created By : Team F16
# Updated Date: 2026-05-16
# version ='1.0'

# Library imports
import config as cfg

#-----------------------------
# TL3 functions
#-----------------------------

def setup_TL3(board):
    """Sets up the TL3 outputs and gives them a known state.

    Parameters
    ----------
    board : Pymata4 Object.
        The board on which TL3 is being set up.
    """
    # set up TL3, ensure it is green
    board.set_pin_mode_digital_output(cfg.tl3RedPin)
    board.digital_write(cfg.tl3RedPin, 0)
    board.set_pin_mode_digital_output(cfg.tl3GreenPin)
    board.digital_write(cfg.tl3GreenPin, 1)
    

def TL3_start_red(board):
    """Sets TL3 to red immediately.

    Parameters
    ----------
    board : Pymata4 object
        The board being used.
    """
    
    board.digital_write(cfg.tl3GreenPin, 0)
    board.digital_write(cfg.tl3RedPin, 1)
    return

def TL3_start_green(board):
    """Sets TL3 to green immediately.

    Parameters
    ----------
    board : Pymata4 object
        The board being used.
    """
    
    board.digital_write(cfg.tl3GreenPin, 1)
    board.digital_write(cfg.tl3RedPin, 0)
    return
