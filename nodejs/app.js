/*
Sample config.json file:
{
	"url" : "https://abc.com/rss",
	"user" : "username",
	"pass" : "123",
	"listenInterval" : 10
}
*/

const fs = require('fs');
// JSON configuration file stores the RSS URL, watch interval, and Basic Auth user/pass (for internal testing stages)
var config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
//console.log(config);

// Basic authentication for testing
var url = config.url.replace('://', '://' + encodeURIComponent(config.user) + ':' + encodeURIComponent(config.pass) + '@');
//var url = 'https://srv.devjoe.com/impact/rss_samples/3.rss';

// Paramaters for the 'request' module which will GET the URL
const reqParams = {
    url: url,
    method: 'GET',
    gzip: true
}

// Function called whenever new items are available
const onNewItems = (items) => {
    // Print out the new items
    items.forEach(item => console.log(item.pubDate + ', ' + item.title));
}

/*// Function called on error
const onError = (err) => {
	console.log('Error: ' + err);
}*/

// Start listening for new items. Interval is specified in seconds
const rss_listener = require('./rss_listener');
rss_listener.listen(reqParams, config.pollInterval, onNewItems/*, onError*/);

// Server

var express = require('express');
var app = express();
var router = express.Router();

var staticPath = __dirname + '/static/';
var webPath = __dirname + '/web/';

router.get('/', function(req, res) {
    res.sendFile(webPath + 'main.html');
});
app.use('/', router);

app.use('/static', express.static(staticPath));


//app.get('/', (req, res) => res.send('Hello World!'));
app.listen(8080, () => console.log('Listening on port 8080.'));