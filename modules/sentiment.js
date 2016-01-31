var Sentiment = function () {};

var properties = require('./properties');
var request = require('request');

var apiKey = properties.get('alchemy.apikey');

var sentimentApiTemplate = 'http://gateway-a.watsonplatform.net/calls/text/TextGetTextSentiment' +
    '?text=${text}&outputMode=json&showSourceText=1&apikey=' + apiKey;

/**
 * Get sentiment for each line of a line of text
 * @param lines - lines of lyrical text
 */
Sentiment.prototype.getSentiments = function (lines, callback) {
    console.log('calling sentiment api');
    var results = lines.map(function(line, index) {
        return {line: line};
    });

    lines.forEach(function (line, index) {
        var sentimentApiUrl = sentimentApiTemplate.replace('${text}', line);
        request({url: sentimentApiUrl, json: true}, function(error, response, body) {
            var score = 0;
            if (body.status === 'ERROR') {
                console.error('bad request', body);
                score = 'error';
            } else if (body.docSentiment && body.docSentiment.score) {
                score = body.docSentiment.score;
            }
            results[index].sentimentScore = score;
            for (var iResult in results) {
                if (!results[iResult].hasOwnProperty('sentimentScore')) {
                    return;
                }
            }
            callback(results);
        });
    });
};

module.exports = new Sentiment();

