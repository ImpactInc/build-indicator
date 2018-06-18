// Using the feed-watcher package
var Watcher = require('feed-watcher');

var fs = require('fs');

// JSON configuration file stores the RSS URL, watch interval, and Basic Auth user/pass (for internal testing stages)
var config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
//console.log(config);

// Basic authentication for testing
var url = config.url.replace('://', '://' + encodeURIComponent(config.user) + ':' + encodeURIComponent(config.pass) + '@');

var watcher = new Watcher(url, config.watchInterval);

// Upon a new item in the feed
watcher.on('new entries', function(entries) {
	// Notify for each new item
	entries.forEach(entry => console.log('New entry at ' + entry.pubdate + ': ' + entry.title));
})

// Start watching the feed
watcher
	.start()
	.then(entries => console.log('Got entries, count: ' + entries.length))
	.catch(err => console.error(err));

// Stop watching the feed
//watcher.stop();