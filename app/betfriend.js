var app = angular.module('app', ['ngRoute', 'ngAnimate']);

app.factory('ergast', ['$http', function($http){

    return {
        callAPI: function(url){

            return $http({
                'url': url,
                'method': 'GET',
                'cache': true
            });
        }
    }
}]);
app.config(function($routeProvider) {
    $routeProvider
        .when('/', {
            templateUrl: 'home/home.html',
            controller: 'homeCtrl'
        })
        .when('/prediction', {
            templateUrl: 'prediction/prediction.html',
            controller: 'predictionCtrl'
        })
        .when('/profile/driver/:driver', {
            templateUrl: 'driver/driverProfile.html',
            controller: 'driverCtrl'
        })
        .when('/profile/constructor/:constructor', {
            templateUrl: 'constructor/constructorProfile.html',
            controller: 'constructorCtrl'
        })
        .otherwise('/')});
app.controller('homeCtrl', ['$scope', '$location', 'ergast', '$interval', function($scope, $location, ergast, $interval){

    //methods for clicking through to the next page
    $scope.getPredictionPage = function(){
        $location.path('/prediction');
    };

    var raceScheduleArr = [];
    var dateNow = new Date();
    var currentRaceIndex;
    var diff;

    //get next race data from ergast API
    ergast.callAPI('http://ergast.com/api/f1/2016.json').then(function(response){
        console.log('SUCCESS', response);
        raceScheduleArr = response.data.MRData.RaceTable.Races;
        console.log('raceScheduleArr: ', raceScheduleArr);
        for(var i=0; i<raceScheduleArr.length; i++){
            var raceDate = raceScheduleArr[i].date + " " + raceScheduleArr[i].time;
            raceDate = new Date(raceDate);
            diff = (raceDate - dateNow);
            //console.log(diff);
            if (diff>0){
                $scope.raceName = raceScheduleArr[i].raceName;
                $scope.raceDate = new Date(raceScheduleArr[i].date).toDateString();
                $scope.circuitName = raceScheduleArr[i].Circuit.circuitName;
                $scope.round = raceScheduleArr[i].round;
                currentRaceIndex = i;
                break;
            }
        }
    }, function(error){console.log('ERROR', error);});

    //homepage countdown timer
    $interval(function(){
        diff -= 1000;
        var d = diff / (1000*60*60*24);
        var h = (diff % (1000*60*60*24)) / (1000*60*60);
        var m = ((diff % (1000*60*60*24)) % (1000*60*60)) / (1000*60);
        var s = (((diff % (1000*60*60*24)) % (1000*60*60)) % (1000*60)) / 1000;

        $scope.days = Math.floor(d);
        $scope.hours = Math.floor(h);
        $scope.minutes = Math.floor(m);
        $scope.seconds = Math.floor(s);

    },1000);

    //homepage background image randomizer
    var rand = Math.abs(Math.random()*100);
    if (rand <50){
        $scope.img1 = true;
        $scope.img2 = false;
    }
    else {
        $scope.img1 = false;
        $scope.img2 = true;
    }


}]);
app.controller('predictionCtrl', ['$scope', function($scope){





}]);
app.controller('driverCtrl', ['$scope', function($scope){}]);
app.controller('constructorCtrl', ['$scope', function($scope){}]);
