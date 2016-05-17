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
app.factory('getDriverData', ['ergast', '$q', function(ergast, $q){
    console.log('GETTING DRIVER DATA');
    return {
        getData: function() {
            return $q(function (resolve, reject) {
                var driverArr = [];
                //initially need a list of all drivers in the next grand prix
                ergast.callAPI('http://ergast.com/api/f1/2016/5/drivers.json')
                    .then(
                        function (response) {
                            //console.log('Response from driver list request for current race: ', response);
                            driverArr = response.data.MRData.DriverTable.Drivers;
                            resolve(driverArr);
                        },
                        function (error) {
                            console.log('Error from driver list request for current race: ', error);
                            reject();
                        }
                    );
            });
        }
    }
}]);
app.factory('getDriverCircuitHistory', ['ergast', '$q', function(ergast, $q){
    //get each drivers history at current circuit
    console.log('GETTING DRIVER CIRCUIT HISTORY DATA');
    return {
        getData: function(driverId, circuitId) {

            return $q(function (resolve, reject) {

                ergast.callAPI('http://ergast.com/api/f1/circuits/' + circuitId + '/drivers/' + driverId + '/results.json')
                        .then(
                            function(response){
                                console.log('Response from driver circuit history request call: ', response);
                                resolve(response);
                            }, function(error){
                                console.log('Error from driver circuit history request call: ', error);
                                reject();
                            }
                        );
            });
        }
    }
}]);
app.factory('getDriverManufacturer', ['ergast', '$q', function(ergast, $q){
    return {
        getData: function(driverDataObj, driverNum){

            return $q(function(resolve, reject) {

                ergast.callAPI('http://ergast.com/api/f1/current/last/results.json')
                    .then(
                        function(response) {
                            resolve(response);
                        }, function(error){reject();});
            });
        }
    }
}]);
app.factory('getManufacturerCircuitHistory', ['$q', 'ergast', '$rootScope', function($q, ergast, $rootScope){
    return {
        getData: function(driverDataObj, driverNum) {

            return $q(function (resolve, reject) {
                console.log(driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturer);
                ergast.callAPI('http://ergast.com/api/f1/circuits/' + $rootScope.circuitId + '/constructors/' + driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturer + '/results.json?limit=1000')
                    .then(
                        function(response){
                            console.log('Response from ' + driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturer + ' circuit history request call: ' , response);
                            resolve(response);
                        }, function(error){
                            console.log('Error from manufacturer circuit history request call: ', error);
                            reject();
                        }
                    );
            });
        }
    }
}]);
app.factory('getDriverSeasonPoints', ['ergast', '$q', function(ergast, $q){
    console.log('GETTING DRIVER SEASON POINTS DATA');
    return {
        getData: function() {
            return $q(function (resolve, reject) {

                ergast.callAPI('http://ergast.com/api/f1/current/driverStandings.json')
                    .then(
                        function (response) {
                            console.log('Response from driver season points for current season: ', response);
                            resolve(response);
                        },
                        function (error) {
                            console.log('Error from driver season points for current season: ', error);
                            reject();
                        }
                    );
            });
        }
    }
}]);
app.factory('getManufacturerSeasonPoints', ['ergast', '$q', function(ergast, $q){
    console.log('GETTING MANUFACTURER SEASON POINTS DATA');
    return {
        getData: function() {
            return $q(function (resolve, reject) {

                ergast.callAPI('http://ergast.com/api/f1/current/constructorStandings.json')
                    .then(
                        function (response) {
                            console.log('Response from manufacturer season points for current season: ', response);
                            resolve(response);
                        },
                        function (error) {
                            console.log('Error from manufacturer season points for current season: ', error);
                            reject();
                        }
                    );
            });
        }
    }

}]);
app.factory('getDriverDataObj', ['$q', 'getDriverData', 'getDriverCircuitHistory', '$rootScope', 'pointsLookup', 'getDriverManufacturer', 'getManufacturerCircuitHistory', 'getDriverSeasonPoints', 'getManufacturerSeasonPoints', function($q, getDriverData, getDriverCircuitHistory, $rootScope, pointsLookup, getDriverManufacturer, getManufacturerCircuitHistory, getDriverSeasonPoints, getManufacturerSeasonPoints){

    return {
        getData: function(driverDataObj, driverNum){

            return $q(function(resolve, reject){
                getDriverData.getData()
                    .then(function createDataObj(data){
                        //create the driverDataObj
                        driverDataObj[data[driverNum].driverId] = {};
                        driverDataObj[data[driverNum].driverId].driverId= data[driverNum].driverId;
                        driverDataObj[data[driverNum].driverId].familyName = data[driverNum].familyName;
                        driverDataObj[data[driverNum].driverId].givenName = data[driverNum].givenName;
                        driverDataObj[data[driverNum].driverId].nationality = data[driverNum].nationality;
                        driverDataObj[data[driverNum].driverId].permanentNumber = data[driverNum].permanentNumber;
                        return driverDataObj;
                    })
                    .then(function callDriverCircuitHistory(driverDataObj){
                        console.log('Fetching driver circuit history for ...', driverDataObj[Object.keys(driverDataObj)[driverNum]].driverId);
                        return getDriverCircuitHistory.getData(driverDataObj[Object.keys(driverDataObj)[driverNum]].driverId, $rootScope.circuitId);
                    })
                    .then(function addDriverCircuitHistory(success){
                        driverDataObj[Object.keys(driverDataObj)[driverNum]].driverCircuitHistory = {};
                        driverDataObj[Object.keys(driverDataObj)[driverNum]].driverCircuitHistory.season = {};
                        for (var i=0; i<success.data.MRData.RaceTable.Races.length; i++){
                            driverDataObj[Object.keys(driverDataObj)[driverNum]].driverCircuitHistory.season[success.data.MRData.RaceTable.Races[i].season] = success.data.MRData.RaceTable.Races[i].Results[0].position;
                        }
                        //console.log('Driver data object: ', driverDataObj);

                        return driverDataObj;
                    })
                    .then(function calculateDriverCircuitHistoryScore(driverDataObj){
                        driverDataObj[Object.keys(driverDataObj)[driverNum]].driverCircuitHistoryScore = 0;

                        for (var season in driverDataObj[Object.keys(driverDataObj)[driverNum]].driverCircuitHistory.season){
                            if(driverDataObj[Object.keys(driverDataObj)[driverNum]].driverCircuitHistory.season.hasOwnProperty(season)){
                                var currentYear = new Date().getFullYear();
                                if (parseInt(season) > currentYear -10){
                                    //console.log(driverDataObj[Object.keys(driverDataObj)[driverNum]].driverId);
                                    //console.log(season);

                                    switch(parseInt(season)){
                                        case currentYear-1:
                                            driverDataObj[Object.keys(driverDataObj)[driverNum]].driverCircuitHistoryScore += pointsLookup.getScore(parseInt(driverDataObj[Object.keys(driverDataObj)[driverNum]].driverCircuitHistory.season[season])) * 0.25;
                                            break;
                                        case currentYear-2:
                                            driverDataObj[Object.keys(driverDataObj)[driverNum]].driverCircuitHistoryScore += pointsLookup.getScore(parseInt(driverDataObj[Object.keys(driverDataObj)[driverNum]].driverCircuitHistory.season[season])) * 0.18;
                                            break;
                                        case currentYear-3:
                                            driverDataObj[Object.keys(driverDataObj)[driverNum]].driverCircuitHistoryScore += pointsLookup.getScore(parseInt(driverDataObj[Object.keys(driverDataObj)[driverNum]].driverCircuitHistory.season[season])) * 0.14;
                                            break;
                                        case currentYear-4:
                                            driverDataObj[Object.keys(driverDataObj)[driverNum]].driverCircuitHistoryScore += pointsLookup.getScore(parseInt(driverDataObj[Object.keys(driverDataObj)[driverNum]].driverCircuitHistory.season[season])) * 0.12;
                                            break;
                                        case currentYear-5:
                                            driverDataObj[Object.keys(driverDataObj)[driverNum]].driverCircuitHistoryScore += pointsLookup.getScore(parseInt(driverDataObj[Object.keys(driverDataObj)[driverNum]].driverCircuitHistory.season[season])) * 0.10;
                                            break;
                                        case currentYear-6:
                                            driverDataObj[Object.keys(driverDataObj)[driverNum]].driverCircuitHistoryScore += pointsLookup.getScore(parseInt(driverDataObj[Object.keys(driverDataObj)[driverNum]].driverCircuitHistory.season[season])) * 0.08;
                                            break;
                                        case currentYear-7:
                                            driverDataObj[Object.keys(driverDataObj)[driverNum]].driverCircuitHistoryScore += pointsLookup.getScore(parseInt(driverDataObj[Object.keys(driverDataObj)[driverNum]].driverCircuitHistory.season[season])) * 0.06;
                                            break;
                                        case currentYear-8:
                                            driverDataObj[Object.keys(driverDataObj)[driverNum]].driverCircuitHistoryScore += pointsLookup.getScore(parseInt(driverDataObj[Object.keys(driverDataObj)[driverNum]].driverCircuitHistory.season[season])) * 0.04;
                                            break;
                                        case currentYear-9:
                                            driverDataObj[Object.keys(driverDataObj)[driverNum]].driverCircuitHistoryScore += pointsLookup.getScore(parseInt(driverDataObj[Object.keys(driverDataObj)[driverNum]].driverCircuitHistory.season[season])) * 0.02;
                                            break;
                                        case currentYear-10:
                                            driverDataObj[Object.keys(driverDataObj)[driverNum]].driverCircuitHistoryScore += pointsLookup.getScore(parseInt(driverDataObj[Object.keys(driverDataObj)[driverNum]].driverCircuitHistory.season[season])) * 0.01;
                                            break;
                                    }
                                }
                                else {
                                    //were not interested in data older than 10 years ago
                                }
                            }
                        }
                        return(driverDataObj);
                    })
                    .then(function callDriverManufacturer(driverDataObj) {
                        return getDriverManufacturer.getData(driverDataObj, driverNum);
                    })
                    .then(function addDriverManufacturer(response){
                        for  (var i=0; i<response.data.MRData.RaceTable.Races[0].Results.length; i++){
                            if (driverDataObj[Object.keys(driverDataObj)[driverNum]].driverId == response.data.MRData.RaceTable.Races[0].Results[i].Driver.driverId){
                                driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturer = response.data.MRData.RaceTable.Races[0].Results[i].Constructor.constructorId;
                                return(driverDataObj);
                            }
                        }
                    })
                    .then(function callDriverManufacturerCircuitHistory(driverDataObj){
                        console.log('Fetching manufacturer circuit history for ...', driverDataObj[Object.keys(driverDataObj)[driverNum]].driverId);
                        return getManufacturerCircuitHistory.getData(driverDataObj, driverNum);

                    })
                    .then(function addManufacturerCircuitHistory(success){
                        driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerCircuitHistory = {};
                        driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerCircuitHistory.driver1 = {};
                        driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerCircuitHistory.driver1.season = {};
                        driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerCircuitHistory.driver2 = {};
                        driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerCircuitHistory.driver2.season = {};


                        for (var i=0; i<success.data.MRData.RaceTable.Races.length; i++){

                            if(success.data.MRData.RaceTable.Races[i].Results[0].position != undefined) {

                                driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerCircuitHistory.driver1.season[success.data.MRData.RaceTable.Races[i].season] = success.data.MRData.RaceTable.Races[i].Results[0].position;
                            }

                            if(success.data.MRData.RaceTable.Races[i].Results[1] != undefined) {

                                driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerCircuitHistory.driver2.season[success.data.MRData.RaceTable.Races[i].season] = success.data.MRData.RaceTable.Races[i].Results[1].position;
                            }


                        }
                        return(driverDataObj);

                    })
                    .then(function calculateManufacturerDriverOneScore(driverDataObj){
                        driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerCircuitHistoryScore = {};
                        driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerCircuitHistoryScore.driver1 = 0;

                        for (var season in driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerCircuitHistory.driver1.season){
                            if(driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerCircuitHistory.driver1.season.hasOwnProperty(season)){
                                var currentYear = new Date().getFullYear();
                                if (parseInt(season) > currentYear -10){

                                    switch(parseInt(season)){
                                        case currentYear-1:
                                            driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerCircuitHistoryScore.driver1 += pointsLookup.getScore(parseInt(driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerCircuitHistory.driver1.season[season])) * 0.25;
                                            break;
                                        case currentYear-2:
                                            driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerCircuitHistoryScore.driver1 += pointsLookup.getScore(parseInt(driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerCircuitHistory.driver1.season[season])) * 0.18;
                                            break;
                                        case currentYear-3:
                                            driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerCircuitHistoryScore.driver1 += pointsLookup.getScore(parseInt(driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerCircuitHistory.driver1.season[season])) * 0.14;
                                            break;
                                        case currentYear-4:
                                            driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerCircuitHistoryScore.driver1 += pointsLookup.getScore(parseInt(driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerCircuitHistory.driver1.season[season])) * 0.12;
                                            break;
                                        case currentYear-5:
                                            driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerCircuitHistoryScore.driver1 += pointsLookup.getScore(parseInt(driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerCircuitHistory.driver1.season[season])) * 0.10;
                                            break;
                                        case currentYear-6:
                                            driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerCircuitHistoryScore.driver1 += pointsLookup.getScore(parseInt(driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerCircuitHistory.driver1.season[season])) * 0.08;
                                            break;
                                        case currentYear-7:
                                            driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerCircuitHistoryScore.driver1 += pointsLookup.getScore(parseInt(driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerCircuitHistory.driver1.season[season])) * 0.06;
                                            break;
                                        case currentYear-8:
                                            driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerCircuitHistoryScore.driver1 += pointsLookup.getScore(parseInt(driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerCircuitHistory.driver1.season[season])) * 0.04;
                                            break;
                                        case currentYear-9:
                                            driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerCircuitHistoryScore.driver1 += pointsLookup.getScore(parseInt(driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerCircuitHistory.driver1.season[season])) * 0.02;
                                            break;
                                        case currentYear-10:
                                            driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerCircuitHistoryScore.driver1 += pointsLookup.getScore(parseInt(driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerCircuitHistory.driver1.season[season])) * 0.01;
                                            break;
                                    }
                                }
                                else {
                                    //were not interested in data older than 10 years ago
                                }
                            }
                        }

                        return (driverDataObj);
                    })
                    .then(function calculateManufacturerDriverTwoScore(driverDataObj){

                        driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerCircuitHistoryScore.driver2 = 0;

                        for (var season in driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerCircuitHistory.driver2.season){
                            if(driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerCircuitHistory.driver2.season.hasOwnProperty(season)){
                                var currentYear = new Date().getFullYear();
                                if (parseInt(season) > currentYear -10){

                                    switch(parseInt(season)){
                                        case currentYear-1:
                                            driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerCircuitHistoryScore.driver2 += pointsLookup.getScore(parseInt(driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerCircuitHistory.driver2.season[season])) * 0.25;
                                            break;
                                        case currentYear-2:
                                            driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerCircuitHistoryScore.driver2 += pointsLookup.getScore(parseInt(driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerCircuitHistory.driver2.season[season])) * 0.18;
                                            break;
                                        case currentYear-3:
                                            driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerCircuitHistoryScore.driver2 += pointsLookup.getScore(parseInt(driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerCircuitHistory.driver2.season[season])) * 0.14;
                                            break;
                                        case currentYear-4:
                                            driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerCircuitHistoryScore.driver2 += pointsLookup.getScore(parseInt(driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerCircuitHistory.driver2.season[season])) * 0.12;
                                            break;
                                        case currentYear-5:
                                            driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerCircuitHistoryScore.driver2 += pointsLookup.getScore(parseInt(driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerCircuitHistory.driver2.season[season])) * 0.10;
                                            break;
                                        case currentYear-6:
                                            driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerCircuitHistoryScore.driver2 += pointsLookup.getScore(parseInt(driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerCircuitHistory.driver2.season[season])) * 0.08;
                                            break;
                                        case currentYear-7:
                                            driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerCircuitHistoryScore.driver2 += pointsLookup.getScore(parseInt(driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerCircuitHistory.driver2.season[season])) * 0.06;
                                            break;
                                        case currentYear-8:
                                            driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerCircuitHistoryScore.driver2 += pointsLookup.getScore(parseInt(driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerCircuitHistory.driver2.season[season])) * 0.04;
                                            break;
                                        case currentYear-9:
                                            driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerCircuitHistoryScore.driver2 += pointsLookup.getScore(parseInt(driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerCircuitHistory.driver2.season[season])) * 0.02;
                                            break;
                                        case currentYear-10:
                                            driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerCircuitHistoryScore.driver2 += pointsLookup.getScore(parseInt(driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerCircuitHistory.driver2.season[season])) * 0.01;
                                            break;
                                    }
                                }
                                else {
                                    //were not interested in data older than 10 years ago
                                }
                            }
                        }
                        return(driverDataObj);
                        })
                    .then(function callDriverSeasonPoints(){
                        console.log('Fetching driver season points total ...');
                        return getDriverSeasonPoints.getData();
                    })
                    .then(function addDriverSeasonPoints(success){
                        driverDataObj[Object.keys(driverDataObj)[driverNum]].driverSeasonPointsPerRace = 0;

                        for (var i=0; i<success.data.MRData.StandingsTable.StandingsLists[0].DriverStandings.length; i++) {

                            if (driverDataObj[Object.keys(driverDataObj)[driverNum]].driverId == success.data.MRData.StandingsTable.StandingsLists[0].DriverStandings[i].Driver.driverId) {
                                driverDataObj[Object.keys(driverDataObj)[driverNum]].driverSeasonPointsPerRace = parseInt((success.data.MRData.StandingsTable.StandingsLists[0].DriverStandings[i].points));
                                driverDataObj[Object.keys(driverDataObj)[driverNum]].driverSeasonPointsPerRace = (driverDataObj[Object.keys(driverDataObj)[driverNum]].driverSeasonPointsPerRace)/(parseInt(success.data.MRData.StandingsTable.StandingsLists[0].round));
                            }
                        }
                        //console.log('Driver data object: ', driverDataObj);
                        return(driverDataObj);})
                    .then(function callManufacturerSeasonPoints(){
                        console.log('Fetching manufacturer season points total ...');
                        return getManufacturerSeasonPoints.getData();
                    })
                    .then(function addManufacturerSeasonPoints(success){
                        driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerSeasonPointsPerRace = 0;

                        for (var i=0; i<success.data.MRData.StandingsTable.StandingsLists[0].ConstructorStandings.length; i++) {

                            if (driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturer == success.data.MRData.StandingsTable.StandingsLists[0].ConstructorStandings[i].Constructor.constructorId) {
                                driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerSeasonPointsPerRace = parseInt((success.data.MRData.StandingsTable.StandingsLists[0].ConstructorStandings[i].points));
                                driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerSeasonPointsPerRace = (driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerSeasonPointsPerRace)/(parseInt(success.data.MRData.StandingsTable.StandingsLists[0].round));
                            }
                        }
                        //console.log('Driver data object: ', driverDataObj);
                        resolve(driverDataObj);
                });
            });
        }
    };

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
                $scope.css = 'round-' + $scope.round + '.css';
                console.log($scope.css);
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




}]);
app.controller('predictionCtrl', ['$scope', 'ergast', '$rootScope', 'getDriverDataObj', function($scope, ergast, $rootScope, getDriverDataObj){

    //switch on the back button
    $rootScope.bckHide = false;
    $rootScope.fwdHide = true;
    var driverDataObj = {};
    var driverNum = 0;
    $scope.driverArr = [];
    $scope.dc = 50;
    $scope.st = 70;

    //TODO: current hardcoded number of drivers in race, need to look-up...

    var buildObject = function (driverDataObj, driverNum){
        getDriverDataObj.getData(driverDataObj, driverNum)
            .then(function(response){
                if(driverNum<21){
                    driverNum++;
                    buildObject(response, driverNum);
                }
                else{
                    console.log('FINAL', driverDataObj);
                    //this is the main program execution area now

                    //create display array
                    for (var driver in driverDataObj){
                        if(driverDataObj.hasOwnProperty(driver)){
                            $scope.driverArr.push(driverDataObj[driver]);
                        }
                    }







                }
        })};

    buildObject(driverDataObj, driverNum);






}]);
app.controller('driverCtrl', ['$scope', function($scope){}]);
app.controller('constructorCtrl', ['$scope', function($scope){}]);





