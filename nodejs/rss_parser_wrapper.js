/*
Module to GET and parse an RSS feed. The callback is returned with the contents as an
object, or an error if something went wrong.
Usage:
	const rss_parser_wrapper = require('./rss_parser_wrapper');
	rss_parser_wrapper.get(reqParams, (err, resp) => {
        return err ? onError(err) : rssReceived(resp);
    })
https://github.com/ImpactInc/build-indicator/tree/master/nodejs
*/

exports.get = (reqParams, callback) => {
    // Run inside an IIFE to ensure reliable repeatibility
    return (() => {

        var FeedParser = require('feedparser');
        var request = require('request'); // for fetching the feed

        var rss = [];

        var req = request(reqParams);
        var feedparser = new FeedParser();

        req.on('error', function(err) {
            // handle any request errors
            return callback(err, null);
        });

        req.on('response', function(res) {
            var stream = this; // 'this' is 'req'
            if (res.statusCode !== 200) {
                return this.emit('error', new Error('Bad status code'));
            }
            return stream.pipe(feedparser);
        });

        feedparser.on('error', function(err) {
            // always handle errors
            return callback(err, null);
        });

        feedparser.on('readable', function() {
            var stream = this; // 'this' is 'feedparser', which is a stream
            var item;
            if (item = stream.read()) {
                return rss.push(item);
            }
        });

        return feedparser.on('end', function() {
            if (rss.length === 0) {
                return callback('Empty feed');
            }
            return callback(null, rss);
        });
    })();
};
