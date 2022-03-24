"use strict";

/* References to the html elements */
let InfoPageNode = document.getElementById('infoPage');
let DependentParametersNode = document.getElementById('dependentParameters');
let BlobDivNode = document.getElementById('Blob_Div');
let PDJDivNode = document.getElementById('PDJ_Div');
let JuliaNDivNode = document.getElementById('JuliaN_Div');
let ButtonCreateNode = document.getElementById('ButtonCreate');
let ButtonInfoNode = document.getElementById('ButtonInfo');
let BlobNode = document.getElementById('BlobPar');
let PDJNode1 = document.getElementById('PDJ_Select_p1');
let PDJNode2 = document.getElementById('PDJ_Select_p2');
let PDJNode3 = document.getElementById('PDJ_Select_p3');
let PDJNode4 = document.getElementById('PDJ_Select_p4');
let JuliaNPower = document.getElementById('JuliaNPower');
let JuliaNDistance = document.getElementById('JuliaNDistance');


window.addEventListener('resize', 
() => {
  CanvasNode.width  = Math.round(window.innerWidth*0.85);
  CanvasNode.height = window.innerHeight;
  common.width  = CanvasNode.width;
  common.height = CanvasNode.height;
  common.Image = common.ctx.createImageData(common.width, common.height);
  modifyWorker();
});

// Modify the web worker on click.
ButtonCreateNode.addEventListener('click', modifyWorker);

// This changes the menu, which holds the number of affine transformtions('Magic number')
FuncNode.addEventListener('change',
  () => {
    
    let options = AffineNode.options;
    for(let i = options.length - 1; i >= 0; i--){
      options.remove(i);
    }

    let Func = FuncNode.value;
    let curOption;
    for(let i = lookupCoeffs[Func][0]; i <= lookupCoeffs[Func][1]; i++){
      curOption = document.createElement('option');
      curOption.value = String(i);
      curOption.text = String(i);
      AffineNode.appendChild(curOption);
    }
    AffineNode.value = lookupCoeffs[Func][1];
    common.numberOfCoeffs = lookupCoeffs[Func][1];
    
    // This part adds/hides the block with dependent parameters
    switch (FuncNode.value){

      case 'Blob':
        common.refToExtraBlock.display = 'none';
        common.refToExtraBlock = BlobDivNode.style;
        common.refToExtraBlock.display = 'block';
        DependentParametersNode.style.display = 'block';
        let randomDefault = 2+Math.round(10*Math.random());
        BlobNode.value = randomDefault;
        common.extraPars.p3 = randomDefault;
        break;

      case 'PDJ':
        common.refToExtraBlock.display = 'none';
        common.refToExtraBlock = PDJDivNode.style;
        common.refToExtraBlock.display = 'block';
        DependentParametersNode.style.display = 'block';
        common.extraPars.p1 = Number(PDJNode1.value);
        common.extraPars.p2 = Number(PDJNode2.value);
        common.extraPars.p3 = Number(PDJNode3.value);
        common.extraPars.p4 = Number(PDJNode4.value);
        break;

      case 'JuliaN':
        common.refToExtraBlock.display = 'none';
        common.refToExtraBlock = JuliaNDivNode.style;
        common.refToExtraBlock.display = 'block';
        DependentParametersNode.style.display = 'block';
        common.extraPars.p1 = Number(JuliaNPower.value);
        common.extraPars.p2 = 2;
        JuliaNDistance.value = 2;
        break;

      default:
        common.refToExtraBlock.display = 'none';
        common.refToExtraBlock = {'display': null};
        DependentParametersNode.style.display = 'none';
    }
});


// Set the parameter 'numberOfCoeffs' from "common" to the chosen value.
AffineNode.addEventListener('change',
  () => {common.numberOfCoeffs = Number(AffineNode.value);
});


BlobNode.addEventListener('change',
  () => {
    let UserInput = Math.abs(Number(BlobNode.value));
    if(UserInput && UserInput <= 1000){
      BlobNode.value = Math.ceil(UserInput);
      common.extraPars.p3 = Math.ceil(UserInput);
    }else{
      alert("Please enter a number from 1 to 1000. It will be rounded up.");
      BlobNode.value = common.extraPars.p3;
    }
});


PDJNode1.addEventListener('change',
  () => {
    common.extraPars.p1 = Number(PDJNode1.value);
});

PDJNode2.addEventListener('change',
  () => {
    common.extraPars.p2 = Number(PDJNode2.value);
});

PDJNode3.addEventListener('change',
  () => {
    common.extraPars.p3 = Number(PDJNode3.value);
});

PDJNode4.addEventListener('change',
  () => {
    common.extraPars.p4 = Number(PDJNode4.value);
});

JuliaNPower.addEventListener('change',
  () => {
    common.extraPars.p2 = Number(JuliaNPower.value);
});

JuliaNDistance.addEventListener('change',
  () => {
    let UserInput = Math.abs(Number(JuliaNDistance.value));
    if(UserInput && UserInput <= 5 && UserInput >= 1){
      JuliaNDistance.value = UserInput;
      common.extraPars.p1 = UserInput;
    }else{
      alert("Please enter a number from 1 to 5.");
      JuliaNDistance.value = common.extraPars.p1;
    }
});


/* There is a chance that the first frame will need several seconds to be printed. 
   In that time a user can click on the button and hence add extra job for the script. 
   So the button is shortly disabled.
*/
ButtonCreateNode.addEventListener('click', 
  () => {
    ButtonCreateNode.disabled = 'true';
    common.disabled = true;
    ButtonCreateNode.style.cursor = 'default';
  }
);

ButtonInfoNode.addEventListener('click', 
  () => {
  if(common.allowed){
    InfoPageNode.style.display = 'inline-block';
    CanvasNode.style.display = 'none';
    ButtonCreateNode.disabled = 'true';
    ButtonCreateNode.style.cursor = 'default';
    ButtonInfoNode.innerText = 'Back';
    common.allowed = false;
  }
  else{
    InfoPageNode.style.display = 'none';
    CanvasNode.style.display = 'inline-block';
    ButtonCreateNode.disabled = '';
    ButtonCreateNode.style.cursor = 'pointer';
    ButtonInfoNode.innerText = 'Info';
    common.allowed = true;
  }
  }
);
