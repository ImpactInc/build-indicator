var express = require('express');
var bodyParser = require('body-parser');

//var shell = require('shelljs');
var child_process = require('child_process');
var spawn = child_process.spawn;


// Port to run the 'REST' API on
var restPort = 8080;

var SerialPort = require('serialport');

// Frame rate to update LEDs at
var frameRate = 60;

// Total num. of LEDs
var numLEDs = 8;

// Num. of banks
var numBanks = 2;

// Stores colors for each LED
var ledColors = {};

// Initialise color for each LED
for (var i = 0; i < numLEDs; i++) {
    ledColors['led' + i] = {
        color: '#100600', // Default to an orange color
        color_alt: null // Alternative color used in animations eg. wave with two colors
    };
}

// LED indices for each bank. In this case two banks are hard coded with 4 LEDs each
var bankMap = [
    ['led0', 'led1', 'led2', 'led3'],
    ['led4', 'led5', 'led6', 'led7']
];

// Stores current animation for each bank
var bankAnimations = [];

// Initialise null animations for each bank
for (var i = 0; i < numBanks; i++) {
    bankAnimations.push({
        name: null,
        speed: 1.0
    });
}

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));


// GET /
app.get('/', function(req, res) {
    res.json({
        ledColors: ledColors,
        bankAnimations: bankAnimations
    });
});

// POST eg. /leds/bank/1/update
app.post('/leds/bank/:bankid([0-' + (numBanks - 1) + ']{1})/update', function(req, res) {
    var bankID = req.params.bankid;
    var data = req.body;
    if (data.color) {
        bankMap[bankID].forEach((led) => {
	        ledColors[led].color = data.color;
	        ledColors[led].color_alt = data.color_alt;
	    });
        if (data.animation && data.animation.name) {
            bankAnimations[bankID].name = data.animation.name;
            data.animation.speed && (bankAnimations[bankID].speed = data.animation.speed);
            frameCount = 0; // Reset animation frame count
        } else {
            bankAnimations[bankID].name = null; // Clear animation
        }
    }
    res.json({
        message: "Success",
        ledColors: ledColors,
        bankAnimations: bankAnimations
    });
});

// POST /leds/raw/update
// This works fine, but is not being used at the moment.
/*app.post('/leds/raw/update', function(req, res) {
    var data = req.body;
    if (data.individual) {
        // Set the colors for individual LED(s)
        for (led in data.individual) {
            if (ledColors[led] && data.individual[led].color) {
                ledColors[led].color = data.individual[led].color;
            }
        }
    } else if (data.range && data.range.begin && data.range.end && data.range.begin <= data.range.end && data.range.color) {
        console.log(data.range);
        // Set the colors for a range of LEDs
        for (led in ledColors) {
            if (led >= data.range.begin && led <= data.range.end) {
                ledColors[led].color = data.range.color;
            }
        }
    } else if (data.fill && data.fill.color) {
        // Set the color of all LEDs
        for (led in ledColors) {
            ledColors[led].color = data.fill.color;
        }
    }
    res.json({
        message: "Success",
        ledColors: ledColors
    });
});*/

//POST /tts
app.post('/tts', function(req, res) {
    var data = req.body;
    var say = data.say;
    var gain = data.gain || 1;

    spawn('./tts.sh', [sanitizeString(say), sanitizeString(' gain ' + gain)], {
        stdio: 'ignore', // piping all stdio to /dev/null
        detached: true
    }).unref();

    //console.log(req.body);
    //say="this is not undefined";
    /*setTimeout(() => {
      shell.exec('nohub ./tts_test.sh "'+say+'" gain '+gain+' &');
    },100);*/


    res.json({
        message: "Success",
        say: say
    });
});

// Start the REST API
app.listen(restPort);




// Serial connection to the Arduino, with communicaiton done with the Glediator protocol
var port = new SerialPort('/dev/ttyS0', {
    baudRate: 115200
});

var frameCount = 0;

// Main animation loop
var loop = () => {
    var serialData = [0x01]; // Start with the frame start command

    for (var i = 0; i < numBanks; i++) {
        var ledIndexWithinBank = 0;
        bankMap[i].forEach((led) => { // For every LED in bank
            // Convert hex color to rgb; if failed, return black
            const rgbColor = hexToRGB(ledColors[led].color) || {
                r: 0,
                g: 0,
                b: 0
            };
            // Optional secondary color used as the background in animations. Defaults to black.
            const altRgbColor = hexToRGB(ledColors[led].color_alt || '#000000');
            
            if (bankAnimations[i].name) { // If an animation is ongoing
                const animName = bankAnimations[i].name;
                const animSpeed = bankAnimations[i].speed;
                var brightnessCoefficient;
                if (animName == 'wave') {
                    brightnessCoefficient = (Math.sin((ledIndexWithinBank * 8 - frameCount) / 12.0 * (60 / frameRate) * animSpeed) + 1) / 2;
                } else if (animName == 'pulse') {
                    brightnessCoefficient = (Math.sin(-frameCount / 12.0 * (60 / frameRate) * animSpeed) + 1) / 2;
                } else if (animName == 'fadeout') {
                    brightnessCoefficient = ((parseInt(frameCount * animSpeed) % frameRate) / frameRate);
                    brightnessCoefficient = Math.pow(brightnessCoefficient - 1, 2);
                } else if (animName == 'flashout') {
                    brightnessCoefficient = Math.max(0, Math.min(1, 4.5 - 8 * ((parseInt(frameCount * animSpeed) % frameRate) / frameRate)));
                    //brightnessCoefficient = Math.pow(brightnessCoefficient-1, 2);
                } else if (animName == 'flash') {
                    brightnessCoefficient = (parseInt(frameCount * animSpeed) % frameRate) <= frameRate / 2 ? 1 : 0;
                } else { // Unknown animation
                    brightnessCoefficient = 1;
                }
                // Scale grayscale brightness
                rgbColor.r = brightnessCoefficient * rgbColor.r + (1 - brightnessCoefficient) * altRgbColor.r;
                rgbColor.g = brightnessCoefficient * rgbColor.g + (1 - brightnessCoefficient) * altRgbColor.g;
                rgbColor.b = brightnessCoefficient * rgbColor.b + (1 - brightnessCoefficient) * altRgbColor.b;
            }
            // Convert to byte
            rgbColor.r = parseInt(Math.floor(rgbColor.r));
            rgbColor.g = parseInt(Math.floor(rgbColor.g));
            rgbColor.b = parseInt(Math.floor(rgbColor.b));
            // Replace byte 0x01 with 0x02, as 0x01 is reserved for the start frame command
            (rgbColor.r == 1) && (rgbColor.r = 2);
            (rgbColor.g == 1) && (rgbColor.g = 2);
            (rgbColor.b == 1) && (rgbColor.b = 2);
            // Three bytes for RGB channels of each LED pushed out
            serialData = serialData.concat([rgbColor.r, rgbColor.g, rgbColor.b]);
            ledIndexWithinBank++;
        });
    }

    frameCount++;
    
    // Once 1+3*(Num LEDs) are in the buffer, frame is complete and can be written
    port.write(new Buffer(serialData), (err) => {
        if (err) {
            return console.log('Error on write: ', err.message);
        } else {
            // Run the next frame after the required delay to maintain framerate
            setTimeout(loop, 1000 / frameRate);
        }
    });
}

// Start the serial loop
loop();

function hexToRGB(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function sanitizeString(str){
    str = str.replace(/[^a-z0-9áéíóúñü \.,_-]/gim,"");
    return str.trim();
}

