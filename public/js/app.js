'use strict';


// Declare app level module which depends on filters, and services
var app = angular.module('myApp', [
	'wmd3',
	'ngRoute',
	'myApp.filters', 
	'myApp.services', 
	'myApp.directives',
	'myApp.controllers']).
  config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
//    $routeProvider.when('/view1', {templateUrl: 'partials/partial1', controller: MyCtrl1});
//    $routeProvider.when('/view2', {templateUrl: 'partials/partial2', controller: MyCtrl2});
//    $routeProvider.otherwise({redirectTo: '/'});
//    $locationProvider.html5Mode(true);
  }]);