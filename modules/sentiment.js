var Sentiment = function () {};
var properties = require('./properties');

/**
 * Get sentiment for each line of a line of text
 * @param lines - lines of lyrical text
 */
Sentiment.prototype.getSentiments = function (lines) {
    return properties.get('alchemy.apikey');
};

module.exports = new Sentiment();

