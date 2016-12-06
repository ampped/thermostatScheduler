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
	hoverImg: undefined,
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
	tempMin: 50,
	tempMax: 90,
	schedules: [],
	s: 0,

	init: function(){
		draw = app.draw;
		console.log('init called ');

		//set up canvas
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

		//set temperature range to user settings
		if(thermostat.is_locked){
			this.tempMin = thermostat.locked_temp_min_f;
			this.tempMax = thermostat.locked_temp_max_f;

			document.querySelector('#tempSlider').setAttribute('min', this.tempMin);
			document.querySelector('#tempSlider').setAttribute('max', this.tempMax);
		}

		//set up image
		this.hoverImg = new Image();
		this.hoverImg.src = 'img/hoverNew.png';

		this.state = this.STATE.DEFAULT;

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
			var drawNew = calculateVector(Math.PI-distance.angle, this.MAIN.radius);
			this.targetAngle = distance.angle;
			this.ctx.save();
			this.ctx.translate(this.center.x, this.center.y);
			draw.nodeTriangle(this.ctx, '#CCC', distance.angle);
			this.ctx.drawImage(this.hoverImg, drawNew.x-35, drawNew.y-35);
			this.ctx.restore();
			this.ctx.fillStyle = "#FFFF00";
		}
		if(this.state == this.STATE.EDIT){
			var node = this.s.nodes[this.getEditI()];
			//node.time = getTime(this.targetAngle);
			draw.editInfo(this.ctx, this.center, getAngle(node.time), node);
			this.ctx.restore();
			this.getWeatherAt(getAngle(node.time));
		}
	},

	getWeatherAt: function(time){
		var newDate = new Date();
		newDate.setDate(newDate.getDate()+1);
		time /= 60;
		time = Math.floor(time);
		//time = Math.floor(time - (time%3));
		if(time < 10)
			time = '0' + time;
		var year = newDate.getUTCFullYear();
		var month = newDate.getMonth()+1;
		var day = newDate.getDate();
		if(month < 10)
			month = '0'+month;
		if(day < 10)
			day = '0'+day;
		var when = year + "-" + month + "-" + day + "T" + time + ":00:00-05:00";
		for(var i = 0; i < forecast.response[0].periods.length; i++){
			if(forecast.response[0].periods[i].dateTimeISO == when){
				return ('Outside: ' + Math.round(forecast.response[0].periods[i].avgTempF) + ' °F');
			}
		}
		return 'not found';
	},

	createNode: function(){
		var time = this.targetAngle/(Math.PI*2)*1440;
      	
		var newNode = new TempNode(time, Math.round((this.tempMax+this.tempMin)/2));

		//create node in html
		var domNode = document.createElement('div'); 
		domNode.setAttribute('id', "editNode"); 
		domNode.setAttribute('class', "node editUI");
		domNode.innerHTML = '<img src="img/nodeButton.png" class="nodeButton"><h2 id="editTemp" class="nodeTemp"></h2>';
		domNode.style.display = 'none';
		document.querySelector('main').appendChild(domNode);

		//update edit UI when new node is made
		document.querySelector('#tempSlider').value = newNode.temp;
		document.querySelector('#editTemp').innerHTML = newNode.temp + '°';
		document.querySelector('#editTemp').style.color = newNode.getColor();
		makeDraggable();

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
	},

	getEditI: function(){
		for(var i = 0; i < this.s.nodes.length; i++){
			var node = this.s.nodes[i];
			if(node.state == this.NODE_STATE.EDIT){
				return i;
			}
		}
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
			$('#editNode').addClass('defaultNode');
			$('#editNode').removeClass('editUI ui-draggable ui-draggable-handle');
			$('#editNode').draggable('disable');
			$('.editUI').toggle();
			document.querySelector('#editNode').setAttribute('id', "");
			document.querySelector('#editTemp').setAttribute('id', "");

			makeHover();

			//set state current selected node to default
			this.s.nodes[this.getEditI()].state = this.NODE_STATE.DEFAULT;

			this.state = this.STATE.DEFAULT;
		}
		if(this.state == this.STATE.HOVER){
			this.state = this.STATE.EDIT;

      	    this.targetAngle -= this.targetAngle % getAngle(15);
	        if(this.targetAngle % getAngle(15) > getAngle(15)/2)
	      		this.targetAngle += getAngle(15);

			this.createNode();

			//borrowed code from drag in index.html to set position of editNode
			var postop = Math.ceil(this.center.y + (Math.cos( Math.PI - this.targetAngle ) * this.MAIN.radius));
		    var posleft = Math.ceil(this.center.x + (Math.sin( Math.PI - this.targetAngle ) * this.MAIN.radius))

		    $('#editNode').css({'top': postop, 'left': posleft});

		    if(this.targetAngle < Math.PI){
			    $('#tempSlider').css({'top': postop, 'left': posleft+100});
			}
			else{
				$('#tempSlider').css({'top': postop, 'left': posleft-200});
			}

			$('.editUI').toggle();
		}
	}
}

var TempNode = function(time, temp){
	this.time = time;
	this.temp = temp;
	this.state = 2;
};

TempNode.prototype.getColor = function(){	//gets rgb values based on temperature
	var range = app.main.tempMax - app.main.tempMin;

	//yellowest(255, 248, 183) orange(255, 102, 0) reddest(230, 49, 23)
	var r = Math.floor(255 - (this.temp-app.main.tempMin)/(range/2)*25 + 25);
	if(r > 255)
		r = 255;

	var g = (this.temp-app.main.tempMin)/range;
	if(g <= 0.5)
		g = Math.floor(248 - (this.temp-app.main.tempMin)/(range/2)*146);
	else
		g = Math.floor(102 - (this.temp-app.main.tempMin)/(range/2)*53 + 53);

	var b = (this.temp-app.main.tempMin)/range;
	if(b <= 0.5)
		b = Math.floor(183 - (this.temp-app.main.tempMin)/(range/2)*183);
	else
		b = Math.floor((this.temp-app.main.tempMin)/(range/2)*23 - 23);

	return ('rgb(' + r + ', ' + g + ', ' + b + ')');
}

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
	return Math.round(angle/(Math.PI*2)*1440);
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
	var minutes = Math.round(time%60);
	var period = "AM";
	if(hours == 12)
		period = "PM";
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