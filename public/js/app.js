var hackathonApp = angular.module('meowAdversity', [])
.run(($rootScope) => {
  $rootScope.$on("$stateChangeError", console.log.bind(console));
})

hackathonApp.controller('MainCtrl', [
  '$scope', 
  '$timeout',
  function($scope, $timeout) {
    
    // start controller
    $scope.words = [{text: "Sunday morning, rain is falling", startTime: 1200}, 
    {text: "Steal some covers, share some skin", startTime: 3600}, 
    {text: "Clouds are shrouding us in moments unforgettable", startTime: 6000}, 
    {text: "You twist to fit the mold that I am in", startTime: 8400}]

    // Will be changed to reflect actual song start
    $scope.songStart = moment();

    $scope.checkForNextWord = function() {
      var currentTime = moment();
      if ($scope.words.length == 0) return;
      var startTime = $scope.words[0].startTime; 
      if (currentTime.diff(songStart) < startTime) {
        console.log($scope.words.shift());
      }
      $timeout(function() {
        $scope.checkForNextWord();
      }, 13);
    };

    $scope.checkForNextWord(); 
  }
]);


