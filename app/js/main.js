"use strict";

var app = app || {};

/*window.onload = function(){
	console.log('page has loaded');
	//app.main.nest = app.nest;
	app.main.init();
};*/
var draw = 'boop';

app.main = {
	canvas: undefined,
	ctx: undefined,
	now: undefined,
	targetAngle: undefined,
    mouse: {
    	x: 0,
    	y: 0
    },
	MAIN: {
		radius: 245,
		shift: 20
	},
	STATE: {
		DEFAULT: 0,
		HOVER: 1,
		EDIT: 2
	},
	NODE_STATE: {
		DEFAULT: 0,
		HOVER: 1,
		EDIT: 2
	},
	state: undefined,
	center: {
		x: 0,
		y: 0
	},
	schedules: [],
	s: 0,

	init: function(){
		draw = app.draw;
		console.log('init called ');

		this.canvas = document.querySelector('canvas');
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
		this.ctx = this.canvas.getContext('2d');
		this.center.x = this.canvas.width/2;
		this.center.y = this.canvas.height/2+this.MAIN.shift;

		//set up schedules
		for(var i = 0; i <= 7; i++){
			this.schedules.push({
				day: i,
				nodes: []
			})
		}

		this.state = this.STATE.DEFAULT;
		console.dir(forecast);

		this.update();
	},

	update: function(){
		this.now = new Date();
		this.s = this.schedules[0];
		this.ctx.fillStyle = "#FDFDFD";
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
		this.animationID = requestAnimationFrame(this.update.bind(this));

		draw.mainSchedule(this.ctx, this.center, this.now, this.s);
        this.canvas.onmousemove = this.doMouseMove.bind(this);
        this.canvas.onclick = this.doMouseDown.bind(this);

        if(this.state == this.STATE.HOVER){		//draw add new button
			var distance = new Vector(this.mouse.x-this.center.x, this.mouse.y-this.center.y);
			var drawNew = calculateVector(distance.angle, this.MAIN.radius);
			this.targetAngle = distance.angle;
			this.ctx.save();
			this.ctx.translate(this.center.x, this.center.y);
			draw.nodeTriangle(this.ctx, '#AAF', distance.angle);
			this.ctx.restore();
			this.ctx.fillStyle = "#FFFF00";
			this.ctx.beginPath();
			this.ctx.arc(this.center.x + drawNew.x, this.center.y - drawNew.y, 25, 0, Math.PI*2, false);
			this.ctx.fill();
		}
		if(this.state == this.STATE.EDIT){
			for(var i in this.s.nodes){
				var node = this.s.nodes[i];
				if(node.state == this.NODE_STATE.EDIT){
					draw.editInfo(this.ctx, this.center, this.targetAngle, node);
					this.ctx.restore();
				}
			}
			this.getWeatherAt(this.targetAngle/(Math.PI*2)*1440);
		}
	},

	getWeatherAt: function(time){
		var newDate = new Date();
		newDate.setDate(newDate.getDate()+1);
		time /= 60;
		time = Math.floor(time - (time%3));
		if(time < 10)
			time = '0' + time;
		var year = newDate.getUTCFullYear();
		var month = newDate.getMonth()+1;
		var day = newDate.getDate();
		if(month < 10)
			month = '0'+month;
		if(day < 10)
			day = '0'+day;
		var when = year + "-" + month + "-" + day + " " + time + ":00:00";
		for(var i = 0; i < forecast.list.length; i++){
			if(forecast.list[i].dt_txt == when){
				return ('Outside: ' + Math.round(forecast.list[i].main.temp) + ' °F');
			}
		}
		return 'not found';
	},

	createTarget: function(){
		var time = this.targetAngle/(Math.PI*2)*1440;
		var newNode = new TempNode(time, 60);

		if(this.s.nodes.length == 0)
			this.s.nodes.push(newNode);
		else{
			for(var i = 0; i < this.s.nodes.length; i++){
				var node = this.s.nodes[i];
				if(node.time > time){
					this.s.nodes.splice(i, 0, newNode);
					return;
				}
			}
			this.s.nodes.push(newNode);
		}
		//console.dir(this.s.nodes[this.s.nodes.length-1]);
	},

	doMouseMove: function(e){
		this.mouse = getMouse(e);

		var distance = new Vector(this.mouse.x-this.center.x, this.mouse.y-this.center.y);

		if(distance.mag < this.MAIN.radius + 60 && distance.mag > this.MAIN.radius - 60 && this.state != this.STATE.EDIT){
			this.state = this.STATE.HOVER;
		}
		else if(this.state == this.STATE.EDIT){

		}
		else
			this.state = this.STATE.DEFAULT;
	},

	doMouseDown: function(e){
		if(this.state == this.STATE.EDIT){
			for (var i in this.s.nodes){		//set state current selected node to default
				if(this.s.nodes[i].state == this.NODE_STATE.EDIT){
					this.s.nodes[i].state = this.NODE_STATE.DEFAULT;
				}
			}

			this.state = this.STATE.DEFAULT;
		}
		if(this.state == this.STATE.HOVER){
			this.state = this.STATE.EDIT;
			this.createTarget();
		}
	}
}

var TempNode = function(time, temp){
	this.time = time;
	this.temp = temp;
	this.state = 2;
};

var DaySchedule = function(day, nodes){
	this.day = day;
	this.nodes = nodes;
}

function getMouse(e){      //get mouse info
	var mouse = {};
	mouse.x = e.pageX - e.target.offsetLeft;
	mouse.y = e.pageY - e.target.offsetTop;
	return mouse;
}

function getAngle(time){
	return (time/1440*(Math.PI*2));
}

function getTime(angle){
	return (angle/(Math.PI*2)*1440);
}

//text for days and months
var days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
var months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

Date.prototype.today = function(){	//returns date text
	return (days[this.getDay()] + " " + months[this.getMonth()] + " " + this.getDate());
}

Date.prototype.time = function(){	//returns time text
	var h = this.getHours();
	var m = this.getMinutes();
	return getTimeFormat(h*60 + m);
}

function getTimeFormat(time){
	var hours = Math.floor(time/60);
	var minutes = Math.floor(time%60);
	var period = "AM";
	if(hours == 0)
		hours = 12;
	if(hours > 12){
		hours -= 12;
		period = "PM";
	}
	if(minutes < 10)
		minutes = 0 + minutes.toString();
	return (hours + ":" + minutes + " " + period);
}

var Vector = function(x, y){       //vector constructor
	this.x = x;
	this.y = y;
	this.mag = Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
	if(x >= 0 && y < 0)
		this.angle = Math.asin(this.x/this.mag);
	if(x >= 0 && y >= 0)
		this.angle =  Math.PI - Math.asin(this.x/this.mag);
	if(x < 0 && y >= 0)
		this.angle = Math.PI + Math.asin(Math.abs(this.x)/this.mag);
	if(x < 0 && y < 0)
		this.angle = Math.PI*2 - Math.asin(Math.abs(this.x)/this.mag);
};

function calculateVector(angle, mag){          //calculates a vector based on angle and magnitude
	var v = new Vector();
	v.x = Math.sin(angle)*mag;
	v.y = Math.cos(angle)*mag;
	return v;
};