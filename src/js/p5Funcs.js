
///////////////////////////
// p5 required functions
///////////////////////////

// set all the sizes
function preload(){

	//test
	// fname = 'Alpha Centauri_0_0.png'
	// var path = 'model/trainingImages/' + fname
	// img = loadImage(path, function(){
	// 	params.trainingImgs.push(img)
	// 	img.loadPixels();
	// 	console.log(path, img, img.pixels.length, pixels.length)
	// });

	params.yLine = 0;

	//a few extra settings that just happen once
	d3.select('#videoWrapper')
		.style('position','absolute')
		.style('top',0)
		.style('left',0)
		.style('padding',0)
		.style('margin',0)
		.style('background-color','black')
		.style('z-index',3);

	d3.select('#videoDiv')
		.style('position','absolute')
		.style('top',0)
		.style('left',0)
		.style('padding',0)
		.style('margin',0)
		.style('z-index',4)

	d3.select('#imageDiv')
		.style('position','absolute')
		.style('top',0)
		.style('padding',0)
		.style('margin',0)
		.style('background-color','black')
		.style('z-index',2)
		.on("touchstart", slideImageDivStarted)
		.on("mousedown", slideImageDivStarted)

	d3.select('#infoDiv')
		.style('position','absolute')
		.style('top',0)
		.style('margin',0)
		.style('padding',0)
		.style('padding-left','5px')
		.style('z-index',3)
	if (params.imagesAvail.length == 0){
		d3.select('#infoDiv').classed('hidden',true);
	}

	d3.select('#controlDiv')
		.style('position','absolute')
		.style('top',0)
		.style('margin',0)
		.style('padding',0)
		.style('z-index',3)
		.style('background-color','white')
		.style('opacity',0.8)
		.style('cursor','ew-resize')
		.classed('hidden',true)
		.on("mousedown", resizeInfoDivStarted)
		.on("touchstart", resizeInfoDivStarted)

	d3.select('#controlDivText')
		.style('position','absolute')
		//.style('transform','rotate(90deg)')

	d3.select('#objectMenu')
		.style('position','absolute')
		.style('top',0)
		.style('margin',0)
		.style('padding',0)

	d3.select('#trainingDiv')
		.style('position','absolute')
		.style('top',0)
		.style('margin',0)
		.style('padding',0)
		.style('z-index',3)
		.classed('hidden',!params.showingTraining)


	//set the rest of the div sizes
	resizeDivs();

	//reload the images
	if (params.imagesAvail.length > 0){
		loadAllImages(params.imagesAvail);
	}

	populateTrainingDiv()
}

function setup(){

	resetCanvas();
	background(0);

	initializeML();
}



function draw() {
	background(0);

	//allow some time to get the background settled
	if (params.iBackground < params.nBackground){
		if (params.readyVideo && params.readyOpenCV){
			params.iBackground += 1;
			console.log('countdown...',params.nBackground - params.iBackground);
		}
	} else {
		params.initialCapture = false;
	}


	//for background subtraction
	if (params.readyVideo && !params.loadingImagesToModel){
		params.video.loadPixels();
		if (params.useBackground && params.readyOpenCV){
			params.openCVcap.read(params.openCVframe);
        	params.openCVfgbg.apply(params.openCVframe, params.openCVfgmask, params.openCVlearningRate);
        	applyOpenCVmaskToP5(params.openCVfgmask);
			params.video.updatePixels(); //p5js library
		}

		// Flip the canvas so that we get a mirror image
		var fac = 1.0
		translate(fac*params.videoWidth, 0);
		scale(-fac, fac);
		//scale(-1.0,1.0);    // flip x-axis backwards

		if (params.showBackgroundSubtractedVideo || params.showingTraining){
			image(params.video, 0, 0, params.videoWidth, params.videoHeight);// 
		} else {
			image(params.videoShow, 0, 0, params.videoWidth, params.videoHeight);// 
		}

	}

	if (params.readyModel && params.readyVideo && !params.loadingImagesToModel){
		//for training
		// if (params.loadingImagesToModel && params.loadNextImageForModel){
		// 	params.video.pause();
		// 	loadImageToModel();
		// }


		//do the classification?
		if (params.doClassify && !params.initialCapture){ 
			//classify();
		} 

		// add the label (not sure how to locate this, given the current fullscreen setup)
		// fill('gray');
		// textSize(20);
		// stroke('gray');
		// strokeWeight(1);
		// // Flip back for the text (but this doesn't work when not fullscreened because of clipping)
		// scale(-1.0, 1.0);	
		// translate(-params.videoWidth, 0);
		// text(params.label, 10, params.videoHeight - params.windowHeight/params.videoFac - 10); //something is not right here

		if (params.doClassify && params.drawLine){
			drawLines();
		}
	}
}