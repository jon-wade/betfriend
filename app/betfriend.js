var app = angular.module('app', ['ngRoute', 'ngAnimate']);
app.run(['$window', '$rootScope', function ($window, $rootScope){
        $rootScope.previous = function(){
            $window.history.back();
        };
        $rootScope.next = function(){
            $window.history.forward();
        };
        //$rootScope.odds = getOdds();
}]);
app.factory('ergast', ['$http', '$cacheFactory', function($http, $cacheFactory){

    return {
        callAPI: function(url){

            return $http({
                'url': url,
                'method': 'GET',
                'cache': true
            });
        },

        callCache: function(url){

            return $cacheFactory.get('$http').get(url);
        }

    }
}]);
app.factory('getOdds', ['$http', '$cacheFactory', '$q', function($http, $cacheFactory, $q){

    var driverOdds = {};
    var url = "https://crossorigin.me/https://www.betfair.com";

    return {
        getdata: function(){
            return $q(function(resolve, reject){
                $http({
                    'url': 'https://crossorigin.me/https://www.betfair.com/sport/motor-sport',
                    'method': 'GET',
                    'cache': true
                }).then(function(response){
                    var elements = $('<body>').html(response.data)[0];
                    var events = elements.getElementsByClassName('ui-clickselect-container')[2].childNodes;
                    for(var i=0; i<events.length; i++) {
                        if (events[i].innerHTML != undefined) {
                            if (events[i].innerHTML.includes('Monaco')) {
                                url += events[i].children[0].getAttribute('href');
                                //console.log(url);
                                $http({
                                    'url': url,
                                    'method': 'GET',
                                    'cache': true
                                }).then(function (response) {
                                    var elements = $('<body>').html(response.data)[0];
                                    var runners = elements.getElementsByClassName("runner-name");
                                    for (var i = 0; i < runners.length; i++) {
                                        driverOdds[runners[i].innerHTML] = {};
                                        driverOdds[runners[i].innerHTML].driver = runners[i].innerHTML;
                                        driverOdds[runners[i].innerHTML].driverOdds = runners[i].nextElementSibling.childNodes[1].innerHTML;
                                    }
                                    //console.log(driverOdds);
                                    return(driverOdds);
                                }, function (error) {
                                    //some error function here
                                });
                            }
                        }
                    }
                return(driverOdds);}, function(error){console.log(error);});
            resolve(driverOdds)});
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
    return {
        getData: function() {
            return $q(function (resolve, reject) {
                var driverArr = [];
                //initially need a list of all drivers in the next grand prix
                if (ergast.callCache('http://ergast.com/api/f1/2016/5/drivers.json') == undefined) {
                    console.log('Fetching driver data from API...');
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
                }
                else {
                    console.log('Fetching driver data from cache...');
                    var cache = angular.fromJson(ergast.callCache('http://ergast.com/api/f1/2016/5/drivers.json')[1]);
                    driverArr = cache.MRData.DriverTable.Drivers;
                    resolve(driverArr);
                }
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

                if (ergast.callCache('http://ergast.com/api/f1/circuits/' + circuitId + '/drivers/' + driverId + '/results.json') == undefined) {
                    console.log('Fetching driver circuit history from API...');
                    ergast.callAPI('http://ergast.com/api/f1/circuits/' + circuitId + '/drivers/' + driverId + '/results.json')
                        .then(
                            function(response){
                                console.log('Response from driver circuit history request call: ', response);
                                var data = response.data;
                                resolve(data);
                            }, function(error){
                                console.log('Error from driver circuit history request call: ', error);
                                reject();
                            });
                }
                else {
                    console.log('Fetching driver circuit history from cache...');
                    var cache = angular.fromJson(ergast.callCache('http://ergast.com/api/f1/circuits/' + circuitId + '/drivers/' + driverId + '/results.json')[1]);
                    resolve(cache);
                }
            });
        }
    }
}]);
app.factory('getDriverManufacturer', ['ergast', '$q', function(ergast, $q){
    return {
        getData: function(){

            return $q(function(resolve, reject) {

                if (ergast.callCache('http://ergast.com/api/f1/current/last/results.json') == undefined) {
                    console.log('Fetching driver manufacturer from API...');
                    ergast.callAPI('http://ergast.com/api/f1/current/last/results.json')
                        .then(function (response) {
                            var data = response.data;
                            resolve(data);
                        }, function (error) {
                            reject(error);
                        });
                }
                else {
                    console.log('Fetching driver manufacturer history from cache...');
                    var cache = angular.fromJson(ergast.callCache('http://ergast.com/api/f1/current/last/results.json')[1]);
                    resolve(cache);
                }
            });
        }
    }
}]);
app.factory('getManufacturerCircuitHistory', ['$q', 'ergast', '$rootScope', function($q, ergast, $rootScope){
    return {
        getData: function(driverDataObj, driverNum) {

            return $q(function (resolve, reject) {

                if (ergast.callCache('http://ergast.com/api/f1/circuits/' + $rootScope.circuitId + '/constructors/' + driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturer + '/results.json?limit=1000') == undefined) {
                    console.log('Fetching manufacturer circuit history from API...');
                    ergast.callAPI('http://ergast.com/api/f1/circuits/' + $rootScope.circuitId + '/constructors/' + driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturer + '/results.json?limit=1000')
                        .then(
                            function(response){
                                console.log('Response from ' + driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturer + ' circuit history request call: ' , response);
                                var data = response.data;
                                resolve(data);
                            }, function(error){
                                console.log('Error from manufacturer circuit history request call: ', error);
                                reject();
                            }
                        );
                }
                else {
                    console.log('Fetching manufacturer circuit history from cache...');
                    var cache = angular.fromJson(ergast.callCache('http://ergast.com/api/f1/circuits/' + $rootScope.circuitId + '/constructors/' + driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturer + '/results.json?limit=1000')[1]);
                    resolve(cache);
                }
            });
        }
    }
}]);
app.factory('getDriverSeasonPoints', ['ergast', '$q', function(ergast, $q){
    console.log('GETTING DRIVER SEASON POINTS DATA');
    return {
        getData: function() {
            return $q(function (resolve, reject) {

                if (ergast.callCache('http://ergast.com/api/f1/current/driverStandings.json') == undefined) {
                    console.log('Fetching driver season points from API...');
                    ergast.callAPI('http://ergast.com/api/f1/current/driverStandings.json')
                        .then(
                            function (response) {
                                console.log('Response from driver season points for current season: ', response);
                                var data = response.data;
                                resolve(data);
                            },
                            function (error) {
                                console.log('Error from driver season points for current season: ', error);
                                reject();
                            }
                        );
                }
                else{
                    console.log('Fetching driver season points from cache...');
                    var cache = angular.fromJson(ergast.callCache('http://ergast.com/api/f1/current/driverStandings.json')[1]);
                    resolve(cache);
                }
            });
        }
    }
}]);
app.factory('getManufacturerSeasonPoints', ['ergast', '$q', function(ergast, $q){
    console.log('GETTING MANUFACTURER SEASON POINTS DATA');
    return {
        getData: function() {
            return $q(function (resolve, reject) {

                if (ergast.callCache('http://ergast.com/api/f1/current/constructorStandings.json') == undefined) {
                    console.log('Fetching manufacturer season points from API...');
                    ergast.callAPI('http://ergast.com/api/f1/current/constructorStandings.json')
                        .then(
                            function (response) {
                                console.log('Response from manufacturer season points for current season: ', response);
                                var data = response.data;
                                resolve(data);
                            },
                            function (error) {
                                console.log('Error from manufacturer season points for current season: ', error);
                                reject();
                            }
                        );
                }
                else{
                    console.log('Fetching manufacturer season points from cache...');
                    var cache = angular.fromJson(ergast.callCache('http://ergast.com/api/f1/current/constructorStandings.json')[1]);
                    resolve(cache);
                }
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
                        for (var i=0; i<success.MRData.RaceTable.Races.length; i++){
                            driverDataObj[Object.keys(driverDataObj)[driverNum]].driverCircuitHistory.season[success.MRData.RaceTable.Races[i].season] = success.MRData.RaceTable.Races[i].Results[0].position;
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
                        //console.log('Manufacturer data:', response);
                        for  (var i=0; i<response.MRData.RaceTable.Races[0].Results.length; i++){
                            if (driverDataObj[Object.keys(driverDataObj)[driverNum]].driverId == response.MRData.RaceTable.Races[0].Results[i].Driver.driverId){
                                driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturer = response.MRData.RaceTable.Races[0].Results[i].Constructor.constructorId;
                                driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerName = response.MRData.RaceTable.Races[0].Results[i].Constructor.name;
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


                        for (var i=0; i<success.MRData.RaceTable.Races.length; i++){

                            if(success.MRData.RaceTable.Races[i].Results[0].position != undefined) {

                                driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerCircuitHistory.driver1.season[success.MRData.RaceTable.Races[i].season] = success.MRData.RaceTable.Races[i].Results[0].position;
                            }

                            if(success.MRData.RaceTable.Races[i].Results[1] != undefined) {

                                driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerCircuitHistory.driver2.season[success.MRData.RaceTable.Races[i].season] = success.MRData.RaceTable.Races[i].Results[1].position;
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

                        for (var i=0; i<success.MRData.StandingsTable.StandingsLists[0].DriverStandings.length; i++) {

                            if (driverDataObj[Object.keys(driverDataObj)[driverNum]].driverId == success.MRData.StandingsTable.StandingsLists[0].DriverStandings[i].Driver.driverId) {
                                driverDataObj[Object.keys(driverDataObj)[driverNum]].driverSeasonPointsPerRace = parseInt((success.MRData.StandingsTable.StandingsLists[0].DriverStandings[i].points));
                                driverDataObj[Object.keys(driverDataObj)[driverNum]].driverSeasonPointsPerRace = (driverDataObj[Object.keys(driverDataObj)[driverNum]].driverSeasonPointsPerRace)/(parseInt(success.MRData.StandingsTable.StandingsLists[0].round));
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

                        for (var i=0; i<success.MRData.StandingsTable.StandingsLists[0].ConstructorStandings.length; i++) {

                            if (driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturer == success.MRData.StandingsTable.StandingsLists[0].ConstructorStandings[i].Constructor.constructorId) {
                                driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerSeasonPointsPerRace = parseInt((success.MRData.StandingsTable.StandingsLists[0].ConstructorStandings[i].points)/2);
                                driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerSeasonPointsPerRace = (driverDataObj[Object.keys(driverDataObj)[driverNum]].manufacturerSeasonPointsPerRace)/(parseInt(success.MRData.StandingsTable.StandingsLists[0].round));
                            }
                        }
                        //console.log('Driver data object: ', driverDataObj);
                        resolve(driverDataObj);})
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
app.controller('homeCtrl', ['$scope', '$location', 'ergast', '$interval', '$rootScope', 'getOdds', function($scope, $location, ergast, $interval, $rootScope, getOdds){

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

    getOdds.getdata().then(function(response){
        $rootScope.odds = response;
    });

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
    $scope.dc = 50;
    $scope.st = 50;


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

                    console.log($rootScope.odds);

                    //create display array
                    populateScores(driverDataObj);
                    $scope.$watch('dc', function(newValue, oldValue){
                        if (oldValue>newValue){
                            populateScores(driverDataObj);
                        }
                        else if(oldValue<newValue){
                            populateScores(driverDataObj);
                        }
                    });
                    $scope.$watch('st', function(newValue, oldValue){
                        if (oldValue>newValue){
                            populateScores(driverDataObj);
                        }
                        else if(oldValue<newValue){
                            populateScores(driverDataObj);
                        }
                    });
                }
        })};

    buildObject(driverDataObj, driverNum);

    var populateScores = function(driverDataObj) {

        $scope.driverArr = [];
        $scope.raceTotal = 0;

        for (var driver in driverDataObj) {
            if (driverDataObj.hasOwnProperty(driver)) {
                driverDataObj[driver].combinedHistoryScore =

                    (((100 - $scope.dc) * (driverDataObj[driver].driverCircuitHistoryScore)
                    + (($scope.dc * driverDataObj[driver].manufacturerCircuitHistoryScore.driver1) / 2)
                    + (($scope.dc * driverDataObj[driver].manufacturerCircuitHistoryScore.driver2)) / 2) / 100);

                driverDataObj[driver].combinedSeasonScore =

                    (((100 - $scope.dc) * (driverDataObj[driver].driverSeasonPointsPerRace)) / 100)
                    + ((($scope.dc) * (driverDataObj[driver].manufacturerSeasonPointsPerRace)) / 100);

                driverDataObj[driver].totalScore =
                    ((((100 - $scope.st) * (driverDataObj[driver].combinedSeasonScore)) / 100))
                    + ((($scope.st) * (driverDataObj[driver].combinedHistoryScore)) / 100);

                $scope.raceTotal += driverDataObj[driver].totalScore;

                $scope.driverArr.push(driverDataObj[driver]);

            }

        else
            {
            }
        }
    }




}]);
app.controller('driverCtrl', ['$scope', function($scope){}]);
app.controller('constructorCtrl', ['$scope', function($scope){}]);





