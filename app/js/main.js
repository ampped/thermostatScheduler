"use strict";

var app = app || {};

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
	SCHEDULE_STATE: {
		DEFAULT: 0,
		SELECTED: 1,
		NEXT: 2
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
	s: undefined,

	init: function(){
		draw = app.draw;

		//set up canvas
		this.canvas = document.querySelector('canvas');
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
		this.ctx = this.canvas.getContext('2d');
		this.center.x = this.canvas.width/2;
		this.center.y = this.canvas.height/2+this.MAIN.shift;

		//set up schedules
		this.now = new Date();
		for(var i = 0; i <= 7; i++){
			this.schedules.push(new Schedule(i));
		}
		this.s = this.schedules[this.now.getDay()];
		this.s.state = this.SCHEDULE_STATE.SELECTED;

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
		var minuteBefore = this.now.getSeconds();
		this.now = new Date();
		var minutes = this.now.getHours()*60 + this.now.getMinutes();
		if(this.now.getSeconds() != minuteBefore){		//when time changes
			for(var i in this.schedules){				//look for correct schedule
				var day = this.schedules[i].date.getDay();
				if(day == this.now.getDay()){
					var nodes = this.schedules[i].nodes;
					for(var j = 0; j < nodes.length; j++){		//look for correct node
						if(minutes >= nodes[j].time && minutes < nodes[(j+1)%nodes.length].time){
							//thermostat.target_temperature_f = nodes[j].temp;
							$('#currentTarget').css('color', nodes[j].getColor());
							thermostat.target_temperature_f = nodes[j].temp;
						}
					}
				}
			}
		}

		this.ctx.fillStyle = "#FDFDFD";
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
		this.animationID = requestAnimationFrame(this.update.bind(this));

		draw.mainSchedule(this.ctx, this.center, this.now, this.s);
        this.canvas.onmousemove = this.doMouseMove.bind(this);
        this.canvas.onclick = this.doMouseDown.bind(this);

        for(var i in this.schedules){
        	if(this.schedules[i].state == this.SCHEDULE_STATE.DEFAULT){
        		draw.schedule(this.ctx, this.center, this.schedules[i]);
        	}
        }

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
			$('.defaultNode').off('mouseenter');
			var node = this.s.nodes[this.getEditI()];
			draw.editInfo(this.ctx, this.center, getAngle(node.time), node);
			this.ctx.restore();
			this.getWeatherAt(getAngle(node.time));
		}
	},

	getWeatherAt: function(time){	//gets temperature at a certain time
		var newDate = new Date();
		newDate.setDate(newDate.getDate()+1);
		time /= 60;
		time = Math.floor(time);
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
		if(this.state == this.STATE.DEFAULT){
			//clicking on another day's schedule
			var schedules = this.schedules;
			var distance;
			for(var i in this.schedules){
				//find clicked schedule
				distance = new Vector(this.mouse.x-schedules[i].xPos, this.mouse.y - this.center.y);
				if(distance.mag < this.MAIN.radius*0.65){
					//remove all nodes from current schedule
					$('.node').remove();

					//change schedules
					this.s.state = this.SCHEDULE_STATE.DEFAULT;
					this.s = schedules[i];
					this.s.state = this.SCHEDULE_STATE.SELECTED;
					for(var j in schedules){
						if(j != 55)
							schedules[j].xPos = app.main.center.x + (schedules[j].day - this.s.day)*600;
					}
					//create all dom nodes of clicked schedule
					for(var k in this.s.nodes){
						this.s.nodes[k].createDOMNode();
					}

					makeHover();
					return;
				}
			}
		}
		else if(this.state == this.STATE.HOVER){
			this.state = this.STATE.EDIT;

			//round angle to 15 minutes
      	    this.targetAngle -= this.targetAngle % getAngle(15);
	        if(this.targetAngle % getAngle(15) > getAngle(15)/2)
	      		this.targetAngle += getAngle(15);

			this.createNode();

			$('.editUI').toggle();
		}
		else if(this.state == this.STATE.EDIT){
		}
	},

	createNode: function(){
		var time = getTime(this.targetAngle);
      	
		var newNode = new TempNode(time, Math.round((this.tempMax+this.tempMin)/2));

		//create node in html
		newNode.createDOMNode();

		document.querySelector('#tempSlider').value = this.temp;

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
	}
}

var TempNode = function(time, temp){	//temperature node constructor
	this.time = Math.round(time);
	this.temp = temp;
	this.state = 2;		//when a node is created it is in edit mode
};

TempNode.prototype.getColor = function(){	//gets rgb values based on temperature
	var range = app.main.tempMax - app.main.tempMin;
	var min = app.main.tempMin;

	//yellowest(255, 248, 183) orange(255, 102, 0) reddest(230, 49, 23)
	var r = Math.floor(255 - (this.temp-min)/(range/2)*25 + 25);
	if(r > 255)
		r = 255;

	var g = (this.temp-min)/range;
	if(g <= 0.5)
		g = Math.floor(248 - (this.temp-min)/(range/2)*146);
	else
		g = Math.floor(102 - (this.temp-min)/(range/2)*53 + 53);

	var b = (this.temp-min)/range;
	if(b <= 0.5)
		b = Math.floor(183 - (this.temp-min)/(range/2)*183);
	else
		b = Math.floor((this.temp-min)/(range/2)*23 - 23);

	return ('rgb(' + r + ', ' + g + ', ' + b + ')');
}

TempNode.prototype.createDOMNode = function(){
	//create node in DOM
	var domNode = document.createElement('div'); 

	domNode.setAttribute('class', "defaultNode node");
	domNode.innerHTML = '<img src="img/nodeButton.png" class="nodeButton"><h2 class="nodeTemp"></h2>';

	if(this.state == 2){	//add appropriate classes/ids if the node is in edit mode
		domNode.setAttribute('id', "editNode"); 
		domNode.setAttribute('class', "node");
		$(domNode).children('.nodeTemp').attr('id', 'editTemp');
	}

	document.querySelector('main').appendChild(domNode);

	//update edit UI when new node is made
	$(domNode).children('.nodeTemp').html(this.temp + '°');
	$(domNode).children('.nodeTemp').css('color', this.getColor());

    //create corresponding edit and delete buttons
    domNode.innerHTML += '<img src="img/edit.png" class="editButton nodeOption nodeOptHidden"><img src="img/x.png" class="deleteButton nodeOption nodeOptHidden">';

    var editButton = $(domNode).children('.editButton');
    var deleteButton = $(domNode).children('.deleteButton');

	//get angles to set positions of buttons
	setPositions(getAngle(this.time));

    //set event of edit button
	editButton.click(function(){
		$('.hovered').attr('id', "editNode");
		$('.hovered').removeClass('defaultNode hovered');
		$('#editNode').off('mouseenter');
		$('#editNode').children('.nodeTemp').attr('id', 'editTemp');
		$('#editNode').children('.nodeOption').addClass('nodeOptHidden');
		makeDraggable();
		$('#editNode').draggable('enable');

        var angle = Math.PI - Math.atan2( $('#editNode').css('left').replace('px','') - app.main.center.x, $('#editNode').css('top').replace('px','') - app.main.center.y );
        setPositions(angle);

		prevTemp = $('#editTemp').html();
		prevTime = angle;

		app.main.state = 2;
		var nodes = app.main.s.nodes;
		nodes[hoveredNodeI].state = 2;
		document.querySelector('#tempSlider').value = nodes[hoveredNodeI].temp;

		$('.editUI').toggle();
	});

    //set event of delete button
	deleteButton.click(function(){
		var nodes = app.main.s.nodes;
		nodes.splice(hoveredNodeI, 1);
		$('.hovered').remove();
	});
}

var Schedule = function(day){	//schedule constructor
	this.day = day;
	this.nodes = [];
	this.state = 0;
	this.xPos = app.main.center.x + (this.day-app.main.now.getDay())*600;
	this.date = new Date();
	this.date.setDate(this.date.getDate()+(this.day-app.main.now.getDay()));
}


function getMouse(e){      //get mouse info
	var mouse = {};
	mouse.x = e.pageX - e.target.offsetLeft;
	mouse.y = e.pageY - e.target.offsetTop;
	return mouse;
}

function getAngle(time){	//converts from time in minutes to angle in radians 
	return (time/1440*(Math.PI*2));
}

function getTime(angle){	//converts from angles in radians to time in minutes
	return Math.round(angle/(Math.PI*2)*1440);
}


//text for days and months
var days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
var months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

Date.prototype.today = function(){	//returns date text
	var date = this.getDate();
	if(date < 10)
		date = '0' + date;
	return (days[this.getDay()-1] + " " + months[this.getMonth()] + " " + date);
}

Date.prototype.time = function(){	//returns time in minutes
	var h = this.getHours();
	var m = this.getMinutes();
	return getTimeFormat(h*60 + m);
}

function getTimeFormat(time){	//returns time in 00:00 AM/PM format
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

function saveAsString(){
	var schedules = app.main.schedules;
	var bigString = '';
	for(var i in schedules){
		var day = schedules[i].day;
		bigString += day + ':';
		var node = schedules[i].nodes;
		for(var j in nodes){
			bigString += nodes[j].time + ',';
			bigString += nodes[j].temp + ';';
		}
		bigString += '|';
	}
	return bigString;
}