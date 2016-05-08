var app = angular.module('app', ['ngRoute', 'ngAnimate']);

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


app.controller('homeCtrl', ['$scope', function($scope){}]);
app.controller('predictionCtrl', ['$scope', function($scope){}]);
app.controller('driverCtrl', ['$scope', function($scope){}]);
app.controller('constructorCtrl', ['$scope', function($scope){}]);
