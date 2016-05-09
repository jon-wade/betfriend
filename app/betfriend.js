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
app.controller('homeCtrl', ['$scope', '$location', 'ergast', '$interval', '$rootScope', function($scope, $location, ergast, $interval, $rootScope){

    //switch off navigation
    $rootScope.bckHide = true;
    $rootScope.fwdHide = true;

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
                $rootScope.circuitId = raceScheduleArr[i].Circuit.circuitId;
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
app.controller('predictionCtrl', ['$scope', 'ergast', '$rootScope', '$q', function($scope, ergast, $rootScope, $q){

    //switch on the back button
    $rootScope.bckHide = false;
    $rootScope.fwdHide = true;
    $scope.circuitHistory = [];
    var counter = 0;

    //get data for this controller from the ergast API
    $scope.getData = function() {
        console.log('GETTING DATA');
        return $q(function (resolve, reject) {
            //initially need a list of all drivers in the next grand prix
            //TODO: the driver list for the current race is based on the previous race's drivers - currently hardcoded!!!!
            ergast.callAPI('http://ergast.com/api/f1/2016/4/drivers.json').then(function (response) {
                console.log(response);
                $scope.driverArr = response.data.MRData.DriverTable.Drivers;
                console.log($scope.driverArr);
                //get each drivers history at current circuit
                for (var i = 0; i < $scope.driverArr.length; i++) {
                    //then we need each driver's historic performance at that track
                    ergast.callAPI('http://ergast.com/api/f1/circuits/' + $rootScope.circuitId + '/drivers/' + $scope.driverArr[i].driverId + '/results.json')
                        .then(function (response) {
                            //console.log(response);
                            $scope.circuitHistory[counter] = response.data.MRData.RaceTable.Races;
                            //console.log($rootScope.circuitHistory);
                            counter++;
                            if (counter==$scope.driverArr.length){
                                counter=0;
                                resolve();
                            }
                        }, function (error) {
                            console.log(error);
                            reject();
                        });
                }
            }, function (error) {
            });
        });
    };

    $scope.getData().then(function(){
        console.log('ALL DATA RETURNED', $scope.circuitHistory);
        //work out score for each driver based on historic track record at circuit

        //first create a driver data storage object from the current driverArr
        $scope.driverDataObj = {};
        for (var x=0; x<$scope.driverArr.length; x++){
            $scope.driverDataObj[$scope.driverArr[x].driverId] = $scope.driverArr[x];
        }
        //append the historic track performance to the object

        for (var i=0; i<$scope.circuitHistory.length; i++){

            //some drivers don't have any history at the track, so check for empty arrays
            if ($scope.circuitHistory[i].length != 0){

                //console.log($scope.circuitHistory[i][0].Results[0].Driver.driverId);
                //in the driverDataObj, by driverID, add a new property, trackHistory, equal to the data
                //returned for that driverId through the call to the ergastAPI (the $scope.circuitHistory object)
                $scope.driverDataObj[$scope.circuitHistory[i][0].Results[0].Driver.driverId].trackHistory = $scope.circuitHistory[i];
            }
        }

        //print out the historic race results for each driver in the race

        for (var driver in $scope.driverDataObj){
            console.log(driver);
            if($scope.driverDataObj[driver].trackHistory == undefined){
                $scope.driverDataObj[driver].trackHistory = [];
            }
            else {
                for (var k = 0; k < $scope.driverDataObj[driver].trackHistory.length; k++) {
                    console.log('Season: ', $scope.driverDataObj[driver].trackHistory[k].season);
                    console.log('Position: ', $scope.driverDataObj[driver].trackHistory[k].Results[0].position);
                    //console.log(driver, $scope.driverDataObj[driver].trackHistory[k].season);
                }
            }
        }


        console.log($scope.driverDataObj);



    }, function(){});













}]);
app.controller('driverCtrl', ['$scope', function($scope){}]);
app.controller('constructorCtrl', ['$scope', function($scope){}]);
