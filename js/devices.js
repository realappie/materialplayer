angular.module('devices', []).controller('devicesController', ['$scope', function($scope){
	$scope.devices = [{
		name: "Mobile",
		browser: "Chrome"

	},
	{
		name: "Desktop",
		browser: "Firefox"

	},
	{
		name: "Destkop",
		browser: "Safari"

	}];
	
}])