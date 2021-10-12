/* This is the main script, which starts the creation of fractal flames.
   It uses the web worker, defined in FractalFlame.html for the calculations.
   The web worker gets parameters from this script.
*/

"use strict";

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


function workIt(event){

  let max = 0;
  let fractalFlame = event.data;

  for (let i = common.width*common.height*4-1; i > 2; i -= 4){

    // Scale the colors by counter and take logarithm of it.
    if(fractalFlame.entries[i]){
      fractalFlame.entries[i-3] /= fractalFlame.entries[i];
      fractalFlame.entries[i-2] /= fractalFlame.entries[i];
      fractalFlame.entries[i-1] /= fractalFlame.entries[i];
      fractalFlame.entries[i] = Math.log10(fractalFlame.entries[i]);
    }
    max = Math.max(fractalFlame.entries[i], max);
  }

  let GammaMod; // Gamma correction.
  let bitMap = common.Image;
  let Gamma = common.Gamma;
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
}

// This function closes the old worker and creates a new one.
// It also sends a message to the Worker, which includes the sizes of the matrix, affine coeefs and mode value.
function modifyWorker(){
  common.worker.terminate();
  common.worker = new Worker(URL.createObjectURL(common.blob));
  common.worker.postMessage([common.width, common.height, assignCoeffs(common.numberOfCoeffs), document.getElementById('selectFunc').value]);
  common.worker.onmessage = workIt;
}

// Add the gamma parameters to the "Gamma" menu. The step is 0.1.
(function(){
  let gammaMenu = document.getElementById('selectGamma');
  for(let i = 1; i <= 6; i += 0.1){
    let curOption = document.createElement('option');
    curOption.value = String(i.toFixed(1));
    curOption.text = String(i.toFixed(1));
    gammaMenu.appendChild(curOption);
  }
  gammaMenu.value = 2.2;
})();


/*************************************************************************/
/* Here comes the definition of different parameters and event listeners */

let common = {'Canvas' : document.getElementById('Canvas'),
              'ctx' : document.getElementById('Canvas').getContext('2d')};

common.Canvas.width  = Math.round(window.innerWidth*0.85);
common.Canvas.height = window.innerHeight;

Object.assign(common, {'width' : common.Canvas.width, 'height' : common.Canvas.height});

Object.assign(common,  
              {'Image' : common.ctx.createImageData(common.width, common.height),
              'Gamma' : 2.2,
              'blob'  : new Blob([document.querySelector('#worker').textContent], { type: "text/javascript" }),
              'worker': null,
              'numberOfCoeffs' : Number(document.getElementById('selectAffine').value),
              'disabled': false,
              'allowed': true});
              
common.worker = new Worker(URL.createObjectURL(common.blob));
common.worker.postMessage([common.width, common.height, assignCoeffs(common.numberOfCoeffs), document.getElementById('selectFunc').value]);
common.worker.onmessage = workIt;
              
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
