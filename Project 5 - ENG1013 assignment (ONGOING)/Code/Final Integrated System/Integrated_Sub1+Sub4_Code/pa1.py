# The file containing PA1 functions
# Created By : Team F16
# Updated Date: 2026-05-16
# version ='1.0'

# Library imports
import config as cfg

#-----------------------------
# PA1 functions (note that we only need to ring at 5 kHz as that is the only one implemented)
#-----------------------------

def PA1_setup(board):
    """Sets up the PA1 output pin.

    Parameters
    ----------
    board : Pymata4 Object
        The board on which we are running the program.
    """
    # set up PA1, ensure it is off (by pulling the reset pin low)
    board.set_pin_mode_digital_output(cfg.pa1ResetPin)
    board.digital_write(cfg.pa1ResetPin, 0)

def PA1_ring(board):
    """Turns on PA1 by controlling the reset pin of its 556.

    Parameters
    ----------
    board : Pymata4 object
        The board connected to the 556.
    """
    board.digital_write(cfg.pa1ResetPin, 1)
    
def PA1_silence(board):
    """Turns off PA1 by controlling the reset pin of its 556.

    Parameters
    ----------
    board : Pymata4 object
        The board connected to the 556.
    """
    board.digital_write(cfg.pa1ResetPin, 0)