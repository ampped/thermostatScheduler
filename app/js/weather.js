"use strict";

var weather;
var forecast;

function getWeatherData(zip){
	//var url =  'https://api.apixu.com/v1/forecast.json?key=7f465411919341c393d73815182903&q=14623&days=7';
	var url =  'https://api.aerisapi.com/forecasts/rochester,ny?filter=1hr&limit=999&client_id=btq5TOAD6ArvUjPYuyebw&client_secret=I4hUZsjsJKEvzZNM7ZC8tqAoqesCjwY0EzaQ0a78';
	$.ajax({
	  dataType: "json",
	  url: url,
	  data: null,
	  success: function(obj){
	  	weather = obj.response[0].periods;
	  	app.main.init();
	  },
	  error: function(){
	  	weather = null;
	  	console.log('could not get weather data');
	  	app.main.init();
	  }
	});
}