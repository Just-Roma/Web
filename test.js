"use strict";

const coresSelect = document.getElementById("cores");
for(let i = 1; i <= navigator.hardwareConcurrency; i++){
  let opt = document.createElement("option");
  opt.value = i.toString();
  opt.innerHTML = i.toString();
  coresSelect.add(opt);
}

let ctx = document.getElementById('Canvas').getContext('2d');
Canvas.width  = Math.round(window.innerWidth*0.85);
Canvas.height = window.innerHeight;
let width = Canvas.width;
let height = Canvas.height;

class Matrix2{

		constructor(width, height) {
			this.width = width;
			this.height = height;
			this.entries = Array.from({length: width*height*4}, () => 0); // Each entry stores RGB and a counter.
		}
		
		get(x, y) {return this.entries[y*this.width*4 + x*4+3];}	

		set1(x, y, value){
			this.entries[y*this.width*4 + x*4] = value[0];
			this.entries[y*this.width*4 + x*4+1] = value[1];
			this.entries[y*this.width*4 + x*4+2] = value[2];
		}
		set2(x, y, value){
			this.entries[y*this.width*4 + x*4]   = Math.round((this.entries[y*this.width*4 + x*4] + value[0])/2);
			this.entries[y*this.width*4 + x*4+1] = Math.round((this.entries[y*this.width*4 + x*4+1] + value[1])/2);
			this.entries[y*this.width*4 + x*4+2] = Math.round((this.entries[y*this.width*4 + x*4+2] + value[2])/2);
		}
		inc(x, y) {this.entries[y*this.width*4 + x*4+3]++;}
	}

/* Each function has a set of parameters - coefficients of an affine combination.

	(Xn+1) = (a b) * (Xn) + (c)
	(Yn+1)   (d e)   (Yn)   (f)
	
	These parameters will be randomly chosen each time a new Fi is produced.
	
	According to the original paper the affine transformation is better be contractive, which means that the following conditions must be checked:
	
	1) a^2 + d^2 < 1
	2) b^2 + e^2 < 1
	3) a^2 + b^2 + d^2 + e^2 < 1 + (ae - bd)^2
	
	They will be chosen from the set [-1;1), 1 is not included because of the way Math.random() works.
	Most of these combinations will probably result in boring/ugly results.
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
		//rgb = [[255,0,255],[255,255,0],[0,255,255],[255,0,0],[0,0,255],[0,255,0]][Math.round(Math.random()*5)];
		rgb = [150 + Math.round(Math.random()*105), 150 + Math.round(Math.random()*105), 150 + Math.round(Math.random()*105)];
		out2.push(rgb);
		size--;
	}
	
	// assign some RGB
	//.rgb = [55 + Math.round(Math.random()*145), 55 + Math.round(Math.random()*145), 55 + Math.round(Math.random()*145)];
	
	//.rgb = [[255,0,255],[255,255,0],[0,255,255]][Math.round(Math.random()*2)];
	//.rgb = [255,0,255];
	//console.log(out2)
	return [out1,out2];
}



//console.log(performance.now()-qq);

let coeffs=assignCoeffs(7);//4-10
const blob = new Blob([document.querySelector('#worker').textContent], { type: "text/javascript" })

let qq=performance.now();
Promise.all(Array.from({length: Math.max(navigator.hardwareConcurrency-1,1)}, () => new Promise((resolve, reject) => {
    const worker = new Worker(URL.createObjectURL(blob));
    worker.postMessage([width, height,coeffs]);
    worker.addEventListener('message', event => resolve(event.data));
    worker.addEventListener('error', reject);
  })))
  .then(results => {
console.log(performance.now()-qq);
		let O_o = ctx.createImageData(width, height);
		let fractalFlame = new Matrix2(width, height);
		let max = 0;
		let gamma = 3;
		for(let fractal=results.length-1;fractal>=0;fractal--){
			for (let i=results[fractal].entries.length-1;i>2;i-=4){
				if(results[fractal].entries[i])results[fractal].entries[i] = Math.log10(results[fractal].entries[i]);
				max = Math.max(results[fractal].entries[i],max);
			}
		}
		let leng=results.length-1;
		for (let i=O_o.data.length-1;i>2;i-=4){
			for(let fractal=leng;fractal>=0;fractal--){
				fractalFlame.entries[i] += (255*results[fractal].entries[i]/max);
				fractalFlame.entries[i-3] += (results[fractal].entries[i-3]*Math.pow(results[fractal].entries[i]/max,1/gamma));
				fractalFlame.entries[i-2] += (results[fractal].entries[i-2]*Math.pow(results[fractal].entries[i]/max,1/gamma));
				fractalFlame.entries[i-1] += (results[fractal].entries[i-1]*Math.pow(results[fractal].entries[i]/max,1/gamma));
			}
			O_o.data[i] = fractalFlame.entries[i]/(leng+1);
			O_o.data[i-3]= fractalFlame.entries[i-3]/(leng+1);
			O_o.data[i-2] = fractalFlame.entries[i-2]/(leng+1);
			O_o.data[i-1] = fractalFlame.entries[i-1]/(leng+1);
		}
		ctx.putImageData(O_o, 0, 0);

});
