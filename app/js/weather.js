"use strict";

var weather;
var forecast;

function getWeatherData(zip){
	var url =  'https://api.aerisapi.com/forecasts/';
	url += zip;
	url += '?filter=1hr&client_id=9ObYrQwHaSUSAzO6TJmF4&client_secret=P3ch5T139spsylOYn37VhrII3YKShXb7WAzBMOEp';
	$.ajax({
	  dataType: "jsonp",
	  url: url,
	  data: null,
	  success: function(obj){
	  	weather = obj;
	  	console.dir(weather);
		getForecastData(zip);
	  }
	});
}

function getForecastData(zip){
	var url =  'https://api.aerisapi.com/forecasts/';
	url += zip;
	url += '?filter=1hr&client_id=9ObYrQwHaSUSAzO6TJmF4&client_secret=P3ch5T139spsylOYn37VhrII3YKShXb7WAzBMOEp';
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