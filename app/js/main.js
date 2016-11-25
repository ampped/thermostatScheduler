"use strict";

var app = app || {};

/*window.onload = function(){
	console.log('page has loaded');
	//app.main.nest = app.nest;
	app.main.init();
};*/

app.main = {
	nest: undefined,
	canvas: undefined,
	ctx: undefined,
	now: undefined,
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
	TARGET_STATE: {
		DEFAULT: 0,
		HOVER: 1,
		EDIT: 2
	},
	state: undefined,
	center: {
		x: 0,
		y: 0
	},
	targets: [],
	dailySchedules: [],

	init: function(){
		console.log('init called');

		this.canvas = document.querySelector('canvas');
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
		this.ctx = this.canvas.getContext('2d');
		this.center.x = this.canvas.width/2;
		this.center.y = this.canvas.height/2+this.MAIN.shift;

		this.state = this.STATE.DEFAULT;

		this.update();
	},

	update: function(){
		this.now = new Date();
		this.ctx.fillStyle = "#FDFDFD";
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
		this.animationID = requestAnimationFrame(this.update.bind(this));

		this.drawSchedule(this.ctx, this.center);
        this.canvas.onmousemove = this.doMouseMove.bind(this);
        this.canvas.onclick = this.doMouseDown.bind(this);

        if(this.state == this.STATE.HOVER){		//draw add new button
			var distance = new Vector(this.mouse.x-this.center.x, this.mouse.y-this.center.y);
			var drawNew = calculateVector(distance.angle, this.MAIN.radius);
			this.drawNodeTriangle(this.ctx, '#FCC', distance.angle);
			this.ctx.fillStyle = "#FFFF00";
			this.ctx.beginPath();
			this.ctx.arc(this.center.x + drawNew.x, this.center.y - drawNew.y, 25, 0, Math.PI*2, false);
			this.ctx.fill();
		}
		if(this.state == this.STATE.EDIT){
			for(var i in this.targets){
				if(this.targets[i].state == this.TARGET_STATE.EDIT){
					this.ctx.save();
					//this.rotate();
					this.ctx.fillStyle = "#F00";
					this.ctx.beginPath();
					this.ctx.arc(30, 30, 25, 0, Math.PI*2, false);
					this.ctx.fill();
				}
			}
		}
	},

	drawSchedule: function(ctx, center){
		ctx.strokeStyle = "#AAA";
		ctx.lineWidth = 33;

		this.drawTimes(ctx, center);

		//draws triangle that indicates current time
		this.drawTriangle(ctx, '#F00', (this.now.getHours()*60+this.now.getMinutes())/1440*(2*Math.PI));

		//draws circle
		ctx.beginPath();
		ctx.arc(center.x, center.y, this.MAIN.radius, 0, Math.PI*2, false);
		ctx.stroke();

		//write temp

		//draw text
		this.fillText(this.now.today(), center.x, center.y-90, "20pt 'Source Sans Pro Light'", '#00AFD8');
		this.fillText(this.now.time(), center.x, center.y+90, "25pt 'Source Sans Pro'", '#999999');
		this.fillText(thermostat.ambient_temperature_f + '°', center.x, center.y, "40pt 'Source Sans Pro'", '#999999');
	},

	drawTriangle: function(ctx, fill, r){
		ctx.save();
		ctx.fillStyle = fill;
		ctx.translate(this.center.x, this.center.y);
		ctx.rotate(r);
		ctx.beginPath();
		ctx.moveTo(0, -this.MAIN.radius+35);
		ctx.lineTo(27, -this.MAIN.radius);
		ctx.lineTo(-27, -this.MAIN.radius);
		ctx.closePath();
		ctx.fill();
		ctx.restore();
	},

	drawNodeTriangle: function(ctx, fill, r){
		ctx.save();
		ctx.fillStyle = fill;
		ctx.translate(this.center.x, this.center.y);
		ctx.rotate(r);
		ctx.beginPath();
		ctx.moveTo(0, -this.MAIN.radius+38);
		ctx.lineTo(22, -this.MAIN.radius+10);
		ctx.lineTo(-22, -this.MAIN.radius+10);
		ctx.closePath();
		ctx.fill();
		ctx.restore();
	},

	drawTimes: function(ctx, center){
		ctx.save();
		ctx.translate(center.x, center.y);
		ctx.strokeStyle = "#CCCCCC";
		ctx.lineWidth = 1;

		var time = "";
		for(var i = 0; i < 24; i++){
			ctx.save();
			ctx.translate(0, -this.MAIN.radius)
			ctx.beginPath();
			ctx.moveTo(0, 0);
			ctx.lineTo(0, 30);
			ctx.stroke();
			if(i%3 == 0){
				ctx.save();
				ctx.translate(0, 60);
				ctx.rotate(-Math.PI/12*i);
				ctx.translate(0, 7);
				if(i == 0)
					time = "12 AM";
				else if(i < 12)
					time = i + " AM";
				else if(i == 12)
					time = "12 PM";
				else
					time = i-12 + " PM";
				this.fillText(time, 0, 0, "15pt 'Source Sans Pro Light'", '#777');
				ctx.restore();
			}
			ctx.restore();
			ctx.rotate(Math.PI/12);
		}
		ctx.restore();
	},

	createTarget: function(ctx, center){
		var targetLocation = new Vector(this.mouse.x-this.center.x, this.mouse.y-this.center.y);
		var time = targetLocation.angle/(Math.PI*2)*1440;
		this.targets.push(new TargetTemp(time, 60));
		console.dir(this.targets[0]);
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
		if(this.state == this.STATE.HOVER){
			this.state = this.STATE.EDIT;
			this.createTarget();
		}
	},

	fillText: function(string, x, y, css, color){
		this.ctx.save();
		this.ctx.textAlign = "center";
		this.ctx.font = css;
		this.ctx.fillStyle = color;
		this.ctx.fillText(string, x, y);
		this.ctx.restore();
	}
}

var TargetTemp = function(time, temp){
	this.time = time;
	this.temp = temp;
	this.state = 2;
};

var DaySchedule = function(day, targets){
	this.day = day;
	this.targets = targets;
}

function getMouse(e){      //get mouse info
	var mouse = {};
	mouse.x = e.pageX - e.target.offsetLeft;
	mouse.y = e.pageY - e.target.offsetTop;
	return mouse;
}

//text for days and months
var days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
var months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

Date.prototype.today = function(){	//formats date text
	return (days[this.getDay()] + " " + months[this.getMonth()] + " " + this.getDate());
}

Date.prototype.time = function(){	//formats time text
	var h = this.getHours();
	var m = this.getMinutes();
	var t = "AM";
	if(h == 0){
		h = 12;
	}
	if(h > 12){
		h -= 12;
		t = "PM";
	}
	if(h < 10)
		h = 0 + h.toString();
	if(m < 10)
		m = 0 + m.toString();
	return (h + ":" + m + " " + t);
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