hackathonApp.controller('MainCtrl', [
  '$scope', 
  '$timeout']


var sampleData = [{text: "Sunday morning, rain is falling", startTime: 1200}, 
{text: "Steal some covers, share some skin", startTime: 3600}, 
{text: "Clouds are shrouding us in moments unforgettable", startTime: 6000}, 
{text: "You twist to fit the mold that I am in", startTime: 8400}]

// Will be changed to reflect actual song start
var songStart = moment();

var currentTime = moment();

// Difference in milliseconds
var diff = function(startTime) {
  if (currentTime.diff(songStart) < startTime) {
    
  }
};
