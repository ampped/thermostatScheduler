"use strict";

var weather;
var forecast;

function getWeatherData(zip){
	var url =  'https://api.apixu.com/v1/forecast.json?key=8345029550ea4066b4a03622172106&q=94089&days=7';
	$.ajax({
	  dataType: "json",
	  url: url,
	  data: null,
	  success: function(obj){
	  	weather = obj.forecast.forecastday;
	  	console.dir(weather);
	  	app.main.init();
	  },
	  error: function(){
	  	weather = null;
	  	console.log('could not get weather data');
	  	app.main.init();
	  }
	});
}