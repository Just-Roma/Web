"use strict";

/***************************************************************************************\
	This function returns an interface(print and color change) for manipulating "bubbles"
	It's only argument is a canvas object, which will be used for rendering.
	To gain a performance boost a pre-rendering is done internally.
\***************************************************************************************/

function createBubbles(canvas){

	/* The bubbles' radiuses are integers. The largest one(stored in refRad) is taken as a reference for creating the others,
	   despite the fact that it needs more space. The reason is simple: it looks better by scaling, using the smallest one would create awful results.
	   You can play around with this value(set to some positive integer), the code below will response automatically.
	*/
	let refRad = Math.min(120,Math.round(canvas.width*canvas.height/7400));
	if(refRad < 40) refRad = 40; // For mobile screens.

	/* Since a bubbles's pattern is relatively complicated, it would be very inefficient to compute it in each new frame.
	   So a stack of frames will be initialised and used later for animation.
	   Although scaling images in drawImage is not recommended, we'll do it anyway, otherwise the number of predefined frames will be too large.
	   The frames will be stored in a set of small offscreen canvases. 
	*/
	const offCanvas = document.createElement('canvas');

	// The canvas' radius will be 5 pixels larger to make space for a shadow. '+1' to place the bubble exactly in the canvas' center.
	const offCanvasWH = refRad*2 + 11;
	offCanvas.width  = 0;
	offCanvas.height = 0;
	for(let frame = 0; frame < 50; frame++){
		offCanvas[frame] = document.createElement('canvas');
		offCanvas[frame].width  = offCanvasWH;
		offCanvas[frame].height = offCanvasWH;
	}

	// Here the frames are created.
	(function(){

		// Matrix will store the bubble's opacity pattern.
		class Matrix{
			constructor(width, height){
				this.width   = width;
				this.height  = height;
				this.content = Array.from({length: width*height}, () => 0);
			}
			get(x, y)        {return this.content[y*this.width + x];}
			set(x, y, entry) {this.content[y*this.width + x] = entry;}
		}
		let bubMat = new Matrix(refRad*2+1, refRad*2+1); // '+1' to place the center at the right position, namely at the index 60.
		let dist;

		/* Opacity corresponds to the exponential distribution(lambda = 1), but the normal results will be too smooth.
		   To make it more "rugged" a random value from [-0.15, 0.15] is added, these values are chosen arbitrarily, based on my taste.
		   The x axis must be scaled, otherwise the majority of values will be ~ 0. The area between 0 and 3.(3) covers ~ 96 % of distribution.
		*/
		for(let x = refRad*2; x >= 0; x--){
			for(let y = refRad*2; y >= 0; y--){
				dist = Math.sqrt((x-refRad)**2 + (y-refRad)**2);
				if (dist <= refRad){
					bubMat.set(x, y, (Math.random()*3-1.5)/10 + Math.exp((dist-refRad)/(refRad/3.333333)));
				}
			}
		}

		/* ImageData object will be filled and then printed on the canvas. It's much faster than filling the canvas.
		   Though constructor ImageData can be used, it's experimental(not completely supported) at the date of writing. 
		*/
		let imageData = offCanvas.getContext('2d').createImageData(refRad*2+1, refRad*2+1);
		let ctxFrame;

		let amplifier = 1.5;

		/* Each frame will be filled with some color(R=G=B) from [100, 200], which correlates with opacity.
		   This colors' range was chosen to make bubbles as juicy as possible but not too bright.
		   It can be adjusted below to get another rendering results.
		*/
		let colors, color;
		let center = refRad+5; // bubble's center on an off-screen canvas.

		for (let frame = 49; frame >= 0; frame--){
			amplifier -= 0.03;
			color = Math.max(100, Math.round(133*amplifier));
			imageData.data.fill(color);
			for(let x = refRad*2; x >= 0; x--){
				for(let y = refRad*2; y >= 0; y--){
					imageData.data[y*(refRad*2+1)*4 + 4*x+3] = 255*bubMat.get(x, y)*amplifier;
				}
			}

			ctxFrame = offCanvas[frame].getContext('2d');
			ctxFrame.putImageData(imageData, 5, 5);

			// Without this filling a part of the bubble's center will be too dark.
			colors = 'rgba(' + color + ',' + color + ',' + color + ',';
			ctxFrame.fillStyle = colors + amplifier/5 + ')';
			ctxFrame.beginPath();
			ctxFrame.arc(center, center, refRad+1, 0, Math.PI *2);
			ctxFrame.fill();

			// Add a shadow to make the bubble slightly more beautiful.
			ctxFrame.shadowColor = colors + '1)';
			ctxFrame.shadowBlur = 5;

			// These strokes exist solely to make the bubble's external circle smoother, the shadow will be also put on them.
			ctxFrame.strokeStyle = colors + amplifier + ')';
			ctxFrame.beginPath();
			ctxFrame.arc(center, center, refRad-0.5, 0, Math.PI *2);
			ctxFrame.stroke();
			ctxFrame.beginPath();
			ctxFrame.arc(center, center, refRad, 0, Math.PI *2);
			ctxFrame.stroke();
			ctxFrame.beginPath();
			ctxFrame.arc(center, center, refRad+0.5, 0, Math.PI *2);
			ctxFrame.stroke();
			ctxFrame.shadowBlur = 0; // Don't forget to turn off the shadow.
		}
	})();

	class Bubble{

		constructor(){
			this.x;
			this.y;
			this.radius;
			this.speed;
			this.rgb;
			this.amplifier;     // Used to amplify opacity.
			this.amplifier_max;
			this.scale;         // Used to scale the pre-rendered canvas.
		}

		// Support function for checking the distance between bubbles.
		checkPos(curBub){
			for(let i = n_bubbles-1; i >= 0; i--){
				if(curBub != o_O[i] && (Math.sqrt((curBub.x - o_O[i].x)**2 + (curBub.y - o_O[i].y)**2) < (curBub.radius + o_O[i].radius)/2)) return true;
			}
			return false;
		}

		selfChange(){
			// Max amplifier lies betwen 35 and 50.
			this.amplifier_max = Math.round((3.5 + 1.5*Math.random())*10);

			/* It does not look good when bubbles overlap too much, give em a chance to find an empty spot.
			   Testing showed that increasing the min allowed distance spawns lots of little bubbles, 
			   besides it does not really look better when they don't overlap.
			*/
			let i = 0;
			do{
				this.radius = 25 + Math.round(Math.random()*(refRad-25));

				this.speed = refRad/this.radius;

				// The valid width range is reduced by radius from the left/right side. 26 is because of the border from main.js
				this.x = 26 + this.radius + Math.round(Math.random()*(width - 2*this.radius - 52));

				// Еhe possible start position is shifted downwards, so bubbles won't flow beyond canvas.
				this.y = this.radius + Math.ceil((this.amplifier_max*2-1)*this.speed + Math.random()*(height - (2*this.radius + (this.amplifier_max*2-1)*this.speed)));

				i++;
			}while(this.checkPos(this) && i < 20);

			// To make the picture more interesting the bubbles will have slightly different colors.
			this.rgb = 'rgba(' + (RGB[0]-25+Math.round(Math.random()*50)) + ','
					   + (RGB[1]-25+Math.round(Math.random()*50)) + ','
					   + (RGB[2]-25+Math.round(Math.random()*50)) + ',';

			this.amplifier = this.amplifier_max-1;

			this.scale = this.radius/refRad;
		}

		print(){

			/* First print the scaled opacity frame to put a basement for the further coloring.
			   The value of currentAmplifier is automatically calculated, it goes from 1 to 'amplifier_max' and then back to 1.
			   The second/third arguments must be shifted to the left top corner by the scaled frame radius.
			*/
			let currentAmplifier = this.amplifier_max - Math.abs(this.amplifier % this.amplifier_max);
			ctx.drawImage(offCanvas[currentAmplifier - 1],
				      this.x - (refRad + 5)*this.scale,
				      this.y - (refRad + 5)*this.scale,
				      this.scale*offCanvasWH,
				      this.scale*offCanvasWH);

			// Put a color on the basement, fillStyle's opacity must be adjusted according to "currentAmplifier".
			ctx.globalCompositeOperation = 'color';
			ctx.fillStyle = this.rgb + currentAmplifier/this.amplifier_max + ')';
			ctx.beginPath();
			ctx.arc(this.x, this.y, this.radius+1, 0, Math.PI *2);
			ctx.fill();

			// Change back the mode and actualize the current Bubble's parameters.
			ctx.globalCompositeOperation = 'source-over';
			this.y -= this.speed;
			this.amplifier -= 1;
			if (this.amplifier == -this.amplifier_max) this.selfChange();
		}
	}

	// Local reference to the canvas' context.
	const ctx = canvas.getContext('2d');

	// '-1' to avoid placing a part of a bubble beyond the canvas.
	const width = canvas.width - 1;
	const height = canvas.height - 1;

	// n_bubbles restricts the amount of bubbles to be printed, max allowed number is 50.
	let n_bubbles = Math.min(50, Math.round(width*height/(refRad*2 * refRad*2)));

	// RGB defines the "average" color of a bubble.
	let RGB = [document.getElementById('bubblesRed').value, document.getElementById('bubblesGreen').value, document.getElementById('bubblesBlue').value];

	// Bubbles' initialization.
	const o_O = Array.from({length: n_bubbles}, () => new Bubble());
	for (let i = 0; i < n_bubbles; i++) {o_O[i].selfChange();}

	let BubblesSetter = document.getElementById('Setting_bubbles_number');

	return {
		red  (new_color){RGB[0] = Number(new_color.target.value);},
		green(new_color){RGB[1] = Number(new_color.target.value);},
		blue (new_color){RGB[2] = Number(new_color.target.value);},
		print(){for (let i = BubblesSetter.value-1; i >= 0; i--) o_O[i].print();}
	}
};
