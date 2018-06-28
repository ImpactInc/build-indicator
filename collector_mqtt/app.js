var request = require('request');
var AsyncPolling = require('async-polling');

var mqtt = require('mqtt');

const fs = require('fs');
// Read config.json file
// Note: pollInterval is specified in seconds.
var config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

// Connect the MQTT client
var client = mqtt.connect(config.mqtt_address);

// Remove any trailing forward-slash(es) in the URL
while (config.bamboo_address[config.bamboo_address.length - 1] == '/') {
    config.bamboo_address = config.bamboo_address.slice(0, -1);
}

// API endpoint URLs
var dashboardSummaryAPIEndpoint = '/build/admin/ajax/getDashboardSummary.action?os_authType=basic';
var resultAPIEndpoint = '/rest/api/latest/result/_RESULT_.json?os_authType=basic'; // Replace _RESULT_ with resultKey

// Bamboo auth data required for the 'request' module
const authData = {
    user: config.bamboo_user,
    pass: config.bamboo_pass,
    sendImmediately: true
};

var storedBuildsInProgress = []; //Object with 'resultKey' and 'chainName' keys

// Run the below function in perpetuity - when the end() function is called below, it starts the timer for the firing of the next run.
AsyncPolling((end) => {
        // POST the dashboard summary API to get ongoing builds
        request({
            url: config.bamboo_address + dashboardSummaryAPIEndpoint,
            auth: authData,
            json: true
        }, (err, res, body) => {
            if (err) {
                // Network error, etc. - try again
                end(err);
            } else if (!(body && body.status && body.status == 'OK')) {
                // Some other error - try again
                end('Invalid response.'); // start timer for next poll
            } else {
                end(); // start timer for next poll

                //Get the new build plans in progress
                var buildsInProgress = [];
                body.builds && body.builds.forEach((build) => {
                    build.resultKey && buildsInProgress.push({
                        resultKey: build.resultKey,
                        chainName: build.chainName || ''
                    });
                });

                // Filter and get the new builds which have just started (did not appear earlier in stored builds)
                var newBuildsInProgress = buildsInProgress.filter((build) => {
                    var doesAppearEarlier = false;
                    storedBuildsInProgress.forEach((storedBuild) => {
                        doesAppearEarlier |= storedBuild.resultKey === build.resultKey;
                    });
                    return !doesAppearEarlier;
                });

                // Print out any new builds
                newBuildsInProgress.forEach((build) => {
                    var d = new Date();
                    var time = d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
                    console.log(time + ': "' + build.resultKey + '" / "' + build.chainName + '" started.');
                    // Message data to send
                    var messageData = {
                        state: 'building',
                        resultKey: build.resultKey,
                        chainName: build.chainName
                    };
                    //Publish a MQTT message with the JSON stringified data
                    client.publish('buildchange', JSON.stringify(messageData));
                });

                // Filter and get the builds which have just completed (appears earlier in stored builds but no longer present)
                var completedBuilds = storedBuildsInProgress.filter((storedBuild) => {
                    var doesAppearEarlier = false;
                    buildsInProgress.forEach((build) => {
                        doesAppearEarlier |= build.resultKey === storedBuild.resultKey;
                    });
                    return !doesAppearEarlier;
                });

                // Print out any completed builds
                completedBuilds.forEach((build) => {
                    request({
                        url: config.bamboo_address + resultAPIEndpoint.replace('_RESULT_', build.resultKey),
                        auth: authData,
                        json: true
                    }, (err2, res2, body2) => {
                        var d = new Date();
                        var time = d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
                        if (!err2) {
                            // If we received valid JSON data.
                            // NOTE: buildState may not be defined if the user has insufficient permissions. In this case,
	                        // we let it take on the value 'not available in json', and it will be detected as a failure.
	                        // This can be fixed in future with additional states for failures, etc.
                            var buildState = body2.buildState || 'not available in json';
                            console.log(time + ': "' + build.resultKey + '" / "' + build.chainName + '" completed, state: ' + buildState);
                            // Message data to send
                            var messageData = {
                                state: buildState === 'Successful' ? 'build_success' : 'build_fail',
                                resultKey: build.resultKey,
                                chainName: build.chainName,
                                buildTestSummary: body2.buildTestSummary || '',
                                buildReason: body2.buildReason || '',
                                reasonSummary: body2.reasonSummary || '',
                                failedTestCount: body2.failedTestCount || null
                            };
                            //Publish a MQTT message with the JSON stringified data
                            client.publish('buildchange', JSON.stringify(messageData));
                        } else {
                            console.log(time + ': "' + build.resultKey + '" / "' + build.chainName + '" completed, error getting state: ' + err2);
                        }
                    });
                });

                // Update the builds in progress
                storedBuildsInProgress = buildsInProgress;

                //console.log('Build keys in progress: ' + resultKeysInProgress);
                //process.stdout.write('.');
            }
        });
    }, config.pollInterval * 1000) // Set the poll interval (in milliseconds)
    .on('error', (error) => {
        // Display error
        console.log('Polling encountered an error: ' + error);
    })
    .run(); // Start the async polling function

//
//
//
//
//