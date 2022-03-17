/* This is the main script for the animation.
	It defines the canvas' properties and sets some event listeners for the user interaction.
*/

"use strict";

const Canvas = document.getElementById('Canvas');
let ctx, background, bubbles, set_border;

/* This function prints a transparency "transition border", which makes every canvas' edge progressively transparent.
	The main intention of this border is to let the background slowly come "out of nowhere" from the top and "dissappear" at the bottom.
	Though this border could be prerendered on an off-screen canvas, testing showed no significant difference.
*/

function initializeBorder(){

	const ctx    = Canvas.getContext('2d');
	const width  = Canvas.width;
	const height = Canvas.height;
	let shift; // 'shift' will change the area to be filled, otherwise some pixels will be colored by different expressions.

	return function(){

		shift = 0;
		for(let i = 25; i >= 0; i--){
			ctx.fillStyle = 'rgba(0,0,0,' + i/25 +')';

			// top: *2 because each new top border layer has 2 pixels fewer.
			ctx.fillRect(shift, shift, width-shift*2, 1);

			// bottom: -1 in the second arg, cause indexing starts with 0, so the last index is height-1.
			ctx.fillRect(shift, height-shift-1, width-shift*2, 1);

			// left: +1 in the second arg to not overlap with the top border.
			// (shift+1) because it starts at the index 1(aka second row).
			ctx.fillRect(shift, shift+1, 1, height-(shift+1)*2);

			//right: -1 in the first arg for the same reason as in the bottom.
			ctx.fillRect(width-shift-1,shift+1, 1, height-(shift+1)*2);

			shift++;
		}
		/* this border construction looks like this:
		   -------
			|-----|
			||---||
			||   ||
			||---||
			|-----|
			-------  '-' is for top and bottom and '|' for left and right. Each pixel is colored only once.
		*/
	}
};

let backgroundRed = document.getElementById('backgroundRed');
let backgroundGreen = document.getElementById('backgroundGreen');
let backgroundBlue = document.getElementById('backgroundBlue');
let bubblesRed = document.getElementById('bubblesRed');
let bubblesBlue = document.getElementById('bubblesBlue');
let bubblesGreen = document.getElementById('bubblesGreen');
let bubblesNumberSetter = document.getElementById('Setting_bubbles_number');

function initializeAll(){

	// Set canvas' sizes according to the window's size.
	Canvas.width  = Math.round(window.innerWidth* 0.85);
	Canvas.height = window.innerHeight;
	
	// Adjust the Bubbles' size parameters. refRad is the Bubbles's radius as in the Bubbles.js
	// -1 is exactly as in the Bubbles.js to avoid the chance of producing another number.
	let refRad = Math.min(120,Math.round(Canvas.width*Canvas.height/7400));
	if(refRad < 40) refRad = 40;
	document.getElementById('Setting_bubbles_number').max = Math.min(50, Math.round((Canvas.width-1)*(Canvas.height-1)/(refRad*2 * refRad*2)));

	// Create bubbles/background objects.
	background = createBackground(Canvas);

	backgroundRed.addEventListener('change', background.red);
	backgroundGreen.addEventListener('change', background.green);
	backgroundBlue.addEventListener('change', background.blue);

	bubbles = createBubbles(Canvas);

	bubblesRed.addEventListener('change', bubbles.red);
	bubblesGreen.addEventListener('change', bubbles.green);
	bubblesBlue.addEventListener('change', bubbles.blue);
	bubblesNumberSetter.addEventListener('change', bubbles.size);

	// Reset the values.
	backgroundRed.value = '255';
	backgroundGreen.value = '0';
	backgroundBlue.value = '255';

	bubblesRed.value = '0';
	bubblesGreen.value = '255';
	bubblesBlue.value = '255';

	bubbles.setTag('Setting_bubbles_number');

	set_border = initializeBorder();
};
initializeAll();

// Change the canvas by window resizing.
window.addEventListener('resize',()=> initializeAll());

document.getElementById('Change_Background_Button').addEventListener('click', () => background.modifyBackground());

let loadingPage = document.getElementById('loadingPage').style;
let mainPage = document.getElementById('mainPage').style;
loadingPage.display = 'none';
mainPage.display = 'block';

(function march(){
	background.print();
	bubbles.print();
	set_border();
	setTimeout(march, 50);
})();
