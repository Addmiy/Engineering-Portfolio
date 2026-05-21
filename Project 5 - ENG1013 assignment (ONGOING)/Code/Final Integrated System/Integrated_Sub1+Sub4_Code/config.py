# The file containing configuration settings for the project
# Created By : Team F16
# Updated Date: 2026-05-16
# version ='1.0'


# 74HC595 pins (SIPO shift reg). Note that nOE isn't used (always outputting)
srclkPin = 19   # A5 
rclkPin  = 18   # A4
serPin   = 17   # A3

# WL1 pins
wl1LeftPin = 13
wl1RightPin = 14

# WL2 pins
wl2EnablePin = 15 # A1

# TL3 pins
tl3GreenPin = 10
tl3RedPin = 11

# PA1 pin
pa1ResetPin = 12

# Shift register indexes
srTL1Red = 5
srTL1Ylw = 4
srTL1Grn = 3
srTL2Red = 2
srTL2Ylw = 1
srTL2Grn = 0

# Overheight limit selection variables (all in metres)
overheightLimMin     = 2.0
overheightLimMax     = 5.0
overheightLimDefault = 4.0


# Subsystem-specific settings
#   Sub 1:
sub1ThresholdTime = 500 / (80 / 3.6)  # 500 metres at 80 km/h (factor of 3.6 converts km/h to m/s)

#   Sub 4:
sub4Sonar34Tolerance = 0.3 # metres