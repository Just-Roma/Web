/* This is the main script, which starts the creation of fractal flames.
   It uses several web workers, defined in FractalFlame.html for the calculations.
   Each web worker gets parameters from this script.
*/

"use strict";


// The matrix is used to store the results of calculations.
class Matrix{

  constructor(width, height) {
    this.width = width;
    this.height = height;
    // Each entry stores RGB(first 3 positions) and a counter(how many times a pixel was hit).
    this.entries = Array.from({length: width*height*4}, () => 0);
  }
  
  get(x, y) {return this.entries[y*this.width*4 + x*4+3];}	

  // Set RGB. There can be different ways. This one just sums up the color values.
  set(x, y, value){
    this.entries[y*this.width*4 + x*4]   += value[0];
    this.entries[y*this.width*4 + x*4+1] += value[1];
    this.entries[y*this.width*4 + x*4+2] += value[2];
  }

  // Increases the counter.
  inc(x, y) {this.entries[y*this.width*4 + x*4+3]++;}
}


/*****************************************************/
/* Here comes the definition of different parameters */

let common = {'Canvas' : document.getElementById('Canvas'),
              'ctx' : document.getElementById('Canvas').getContext('2d')};

common.Canvas.width  = Math.round(window.innerWidth*0.85); // The right 15% are for the menu.
common.Canvas.height = window.innerHeight;

Object.assign(common,  
              {'width' : common.Canvas.width, 
              'height' : common.Canvas.height,
              'Image' : common.ctx.createImageData(common.Canvas.width, common.Canvas.height),
              'Matrix' : null,
              'Gamma' : 2.2,
              'blob'  : new Blob([document.querySelector('#worker').textContent], { type: "text/javascript" }),
              'numberOfCoeffs' : Number(document.getElementById('selectAffine').value),
              'numberOfCores' : navigator.hardwareConcurrency > 4? 4:2,
              'disabled': false,
              'allowed': true,
              'execNumber': 0,
              'iterationNumber' : 50000000,
              'Parameters' : null});

/* Define the web workers.
   Depending on the number of available cores the total number of web workers can be either 2 or 4.
*/
for(let i = common.numberOfCores; i > 0; i--){
  let curWorker = 'worker' + String(i);
  Object.assign(common, {curWorker: new Worker(URL.createObjectURL(common.blob))});
}
              
/* Each function can use a user predefined number of affine transformations('numberOfCoeffs' in "common").
   This number will affect the resulting image */
let lookupCoeffs = {'Linear': [4,20],
                    'Sinusoidal': [5,30],
                    'Spherical': [5,20],
                    'Swirl': [5,20],
                    'Horseshoe': [5,20],
                    'Polar': [10,30],
                    'Handkerchief': [10,30],
                    'Heart': [5,25],
                    'Disc': [5,20],
                    'Spiral': [10,30],
                    'Hyperbolic': [10,30],
                    'Diamond': [10,30],
                    'Ex': [10,40],
                    'Julia': [10,40],
                    'Bent': [5,30],
                    'Waves': [10,40],
                    'Fisheye': [15,40],
                    'Popcorn': [10,40],
                    'Exponential': [10,40],
                    'Power': [10,40],
                    'Cosine': [10,40],
                    'Rings': [10,40],
                    'Fan': [20,40],
                    'Blob': [10,40],
                    'PDJ': [50,200],
                    'PDJ2': [50,200],
                    'Pipe': [10,40],
                    'Eyefish': [15,100],
                    'Bubble': [15,50],
                    'Cylinder': [15,50],
                    //'JuliaScope': [15,40],
                    // 'Arch': [15,50],
                    'Tangent': [15,50],
                    // 'Square': [15,50],
                    // 'Twintrian': [10,50],
                    'Cross': [10,50]

}

/* Each function has a set of parameters - coefficients of an affine combination.

	(Xn+1) = (a b) * (Xn) + (c)
	(Yn+1)   (d e)   (Yn)   (f)
	
	These parameters will be randomly chosen each time a new Fi is produced.
	
	According to the original paper the affine transformation is better to be contractive, which means that the following conditions must be checked:
	
	1) a^2 + d^2 < 1
	2) b^2 + e^2 < 1
	3) a^2 + b^2 + d^2 + e^2 < 1 + (ae - bd)^2
	
	They will be chosen from the set [-1;1), 1 is not included because of the way Math.random() works.
	Some of these combinations will probably result in boring/ugly results.
*/

function assignCoeffs(size){
	let out1 = [];
	let out2 = [];
	let a,b,c,d,e,f,rgb;

	while(size > 0){
		do{
			do{
				a = Math.random()*2 - 1;
				d = Math.random()*2 - 1;
			}while((a**2+d**2) >= 1);
			do{
				b = Math.random()*2 - 1;
				e = Math.random()*2 - 1;
			}while((b**2 + e**2) >= 1);
		}while((a**2 + d**2 + b**2 + e**2) >= (1+(a*e - b*d)**2));
		c = Math.random()*2 - 1;
		f = Math.random()*2 - 1;
		out1.push([a,b,c,d,e,f]);

    do{
      rgb = [Math.round(Math.random()*255), Math.round(Math.random()*155), Math.round(Math.random()*155)];
    }while(Math.max(...rgb) < 100);

		out2.push(rgb);
		size--;
	}
	return [out1,out2];
}

/* This function defines the behavior of this script when it gets a message from a web worker.
   Unfortunately each web worker transfers the whole Matrix and the main script takes care of the correction.
   Though the correction can be done in web workers, the quality of resulting images will be much worse.
*/
function workIt(event){

  // First check if a result is for the current fractal creation.
  // A result for the previous fractal will be ingnored.
  if(event.data[1] == common.execNumber){

    let Result = event.data[0]; // A matrix with results.
    let fractalFlameMain = common.Matrix; // The matrix, which collects the results from "Result".
    let fractalFlame = new Matrix(common.width,common.height) // A spare matrix, which will be used to correct the RGB values and opacity.

    // Add the new results to the main matrix and copy entries into "fractalFlame"
    for (let i = common.width*common.height*4-1; i >= 0; i --){
      fractalFlameMain.entries[i] += Result.entries[i];
      fractalFlame.entries[i] = fractalFlameMain.entries[i];
    }

    // Calculate the max value(it will be used later) and adjust the entries.
    let max = 0;
    for (let i = common.width*common.height*4-1; i > 2; i -= 4){

      // Scale the colors by counter and take logarithm of opacity.
      if(fractalFlame.entries[i]){
        fractalFlame.entries[i-3] /= fractalFlame.entries[i];
        fractalFlame.entries[i-2] /= fractalFlame.entries[i];
        fractalFlame.entries[i-1] /= fractalFlame.entries[i];
        fractalFlame.entries[i] = Math.log10(fractalFlame.entries[i]);
      }
      max = Math.max(fractalFlame.entries[i], max);
    }

    let GammaMod; // Gamma correction.
    let Gamma = common.Gamma; // The value was taken from the origanal paper. Basically it affects the brigtness.
    let bitMap = common.Image;

    // Conduct the Gamma correction and put the new values into the bitmap image.
    for (let i = common.width*common.height*4-1; i > 2; i -= 4){

      GammaMod = Math.pow(fractalFlame.entries[i]/max,1/Gamma);
      bitMap.data[i]   = 255*fractalFlame.entries[i]/max;
      bitMap.data[i-3] = fractalFlame.entries[i-3]*GammaMod;
      bitMap.data[i-2] = fractalFlame.entries[i-2]*GammaMod;
      bitMap.data[i-1] = fractalFlame.entries[i-1]*GammaMod;
    }

    common.ctx.putImageData(bitMap, 0, 0); // print the image on the canvas.
    
    // This little part "turns on" the "Create" button if the image was already printed and a user is not in the info menu.
    if(common.disabled && common.allowed){
      document.getElementById('ButtonCreate').disabled='';
      common.disabled = false;
      document.getElementById('ButtonCreate').style.cursor = 'pointer';
    }
    
    common.iterationNumber -= 1000000; // Every time decrease the counter of iterations.

    if(common.iterationNumber > 0){
      let curWorker = event.data[2];
      common.curWorker.postMessage([common.width, common.height, common.Parameters, document.getElementById('selectFunc').value, common.execNumber, curWorker]);
    }
  }
}

// If a user has chosen new parameters, then the Matrix must be emptied and new parameters chosen.
function modifyWorker(){
  common.Matrix = new Matrix(common.width, common.height);
  common.Parameters = assignCoeffs(common.numberOfCoeffs);
  common.execNumber ++;
  common.iterationNumber = 50000000; // Actually it would be better to create some look up table for this, since some functions and combinations are much easier than the others.
  for(let i = common.numberOfCores; i > 0; i--){
    let curWorker = 'worker' + String(i);
    common.curWorker.postMessage([common.width, common.height, common.Parameters, document.getElementById('selectFunc').value, common.execNumber, curWorker]);
    common.curWorker.onmessage = workIt;
  }
}
modifyWorker();
