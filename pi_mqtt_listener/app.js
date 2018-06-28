var request = require('request');

const fs = require('fs');
// Read config.json file
var config = JSON.parse(fs.readFileSync('config.json', 'utf8')); // JSON configuration file

var mqtt = require('mqtt');
// Connect the MQTT client
var client = mqtt.connect(config.mqtt_address);

// Store variables specific to each bank. NOTE: In this prototype, two banks are present (of four
// LEDs each), so these default values are "hard coded" for two banks. It will be trivial to extend to
// an arbitary number of banks.
var numOngoingBuildsForBank = [0, 0];
var prevSuccessOrFailStatesOnBanks = [null, null];

// Store queue of message objects received, to be processed in order.
var messageQueue = [];
var isMessageQueueBeingExecuted = false;

// Stores the number of POSTs required for the current message; when this is 0, we are done with the current
// message and can move on to the next message in the queue.
var numPOSTs = 0;

// Set the two banks to plain black
runLightActions(config.banks[0].url, config.lightActions.black);
runLightActions(config.banks[1].url, config.lightActions.black);

client.on('connect', function() {
    // Subscribe to 'buildchange'
    client.subscribe('buildchange');
    console.log('Subscribed.');
});

// When a message is received
client.on('message', function(topic, message) {
    try {
        var message = JSON.parse(message.toString());
        //fs.appendFileSync('messagelog.txt', JSON.stringify(message) + '\n');
        // Push message to queue
        messageQueue.push(message);
        // Run the queue (if not already in progress)
        !isMessageQueueBeingExecuted && runMessageQueue();
    } catch (e) {
        console.log('JSON parse error: ' + e);
    }
    //client.end();
});

// Runs through the messagre queue; this function calls itself each time it finishes with the current item, and can be called
// manually to start things up.
var runMessageQueue = () => {
    if (messageQueue.length > 0) {
        isMessageQueueBeingExecuted = true;
        runMessage(messageQueue.shift());
    } else {
        isMessageQueueBeingExecuted = false;
    }
}

// Runs from a given message - the data object is the parsed object given from the MQTT message
var runMessage = (data) => {
    var wasMatch = false;
    // Loop through each bank to try to find the relevant resultKey/chainName
    for (bank in config.banks) {
        ((bankIndex) => {
            var bankResultKeys = config.banks[bankIndex].resultKeys;
            var bankChainNames = config.banks[bankIndex].chainNames;

            // Detect if the project and branch match - they're what we're looking for.
            // These are defined in config.json
            var projectMatch = false,
                branchMatch = false;
            bankResultKeys.forEach((resultKey) => {
                projectMatch |= new RegExp(resultKey).test(data.resultKey);
            });
            bankChainNames.forEach((chainName) => {
                branchMatch |= new RegExp(chainName).test(data.chainName);
            });

            // Matched project/branch
            if (projectMatch && branchMatch) {
                wasMatch = true;
                var tempState = data.state;
                if (data.state === 'building' && prevSuccessOrFailStatesOnBanks[bankIndex]) {
                    // If we are building after a previous build, fill in the background color of the building animation
                    // to be that of the previous build
                    tempState = 'building_after_' + prevSuccessOrFailStatesOnBanks[bankIndex];
                } else if (data.state !== 'building' && numOngoingBuildsForBank[bankIndex] > 1) {
                    // Show the flash and then building animation with background color of previous build state
                    tempState = data.state + '_and_rebuild';
                }

                // Load and run the light actions.
                // The light actions are definied in the configuration file, and consist of API calls along with their required delay,
                // to allow simple animation choreography.
                numPOSTs += config.lightActions[tempState].length;
                runLightActions(config.banks[bankIndex].url, config.lightActions[tempState]);

                // Speak out the text
                if (data.state !== 'building') {
                    var text = data.state === 'build_success' ? 'Build succeeded. ' : 'Build failed. ';
                    if (data.buildTestSummary && data.buildTestSummary !== 'No tests found' && data.state !== 'build_success') {
                        text += data.buildTestSummary;
                    }
                    numPOSTs++;
                    makePost(config.tts.url, {
                        say: text
                    });
                }

                // Determine the number of ongoing builds
                if (data.state === 'building') {
                    numOngoingBuildsForBank[bankIndex]++;
                } else {
                    numOngoingBuildsForBank[bankIndex] = Math.max(numOngoingBuildsForBank[bankIndex] - 1, 0);
                }
                data.state !== 'building' && (prevSuccessOrFailStatesOnBanks[bankIndex] = data.state);

                console.log('Bank ' + bankIndex + ': ' + data.state + ', ' + tempState + ' (' + data.resultKey + ', ' + data.chainName + ')');
            }

            //console.log(projectMatch + ', ' + branchMatch);
        })(bank);
    }
    if (!wasMatch) {
        // No match, try the next item in the queue
        runMessageQueue();
    }
}

// Make a series of POSTs for a given array of light actions; POSTs will be made after a given delay in each action
function runLightActions(url, lightActions) {
    lightActions.forEach((action) => {
        setTimeout(() => {
            makePost(url, action.postData);
        }, action.delay || 0);
    });
}

// Make a POST to a given URL with given data
var makePost = (url, postData) => {
    request.post({
        url: url,
        json: true,
        form: postData
    }, (err, res, body) => {
        numPOSTs = Math.max(numPOSTs - 1, 0);
        if (numPOSTs == 0) {
            runMessageQueue();
        }
        if (!err) {
            //console.log('done');
        } else {
            console.log('Request error: ' + err);
        }
    });
}