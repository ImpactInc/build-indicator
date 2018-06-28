
#include "FastLED.h"

#define NUM_LEDS 8
#define DATA_LINE 6

#define BAUD_RATE 115200

CRGB leds[NUM_LEDS];

void setup() {
  Serial.begin(BAUD_RATE);
  LEDS.addLeds<WS2812B, DATA_LINE, GRB>(leds, NUM_LEDS);

  for (int i = 0; i < NUM_LEDS; i++) {
    leds[i] = CRGB::Black;
    FastLED.show();
  }
}

void loop() {
  // Wait until a char comes in
  while (!Serial.available());
  // Read the incoming char
  char serialIn = Serial.read();
  if (serialIn == 0x01) {
    // Start frame command - Read in the incoming data for every LED.
    // 3 bytes for each LED will come in - R1G1B1R2G2B2...
    Serial.readBytes((char*)leds, NUM_LEDS * 3);
    FastLED.show();
  }
}
