var SERVER_IP = "ip";
var SECRET = "secret";

var myApp = angular.module("myModule", []);

var inputIsValid = function(){
	var alarm_time = $("#alarm_time").val();
	var submission_interval = $("#submission_interval").val();
	var shift_start = $("#shift_start").val();
	var shift_end = $("#shift_end").val();
	
	if(alarm_time < 5
	  || submission_interval < 1
	  || (shift_start > 23 || shift_start < 0)
	  || (shift_end > 23 || shift_end < 0)){
		$("#settings_values_error").show();
		
		setTimeout(function(){
			$("#settings_values_error").hide();
		}, 3000);
		
		return false;
	}
	
	return true;
}

myApp.controller("myController", function ($scope, $http) {
	'use strict';
	$http.get(SERVER_IP + 'info', {
		params: {
			collection: 'settings',
			secret: SECRET,
			query: {}
		}
	}).success(function(json){
		json.forEach(function(element, i){
			if(element.name == "alarm_time"){
				element.text = "Време на звънене: ";
				element.value /= 1000;
				element.postfix = "секунди (най-малко 5)";
			}
			else if(element.name == "submission_interval"){
				element.text = "Интервал между изпращания: ";
				element.value /= 60 * 1000;
				element.postfix = "минути (най-малко 1)";
			}
			else if(element.name == "shift_start"){
				element.text = "Начало на смяна: ";
				element.postfix = "часа (0 - 23)";
			}
			else if(element.name == "shift_end"){
				element.text = "Край на смяна: ";
				element.postfix = "часа (0 - 23)";
			}
			else if(element.name == "email1"){
				element.text = "E-mail 1: ";
			}
			else if(element.name == "email2"){
				element.text = "E-mail 2: ";
			}
		});

		$scope.settings = json;
	});
	
	$http.get(SERVER_IP + 'info', {
		params: {
			collection: 'tokens',
			secret: SECRET,
			query: {}
		}
	}).success(function(json){
		$scope.users = json;
	});
	
	$scope.login = function(){
		if($scope.password == undefined){
			$("#login_error").show();
			
			setTimeout(function(){
				$("#login_error").hide();
			}, 3000);
		}
		
		var hash = sha256($scope.password);
		var expected = "05d2db47608c4b307488fa6b95cfe6f4feb521a81e2ec581d8b07d583015f105";
		
		if(expected == hash){
			$scope.logged_in = true;
		} else{
			$("#password").val('');
			$("#login_error").show();
			
			setTimeout(function(){
				$("#login_error").hide();
			}, 3000);
		}
	}
	
	$scope.submit = function(){
		if(inputIsValid()){
			var data = [];
			
			$scope.settings.forEach(function(element, i){
				var value = element.value;
				
				if(i == 0){
					value *= 1000;
				}
				else if(i == 1){
					value *= 60 * 1000;
				}
				
				data.push({
					name: element.name,
					value: value
				});
			});
			
			$http.post(SERVER_IP + 'settings', {data: data, secret: SECRET})
				 .success(function(status){
					$("#settings_success").show();

					setTimeout(function(){
						$("#settings_success").hide();
					}, 3000);
				}).error(function(status){
					$("#settings_connect_error").show();

					setTimeout(function(){
						$("#settings_connect_error").hide();
					}, 3000);
				});
		}
	}
	
	//Couldn't get DELETE to work, so am using post to delete users
	$scope.delete = function(user){
		$http.post(SERVER_IP + 'users', {
			secret: SECRET,
			device_name: user.device_name
		}).success(function(status){
			$("#" + user._id).hide();
		}).error(function(status){
			$("#names_error").show();
			
			setTimeout(function(){
				$("#names_error").hide();
			}, 3000);
		});
		
	}
});
