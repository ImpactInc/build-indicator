/*
Sample config.json file:
{
	"url" : "https://abc.com/rss",
	"user" : "username",
	"pass" : "123",
	"listenInterval" : 10
}
*/

// Using the feed-watcher package
const fs = require('fs');
const express = require('express');
const app = express();

// JSON configuration file stores the RSS URL, watch interval, and Basic Auth user/pass (for internal testing stages)
var config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
//console.log(config);

// Basic authentication for testing
var url = config.url.replace('://', '://' + encodeURIComponent(config.user) + ':' + encodeURIComponent(config.pass) + '@');
//var url = 'https://srv.devjoe.com/impact/rss_samples/1.rss';

// Paramaters for the 'request' module which will GET the URL
const reqParams = {
    url: url,
    method: 'GET',
    gzip: true
}

// Function called whenever new items are available
const onNewItems = function(items) {
    // Print out the new items
    items.forEach(item => console.log(item.pubDate + ', ' + item.title));
}

// Start listening for new items. Interval is specified in seconds
const rss_listener = require('./rss_listener');
rss_listener.listen(reqParams, config.listenInterval, onNewItems);

//app.get('/', (req, res) => res.send('Hello World!'));
//app.listen(8080, () => console.log('Example app listening on port 3000!'));