# LED Build Indicator
Infinitely extensible Raspberry Pi-based LED/speaker based build status indicator, for teams using **Atlassian's Bamboo** for continuous integration/deployment.

[![](images/darth_small.jpg "Our build indicator")](images/darth.jpg)

## What it is
A device (and software behind the scenes) that keeps teams up to date on the status of various builds.
Multiple projects and branches can be tracked, and an addressable RGB LED strip will flash/animate to indicate when things change; speaker output can utilise text-to-speech to communicate further information.

## How it works
A collector script periodically polls Bamboo's APIs to check for new builds, and utilises MQTT to notify any Raspberry Pi listeners on what's happened. The Pis receive the data, and if relevant to the projects/branches they're interested in, they will flash/animate the RGB LEDs and play a sound/speak.

## Hardware
* (Optional) server to run the collector script to poll Bamboo data and publish build change messages. This can be run directly on the..
* Raspberry Pi - receives build change messages, and sends RGB LED/audio data to an..
* Arduino Nano - Receives RGB LED data from the Pi and drives an..
* Addressable RGB LED strip, featuring WS2812B RGB LEDs
* Audio speaker - connects to the Pi's standard 3.5mm audio jack

The LED strip is driven by an Arduino Nano due to the fast data rates required by the LEDs, with the Pi sending LED commands to the Arduino via TTL serial on the GPIO port using the [Glediator protocol](https://metalab.at/wiki/Blinkenschild).  
The speaker will speak out relevant actions using Text-to-Speech.

### Schematic
![](images/schematic.jpg "Hardware schematic")

## Installation

### Arduino

[See Arduino instructions here](arduino/).

### Node.js

Install Node.js on your Raspberry Pi; we happened to make use of version `6.12.2`.

Install [nodemon](https://nodemon.io/):
```
npm install -g nodemon
```

Once installed, clone this repo and navigate to the `pi_mqtt_listener`, `pi_rest_ledandsound` anf `collector_mqtt` directories respectively; within each, run the following to install required Node packages:
```
npm install
```
Note that `collector_mqtt` can instead be installed and run on another server or device.

### Mosquitto

Install the Mosquitto MQQT broker on your Raspberry Pi or external server; [see here](https://learn.adafruit.com/diy-esp8266-home-security-with-lua-and-mqtt/configuring-mqtt-on-the-raspberry-pi).
We made use of the default configuration for initial testing, however this should be setup securely with appropriate auth.

Install pico2wave - [see here](https://elinux.org/RPi_Text_to_Speech_(Speech_Synthesis))

## Configuration

### Software

* `collector_mqtt/config.json` - Enter your MQTT broker and Bamboo server addresses, and the user/pass combo that should be used to access Bamboo via BASIC authentication. The poll interval (in seconds) specifies how frequently Bamboo will be polled.
* `pi_mqtt_listener/config.json` - Enter your MQTT broker address.

Note that the MQTT broker address defaults to `mqtt://localhost` if Mosquitto is installed on the same device as that of the configuration file.
Additional LED bank and animation configuration is also provided in these configuration files.

### Raspberry Pi Hardware

* [Disable serial port terminal output](https://www.cube-controls.com/2015/11/02/disable-serial-port-terminal-output-on-raspbian/)
to allow use of the serial port for Arduino communication
* Configure your audio settings to output to the 3.5mm audio jack.

## Usage

Start up the separate Node.js scripts. Nodemon is used for reliability as it automatically restarts the script after a crash.
From the repo, run the following on the Pi yo fo do:
```
cd pi_rest_ledandsound/
screen -S pi_rest_ledandsound nodemon app.js
```
Then again, from the repo run the following on the Pi:
```
cd pi_mqtt_listener/
screen -S pi_mqtt_listener nodemon app.js
```
Finally, again from the repo run the following on the Pi or external server:
```
cd collector_mqtt/
screen -S collector_mqtt nodemon app.js
```

## Authors

* **Joseph Rautenbach** - [joeraut](https://github.com/joeraut)
* **Johan Fouche**
* **William Sykes** - [williamsykes](https://github.com/williamsykes)

Also, see the list of [contributors](https://github.com/ImpactInc/build-indicator/graphs/contributors) who participated in this project.

## Acknowledgments

* **Christiaan Witts** - [ChristianWitts](https://github.com/ChristianWitts) - for all the API help
* Werner van Rensburg - tons of API help and other support!

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Code of Conduct

See our [code of conduct](CODE_OF_CONDUCT.md).
