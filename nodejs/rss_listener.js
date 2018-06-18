const rss_parser_wrapper = require('./rss_parser_wrapper');

var reqParams, reloadInterval, onNewItems, onError;

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

        var newItems = rss.filter(item => (mostRecentItemDate < item.pubDate / 1000));
        if (newItems.length > 0) {
            // Sort by release (newest to oldest)
            newItems.sort((item1, item2) => (item2.pubDate / 1000 - item1.pubDate / 1000));

            // Update most recent date
            mostRecentItemDate = newItems[0].pubDate / 1000;

            onNewItems(newItems);
        } else {
	        console.log('No new items.\n');
        }

        //console.log(mostRecentItemDate);

        setTimeout(get, reloadInterval * 1000);
    }
}

const get = () => {
    console.log('Loading feed...');
    rss_parser_wrapper.get(reqParams, (err, resp) => {
        return err ? onError(err) : rssReceived(resp);
    })
}

exports.listen = function(reqParams_, reloadInterval_, onNewItems_, onError_) {
    reqParams = reqParams_, reloadInterval = reloadInterval_, onNewItems = onNewItems_, onError = onError_;
    get();
}