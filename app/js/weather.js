"use strict";

var weather;
var forecast;

function getWeatherData(zip){
	var url =  'https://api.openweathermap.org/data/2.5/weather?zip=';
	url += zip;
	url += '&units=imperial&APPID=769bff39fb48ef2692b3c7ea7cfe671b';
	$.ajax({
	  dataType: "jsonp",
	  url: url,
	  data: null,
	  success: function(obj){
	  	weather = obj;
		getForecastData(zip);
	  }
	});
}

function getForecastData(zip){
	var url =  'https://api.openweathermap.org/data/2.5/forecast?zip=';
	url += zip;
	url += '&units=imperial&APPID=769bff39fb48ef2692b3c7ea7cfe671b';
	$.ajax({
	  dataType: "jsonp",
	  url: url,
	  data: null,
	  success: function(obj){
	  	forecast = obj;
		app.main.init(); //call my script
	  }
	});
}