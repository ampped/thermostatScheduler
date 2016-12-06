'use strict';

var app = app|| {};

app.draw = function(){
	var draw = {
		MAIN: {
			radius: 245
		},

		mainSchedule: function(ctx, center, now, schedule){
			ctx.save();
			ctx.translate(center.x, center.y);
			ctx.strokeStyle = "#AAA";
			ctx.lineWidth = 33;

			this.times(ctx, center);

			//draws triangle that indicates current time
			this.triangle(ctx, '#F00', (now.getHours()*60+now.getMinutes())/1440*(2*Math.PI));

			//draws circle
			ctx.beginPath();
			ctx.arc(0, 0, this.MAIN.radius, 0, Math.PI*2, false);
			ctx.stroke();

			//draw text
			document.querySelector('.thermInfo').style.left = center.x+'px';
			document.querySelector('.thermInfo').style.top = center.y+'px';
			document.querySelector('.day').innerHTML = now.today();
			document.querySelector('#currentTarget').innerHTML = thermostat.ambient_temperature_f + '<span class="degree">°</span>';
			document.querySelector('.time').innerHTML = now.time();
			/*this.fillText(ctx, now.today(), 0, 0-90, "20pt 'Source Sans Pro Light'", '#00AFD8', 'center');
			this.fillText(ctx, now.time(), 0, 0+90, "25pt 'Source Sans Pro'", '#999999', 'center');
			this.fillText(ctx, thermostat.ambient_temperature_f + '°', 0, 0, "40pt 'Source Sans Pro'", '#999999', 'center');
			*/

			//draw temperature nodes
			var nodes = schedule.nodes;

			//draw duration arcs
			for(var i in nodes){
				var angle = nodes[i].time/1440*(Math.PI*2);

				ctx.strokeStyle = nodes[i].getColor();
				ctx.lineWidth = 33;
				ctx.beginPath();
				ctx.save();
				ctx.rotate(-Math.PI/2);
				if(i < nodes.length-1){
					var j = parseInt(i)+1;
					ctx.arc(0, 0, this.MAIN.radius, nodes[i].time/1440*(Math.PI*2), nodes[j].time/1440*(Math.PI*2), false);
					ctx.stroke();
				}
				else if(i == nodes.length - 1){
					ctx.arc(0, 0, this.MAIN.radius, nodes[i].time/1440*(Math.PI*2), nodes[0].time/1440*(Math.PI*2) + (Math.PI*2), false);
					ctx.stroke();
				}
				ctx.restore();
				this.nodeTriangle(ctx, nodes[i].getColor(), angle);
			}

			//draw node circles
			for(var i in nodes){
				ctx.save();
				var angle = nodes[i].time/1440*(Math.PI*2);
				ctx.rotate(angle);
				ctx.translate(0, -this.MAIN.radius);
				ctx.rotate(-angle);
				ctx.fillStyle = nodes[i].getColor();
				ctx.beginPath();
				ctx.arc(0, 0, 30, 0, Math.PI*2, false);
				ctx.fill();
				this.fillText(ctx, nodes[i].temp, 0, 10, "20pt 'Source Sans Pro'", '#0FF', 'center');
				ctx.restore();
			}

			ctx.restore();
		},

		triangle: function(ctx, fill, r){
			ctx.save();
			ctx.fillStyle = fill;
			ctx.rotate(r);
			ctx.beginPath();
			ctx.moveTo(0, -this.MAIN.radius+35);
			ctx.lineTo(27, -this.MAIN.radius);
			ctx.lineTo(-27, -this.MAIN.radius);
			ctx.closePath();
			ctx.fill();
			ctx.restore();
		},

		nodeTriangle: function(ctx, fill, r){
			ctx.save();
			ctx.fillStyle = fill;
			ctx.rotate(r);
			ctx.beginPath();
			ctx.moveTo(0, -this.MAIN.radius+38);
			ctx.lineTo(22, -this.MAIN.radius+10);
			ctx.lineTo(-22, -this.MAIN.radius+10);
			ctx.closePath();
			ctx.fill();
			ctx.restore();
		},

		times: function(ctx, center){
			ctx.save();
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
					this.fillText(ctx, time, 0, 0, "15pt 'Source Sans Pro Light'", '#777', 'center');
					ctx.restore();
				}
				ctx.restore();
				ctx.rotate(Math.PI/12);
			}
			ctx.restore();
		},

		editInfo: function(ctx, center, angle, node){
			//draw node
			ctx.save();
			ctx.translate(center.x, center.y);
			this.nodeTriangle(ctx, node.getColor(), angle);
			ctx.rotate(angle);
			ctx.fillStyle = "#F00";
			ctx.translate(0, -this.MAIN.radius);
			/*ctx.beginPath();
			ctx.arc(0, 0, 25, 0, Math.PI*2, false);
			ctx.fill();
			ctx.save();
			ctx.rotate(-angle);
			this.fillText(ctx, node.temp, 0, 10, "20pt 'Source Sans Pro'", '#0FF', 'center');
			ctx.restore();*/

			//draw node information
			ctx.strokeStyle = "#AAA";
			ctx.lineWidth = 1;
			ctx.translate(0, -30);
			ctx.rotate(-angle);
			if(angle < Math.PI){
				ctx.translate(30, 0);
				ctx.beginPath();
				ctx.moveTo(0, 0);
				ctx.lineTo(200, 0);
				ctx.stroke();
				ctx.arc(200, 0, 15, 0, Math.PI*2, false);
				ctx.arc(162, 0, 15, 0, Math.PI*2, false);
				ctx.fill();
				this.fillText(ctx, getTimeFormat(angle/(Math.PI*2)*1440), 0, -50, "15pt 'Source Sans Pro'", '#777', 'left');
				this.fillText(ctx, app.main.getWeatherAt(angle/(Math.PI*2)*1440), 0, -20, "15pt 'Source Sans Pro'", '#777', 'left');
			}
			else{
				ctx.translate(-30, 0);
				ctx.beginPath();
				ctx.moveTo(0, 0);
				ctx.lineTo(-200, 0);
				ctx.stroke();
				ctx.arc(-200, 0, 15, 0, Math.PI*2, false);
				ctx.arc(-162, 0, 15, 0, Math.PI*2, false);
				ctx.fill();
				ctx.textAlign = 'right';
				this.fillText(ctx, getTimeFormat(angle/(Math.PI*2)*1440), 0, -50, "15pt 'Source Sans Pro'", '#777', 'right');
				this.fillText(ctx, app.main.getWeatherAt(angle/(Math.PI*2)*1440), 0, -20, "15pt 'Source Sans Pro'", '#777', 'right');
			}
			ctx.restore();
		},

		fillText: function(ctx, string, x, y, css, color, align){
			ctx.save();
			ctx.textAlign = align;
			ctx.font = css;
			ctx.fillStyle = color;
			ctx.fillText(string, x, y);
			ctx.restore();
		}
	}
	return draw;
}();