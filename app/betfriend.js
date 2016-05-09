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
app.factory('pointsLookup', [function(){

    return {
        getScore: function(position){
            if(position>10){
                return 0;
            }
            else {
                var table = {
                    '1': 25,
                    '2': 18,
                    '3': 15,
                    '4': 12,
                    '5': 10,
                    '6': 8,
                    '7': 6,
                    '8': 4,
                    '9': 2,
                    '10': 1
                };
                return table[position];
            }
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
app.controller('predictionCtrl', ['$scope', 'ergast', '$rootScope', '$q', 'pointsLookup', function($scope, ergast, $rootScope, $q, pointsLookup){

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
                                //now we need to get the constructors data for the circuit!!!
                                //TODO: Next challenge!!! http://ergast.com/api/f1/circuits/catalunya/constructors/mercedes/results
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

        //first create a driverData storage object from the current driverArr to store all data in one place (key: driverId)
        var driverDataObj = {};
        for (var x=0; x<$scope.driverArr.length; x++){
            driverDataObj[$scope.driverArr[x].driverId] = $scope.driverArr[x];
        }

        //then append the historic track performance to the object
        for (var i=0; i<$scope.circuitHistory.length; i++){

            //some drivers don't have any history at the track, so check for empty arrays
            if ($scope.circuitHistory[i].length != 0){

                //console.log($scope.circuitHistory[i][0].Results[0].Driver.driverId);
                //in the driverDataObj, by driverID, add a new property, trackHistory, equal to the data
                //returned for that driverId through the call to the ergastAPI (the $scope.circuitHistory object)
                driverDataObj[$scope.circuitHistory[i][0].Results[0].Driver.driverId].trackHistory = $scope.circuitHistory[i];
            }
        }

        //create driver score based on historic performance

        for (var driver in driverDataObj){

            var trackHistoryScore = 0;

            //debug code
            console.log(driver);

            if(driverDataObj[driver].trackHistory == undefined){

                //if the driver doesn't have any history returned, create a placeholder in the object property
                //so we don't come unstuck trying to call a property that doesn't exist later on
                driverDataObj[driver].trackHistory = [];

                //also give the driver a trackHistoryScore property
                driverDataObj[driver].trackHistoryScore = trackHistoryScore;
            }

            else {

                for (var k = 0; k < driverDataObj[driver].trackHistory.length; k++) {

                    console.log('Season: ', driverDataObj[driver].trackHistory[k].season);

                    //we only want the last 10 year's worth of track data for the algorithm
                    var currentYear = new Date().getFullYear();

                    if(parseInt(driverDataObj[driver].trackHistory[k].season) < currentYear-10){
                        //were not interested in this data
                        console.log('Ignore this data');

                    }
                    else {

                        //here we want to weight the historic performance according to our algorithm requirements
                        console.log('Position: ', driverDataObj[driver].trackHistory[k].Results[0].position);
                        switch(parseInt(driverDataObj[driver].trackHistory[k].season)){
                            case currentYear-1:
                                console.log('case = ', currentYear-1);
                                trackHistoryScore += (pointsLookup.getScore(driverDataObj[driver].trackHistory[k].Results[0].position) * 0.25);
                                console.log('trackHistoryScore', trackHistoryScore);
                                break;
                            case currentYear-2:
                                console.log('case = ', currentYear-2);
                                trackHistoryScore += (pointsLookup.getScore(driverDataObj[driver].trackHistory[k].Results[0].position) * 0.18);
                                console.log('trackHistoryScore', trackHistoryScore);
                                break;
                            case currentYear-3:
                                console.log('case = ', currentYear-3);
                                trackHistoryScore += (pointsLookup.getScore(driverDataObj[driver].trackHistory[k].Results[0].position) * 0.14);
                                console.log('trackHistoryScore', trackHistoryScore);
                                break;
                            case currentYear-4:
                                console.log('case = ', currentYear-4);
                                trackHistoryScore += (pointsLookup.getScore(driverDataObj[driver].trackHistory[k].Results[0].position) * 0.12);
                                console.log('trackHistoryScore', trackHistoryScore);
                                break;
                            case currentYear-5:
                                console.log('case = ', currentYear-5);
                                trackHistoryScore += (pointsLookup.getScore(driverDataObj[driver].trackHistory[k].Results[0].position) * 0.10);
                                console.log('trackHistoryScore', trackHistoryScore);
                                break;
                            case currentYear-6:
                                console.log('case = ', currentYear-6);
                                trackHistoryScore += (pointsLookup.getScore(driverDataObj[driver].trackHistory[k].Results[0].position) * 0.08);
                                console.log('trackHistoryScore', trackHistoryScore);
                                break;
                            case currentYear-7:
                                console.log('case = ', currentYear-7);
                                trackHistoryScore += (pointsLookup.getScore(driverDataObj[driver].trackHistory[k].Results[0].position) * 0.06);
                                console.log('trackHistoryScore', trackHistoryScore);
                                break;
                            case currentYear-8:
                                console.log('case = ', currentYear-8);
                                trackHistoryScore += (pointsLookup.getScore(driverDataObj[driver].trackHistory[k].Results[0].position) * 0.04);
                                console.log('trackHistoryScore', trackHistoryScore);
                                break;
                            case currentYear-9:
                                console.log('case = ', currentYear-9);
                                trackHistoryScore += (pointsLookup.getScore(driverDataObj[driver].trackHistory[k].Results[0].position) * 0.02);
                                console.log('trackHistoryScore', trackHistoryScore);
                                break;
                            case currentYear-10:
                                console.log('case = ', currentYear-10);
                                trackHistoryScore += (pointsLookup.getScore(driverDataObj[driver].trackHistory[k].Results[0].position) * 0.01);
                                console.log('trackHistoryScore', trackHistoryScore);
                                break;
                        }

                        driverDataObj[driver].trackHistoryScore = trackHistoryScore;

                    }
                }
            }
        }

        console.log(driverDataObj);

    }, function(){});













}]);
app.controller('driverCtrl', ['$scope', function($scope){}]);
app.controller('constructorCtrl', ['$scope', function($scope){}]);
