"use strict";

// If a device is in a vertical position then tell a user to rotate it.
if(common.Canvas.width < common.Canvas.height) document.getElementById('rotationNote').style.display = 'block';

window.addEventListener('resize', 
() => {
  common.Canvas.width  = Math.round(window.innerWidth*0.85);
  common.Canvas.height = window.innerHeight;
  if(common.Canvas.width < common.Canvas.height) document.getElementById('rotationNote').style.display = 'block';
  else document.getElementById('rotationNote').style.display = 'none';

  common.width  = common.Canvas.width;
  common.height = common.Canvas.height;
  common.Image = common.ctx.createImageData(common.width, common.height);
  modifyWorker();
});

// This changes the menu, which holds the number of affine transformtions('Magic number')
document.getElementById('selectFunc').addEventListener('change',
  () => {
    
    let options = document.getElementById('selectAffine').options;
    for(let i = options.length - 1; i >= 0; i--){
      options.remove(i);
    }

    options = document.getElementById('selectAffine');
    let Func = document.getElementById('selectFunc').value;
    let curOption;
    for(let i = lookupCoeffs[Func][0]; i <= lookupCoeffs[Func][1]; i++){
      curOption = document.createElement('option');
      curOption.value = String(i);
      curOption.text = String(i);
      options.appendChild(curOption);
    }
    document.getElementById('selectAffine').value = lookupCoeffs[Func][1];
    common.numberOfCoeffs = lookupCoeffs[Func][1];
});

// Set the parameter 'numberOfCoeffs' from "common" to the chosen value.
document.getElementById('selectAffine').addEventListener('change',
  () => {common.numberOfCoeffs = Number(document.getElementById('selectAffine').value);
});

// Modify the web worker on click.
document.getElementById('ButtonCreate').addEventListener('click', modifyWorker);

/* There is a chance that the first frame will need several seconds to be printed. 
   In that time a user can click on the button and hence add extra job for the script. 
   So the button is shortly disabled.
*/
document.getElementById('ButtonCreate').addEventListener('click', 
  () => {
    document.getElementById('ButtonCreate').disabled = 'true';
    common.disabled = true;
    document.getElementById('ButtonCreate').style.cursor = 'default';
  }
);

document.getElementById('ButtonInfo').addEventListener('click', 
  () => {
  if(common.allowed){
    document.getElementById('infoPage').style.display = 'inline-block';
    document.getElementById('Canvas').style.display = 'none';
    document.getElementById('ButtonCreate').disabled = 'true';
    document.getElementById('ButtonCreate').style.cursor = 'default';
    document.getElementById('ButtonInfo').innerText = 'Back';
    common.allowed = false;
  }
  else{
    document.getElementById('infoPage').style.display = 'none';
    document.getElementById('Canvas').style.display = 'inline-block';
    document.getElementById('ButtonCreate').disabled = '';
    document.getElementById('ButtonCreate').style.cursor = 'pointer';
    document.getElementById('ButtonInfo').innerText = 'Info';
    common.allowed = true;
  }
  }
);
