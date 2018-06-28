# Arduino Glediator to WS2812B Receiver sketch

##Usage

###Prerequisites

Install the [FastLED](http://fastled.io/) library within the Arduino IDE.

### Configuration

Within the Arduino sketch,
* Set `NUM_LEDS`, the number of WS2812B LEDs you will be using. 
* Set `DATA_LINE`, the Arduino data line which you will be connecting to the data input on the LED strip. 
* We make use of a baud rate of 115200 as it works reliably on the Raspberry Pi, so no change is required; however, it can be changed by modifying `BAUD_RATE`.

Note that some LEDs may be wired differently internally, so the red, green and blue channels may be swapped; this can be changed by modifying the `GRB` constant to some other combination of those three colors if things are off.

### Installation

Upload the sketch provided in `WS2812B_Impact_Glediator` to your 16MHz Arduino / Arduino-compatible board, such as a Uno or Nano.
