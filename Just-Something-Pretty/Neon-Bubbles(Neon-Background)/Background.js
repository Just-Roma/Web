"use strict";

/* This function distributes the background dots(colorful pixels).
   First dots are distributed uniformly, after that a set of "dots clouds" is put on the canvas.
*/

let createBackground = function(canvas){

	const ctx  = canvas.getContext('2d');
	let width  = canvas.width;
	let height = canvas.height;

	let O_o = ctx.createImageData(width, height); // Will contain the dots.
	let directions; // A support object which will store the direction of opacity change(should it become brighter or fainter).
	let RGB = [document.getElementById('backgroundRed').value, document.getElementById('backgroundGreen').value, document.getElementById('backgroundBlue').value]; // Set RGB according to parameters.
	let dotsCounter;

	// The background is created here.
	function modifyBackground(){

		O_o.data.fill(0); // Clean the background. Necessary if a user clicks on the change button.

		let newX, newY, index;
		// We dont want to place a dot outside of the canvas, so -1.
		let W = width - 1;
		let H = height - 1;

		// 0.5% of the canvas' area is uniformly filled.
		for(let nDots = Math.floor(0.005*width*height); nDots > 0; nDots--){

			do{
				newX = Math.round(Math.random()*W);
				newY = Math.round(Math.random()*H);
			}while(O_o.data[newY*width*4 + 4*newX+3]);

			index = newY*width*4 + 4*newX;
			O_o.data[index]   = RGB[0] - 25+Math.random()*50;
			O_o.data[index+1] = RGB[1] - 25+Math.random()*50;
			O_o.data[index+2] = RGB[2] - 25+Math.random()*50;
			O_o.data[index+3] = 17*Math.round(1+Math.random()*13); // Some random opacity is set to create the flickering effect.
		}
		dotsCounter = Math.floor(0.005*width*height);

		/* Here is the more interesting part. It puts the "dots clouds" on the canvas. These are gauss distributed groups of single dots.
		   x/y is the center of a such group, 
		   Pr decides if a current group can spawn another group, 
		   dir(direction) used to avoid placing groups back on already taken spots.
		*/
		function clouds(x, y, Pr, dir = 0){

			if (x < 20 || x > W-20 || y < 20 || y > H-20) return;

			/* 'amplifier' will "stretch" our random standard gauss. 
			   Math.log(Math.random()) is the random number generator for the standard exponential distribution.
			   This range is taken because i thought that results look good enough.
			*/
			let amplifier = 2 - Math.log(Math.random());

			let U,V; // variables for the Box-Muller algorithm(aka random gauss).

			// there is a possibility that a new group's center will 'land' on a highly dense area, so some protection from infinite loop is needed.
			let protection;
			for (let nDots = Math.round(2*amplifier); nDots > 0; nDots--)
			{
				protection = 0;

				do{
					// Here Box-Muller algorithm.
					U = Math.random(); V = Math.random();
					newX = Math.round(x + amplifier*Math.sqrt(-2*Math.log(U))*Math.cos(2*Math.PI*V));
					newY = Math.round(y + amplifier*Math.sqrt(-2*Math.log(U))*Math.sin(2*Math.PI*V));

					protection++;
					if (protection >= 10) break;

					/* Since gauss exists on all real numbers, it is possible that extreme values will be produced(unlikely though).
					   Just to be sure that our positions lie within the correct range, x/y are checked. 
					   2 pixels are added because of the border from main.js.
					*/
				}while (newX < 2 || newX > width-2 || newY < 0 || newY >= height || O_o.data[newY*width*4 + 4*newX+3]);

				if(protection >= 10) break;

				index = newY*width*4 + 4*newX;
				// Some color variation is introduced.
				O_o.data[index]   = RGB[0] - 25+Math.random()*50;
				O_o.data[index+1] = RGB[1] - 25+Math.random()*50;
				O_o.data[index+2] = RGB[2] - 25+Math.random()*50;
				O_o.data[index+3] = 17*Math.round(1+Math.random()*13);
				dotsCounter++;
			}

			/* It is unnecessary to spawn new centers in the previous direction from where it came, so for each case one direction must be excluded.
			   -Math.log(Math.random())/(1/amplifier) is the random exponential distribution. 
			   Lambda depends on amplifier. Larger amplifier throws the new center further away.
			   'amplifier*2' is added to lower the possibility of too dense clusters.
			*/
			if(Math.random() < Pr && amplifier/15 < Math.random() && dir != 4){
				clouds(x+amplifier*2+(-Math.log(Math.random())/(1/amplifier)), y+amplifier*2+(-Math.log(Math.random())/(1/amplifier)), Pr-0.01, 1);
			}
			if(Math.random() < Pr && amplifier/15 < Math.random() && dir != 3){
				clouds(x-amplifier*2-(-Math.log(Math.random())/(1/amplifier)), y+amplifier*2+(-Math.log(Math.random())/(1/amplifier)), Pr-0.01, 2);
			}
			if(Math.random() < Pr && amplifier/15 < Math.random() && dir != 2){
				clouds(x+amplifier*2+(-Math.log(Math.random())/(1/amplifier)), y-amplifier*2-(-Math.log(Math.random())/(1/amplifier)), Pr-0.01, 3);
			}
			if(Math.random() < Pr && amplifier/15 < Math.random() && dir != 1){
				clouds(x-amplifier*2-(-Math.log(Math.random())/(1/amplifier)), y-amplifier*2-(-Math.log(Math.random())/(1/amplifier)), Pr-0.01, 4);
			}
		}

		/* Some number of clouds based on the resolution is chosen. 
		   The allowed area is reduced to decrease the probability that clouds on the canvas' edges will be cut. */
		for (let i = Math.round(width*height/25000); i >= 0; i--) clouds(50 + Math.random()*(width-100),75+ Math.random()*(height-150), 0.5);

		/* The 'directions' array is filled here. 30 bits(starting from LSB) correspond to the dot's index in O_o(Image map).
		   the 31th bit is used for direction(1 or 0). */
		directions = Array.from({length: dotsCounter}, () => Math.round(Math.random()));
		dotsCounter--;
		for(let x = W; x >= 0; x--){
			for(let y = H; y >= 0; y--){
				if(!O_o.data[y*width*4 + x*4+3]) O_o.data[y*width*4 + x*4+3] = 255; // Make the unoccupied spots untransparent.
				else{
					directions[dotsCounter] = ((directions[dotsCounter] << 30) | (y*width*4 + x*4+3));
					dotsCounter--;
				}
			}
		}
	}
	modifyBackground();

	/* >>30 to extract the direction, &1073741823 to extract the index, 1073741823 is 2^30-1 in binary, 1111...111 30 times.
	   |1073741824 to set the direction. 1073741824 is 2^30 or 1000...000 */
	function actualiseDots(){

		for(let dot = directions.length-1; dot >= 0; dot--){

				if(directions[dot] >> 30) O_o.data[directions[dot] & 1073741823] += 17;
				else O_o.data[directions[dot] & 1073741823] -= 17;

				if (O_o.data[directions[dot] & 1073741823] == 0)   directions[dot] |= 1073741824;
				if (O_o.data[directions[dot] & 1073741823] == 255) directions[dot] &= 1073741823;
		}
	}

	function modifyColor(offset){
		let color_index = Math.abs(offset-3);
		for(let dot = directions.length-1; dot >= 0; dot--){
			O_o.data[(directions[dot] & 1073741823) - offset] = RGB[color_index] - 25+Math.random()*50;
		}
	}

	let shift = 0; // Used for rotation.
	return{
		red  (new_color){RGB[0] = Number(new_color.target.value); modifyColor(3);},
		green(new_color){RGB[1] = Number(new_color.target.value); modifyColor(2);},
		blue (new_color){RGB[2] = Number(new_color.target.value); modifyColor(1);},
		modifyBackground,
		print(){
			// Separate the image into two blocks to create a rotating effect.
			ctx.putImageData(O_o, 0, shift, 0, 0, width, height-shift);
			ctx.putImageData(O_o, 0, -height+shift+1, 0, height-shift, width,shift);
			actualiseDots();
			shift = (shift+1)%height;
		}
	}
};
