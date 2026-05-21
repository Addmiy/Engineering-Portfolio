# This file contains a few miscellaneous utilities used in the traffic light project
# Created By : Team F16
# Created Date: 2026-05-16
# version ='1.0'

# Library imports
import time

# Project-specific imports
import config as cfg

def get_overheight_limit():
    """Asks the user for an overheight limit, defaulting when nothing is entered.

    Parameters
    ----------
    min : float
        The minimum (inclusive) acceptable overheight limit
    max : float
        The maximum (inclusive) acceptable overheight limit
    default : float
        The default overheight limit

    Returns
    -------
    result
        The overheight limit that was produced by this function
    """
    
    result = cfg.overheightLimDefault
    
    while (True):
        answer = input(f"Please enter the over-height limit, between {int(cfg.overheightLimMin)} and {int(cfg.overheightLimMax)} metres, as a number only. Press enter without entering a value for the default limit. \nOver-height limit (m): ")
        
        # accept the blank input
        if answer == "":
            print(f"Using default over-height limit of {cfg.overheightLimDefault:.1f} metres.")
            break
        
        try:
            answerFloat = float(answer)
        except ValueError:
            print("That was not a valid input, please read the instructions carefully.\n")
            continue
        
        if cfg.overheightLimMin <= answerFloat <= cfg.overheightLimMax:
            result = answerFloat
            break

    return result


def short_delay_us(us):
    """A blocking delay of length 'us' microseconds. Does NOT yield to the system scheduler for consistent performance.

    Parameters
    ----------
    us : int or float
        The delay length in microseconds.
    """
    end = time.perf_counter() + (us / 1_000_000)
    while time.perf_counter() < end:
        pass


