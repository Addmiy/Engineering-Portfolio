# The file containing subsystem 4 logic
# Created By : Team F16
# Updated Date: 2026-05-16
# version ='1.0'

import config as cfg
import tl3
import wl12
import pa1

def sub4_logic(board, sub1Overriden, heights, overheightLimit):
    """This function has the logic for the subsystem 4 features and should be called repeatedly in the main loop.

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

    Returns
    -------
    sub1Overriden
        As described above.
        Can't pass  by reference so it is returned.
    """
    US3latest = heights[2]
    US4latest = heights[3]

    if US3latest > overheightLimit:
        if (US3latest <= US4latest + cfg.sub4Sonar34Tolerance and US3latest >= US4latest - cfg.sub4Sonar34Tolerance):
            # If we are here the sensors agree that there is an overheight vehicle.
            # They need to agree per 4.R2.
            
            tl3.TL3_start_red(board) # 4.R1
            
            wl12.WL2_start_flash_red(board) # 4.G1 (see diagrams for proof of 4.G2)
            
            pa1.PA1_ring(board) # 4.I1
            sub1Overriden = True # block subsystem 1's control of TL1, TL2, WL1 per 4.I1
            wl12.WL1_start_flash_fast() # per 4.I1
        
        
    else:
        # US3 believes that there is no overheight vehicle
        tl3.TL3_start_green(board) # 4.R1
        wl12.WL2_stop_flash_red(board) # 4.G1 (see diagrams for proof of 4.G2)
        pa1.PA1_silence(board) # 4.I1
        sub1Overriden = False # release control of TL1, TL2, WL1 back to subsystem 1 per 4.I1
        
    return sub1Overriden

        
    

