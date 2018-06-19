/*
Module to listen for changes in an RSS feed with a specified refresh interval.
Usage:
	const rss_listener = require('./rss_listener');
	rss_listener.listen(reqParams, config.listenInterval, onNewItems, onError);
	
https://github.com/ImpactInc/build-indicator/tree/master/nodejs
*/

const rss_parser_wrapper = require('./rss_parser_wrapper');

var reqParams, pollInterval, onNewItems;//, onError;

// To detect new items
var mostRecentItemDate;
var firstTimeReceiving = true;

const rssReceived = (rss) => {
    console.log('Received ' + rss.length + ' item(s).');
    if (rss && rss.length > 0) {
        if (firstTimeReceiving && rss[0]) {
            firstTimeReceiving = false;
            // Store date in seconds since Epoch
            mostRecentItemDate = rss[0].pubDate / 1000;
        }
        
        // Filter items to those newer than the previously most recent date
        var newItems = rss.filter(item => (mostRecentItemDate < item.pubDate / 1000));
        if (newItems.length > 0) {
            // Sort by release (oldest to newest)
            newItems.sort((item1, item2) => (item1.pubDate / 1000 - item2.pubDate / 1000));

            // Update most recent date
            mostRecentItemDate = newItems[newItems.length-1].pubDate / 1000;

            onNewItems(newItems);
        } else {
	        console.log('No new items.\n');
        }

        //console.log(mostRecentItemDate);
        
        // Load again after the given interval (sec -> msec)
        setTimeout(get, pollInterval * 1000);
    }
}

const error = (err) => {
	console.log(err);
	console.log('Retrying in 5 seconds..');
	setTimeout(get, 5000);
}

const get = () => {
    console.log('Loading feed at '+(new Date())+'...');
    rss_parser_wrapper.get(reqParams, (err, resp) => {
        return err ? error(err) : rssReceived(resp);
    })
}

exports.listen = (reqParams_, pollInterval_, onNewItems_/*, onError_*/) => {
    reqParams = reqParams_, pollInterval = pollInterval_, onNewItems = onNewItems_;//, onError = onError_;
    get();
}