# The file containing functions related to the shift register
# Created By : Team F16
# Updated Date: 2026-05-16
# version ='1.0'

# Project-specific imports
import config as cfg
import utils

def shift_reg_setup(board):
    """Initialises the shift register using pins defined in the config.

    Parameters
    ----------
    board : Pymata4 object
        The board on which the shift register is being set up.
    """
    
    board.set_pin_mode_digital_output(cfg.srclkPin)
    board.set_pin_mode_digital_output(cfg.rclkPin)
    board.set_pin_mode_digital_output(cfg.serPin)

def shift_out_bits(board, currBits, lastBits):
    """Shifts out the bits in the state dict to the shift registers, updating the outputs across the system.
    Parameters
    ----------
    board : Pymata4 object
        The board on which the shift register is connected and set up.
    """
    
    if (currBits == lastBits):
        return
    
    board.digital_write(cfg.srclkPin, 0)
    board.digital_write(cfg.serPin, 0)
    board.digital_write(cfg.rclkPin, 0)
    utils.short_delay_us(1500)
    # Shift out bits, MSB first
    for i in range(8):
        bit = currBits[i]
        board.digital_write(cfg.serPin, bit)
        utils.short_delay_us(1500)
        # Clock pulse
        board.digital_write(cfg.srclkPin, 1)
        utils.short_delay_us(1500)
        board.digital_write(cfg.srclkPin, 0)
    
    utils.short_delay_us(1500)
    board.digital_write(cfg.rclkPin, 1)
    utils.short_delay_us(1500)
    board.digital_write(cfg.rclkPin, 0)
    
    lastBits = currBits[:]
    return