#!/bin/bash

##Text to speech

pico2wave -l en-GB -w clean.wav "$1"      ## Use offline Pico TTS and create a wav file of the string from arguement $1 
sox clean.wav darth.wav pitch -580 echo 0.8 0.88 40 0.5 bass +5 treble +5 gain -n 
## Drop pitch, add echo, boost bass and treble, normalise 


if [ "$2" = "clean" ]
then
    play clean.wav
## Capability to play the clean file before modifications (add arguement clean after string)
## Usage: ./filename.sh "String to say" clean

elif [ "$2" = "gain" ]
then
    play darth.wav gain -n $3 tempo 0.95
## Capability to play the modified wav file with the  specified dB gain
## Usage: ./filename.sh "String to say" gain +3
else
    play darth.wav tempo 0.95
## if no valid added arguements, play the modified wav file with tempo 0.95
fi
