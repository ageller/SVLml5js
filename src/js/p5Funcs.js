
///////////////////////////
// p5 required functions
///////////////////////////

// set all the sizes
function preload(){
	params.yLine = 0;
	
	params.windowWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
	params.windowHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
	params.videoFac = params.windowWidth/params.setVideoWidth;

	var frac = 0.75; //fraction of screen width allowed for video/images

	//size this based on the screen
	//video/image div
	//params.videoHeight = parseFloat(window.innerHeight);
	params.videoWidth = params.windowWidth/params.videoFac;
	params.videoHeight = params.videoWidth*params.aspect;
	params.videoOuterWidth = params.windowWidth;//params.videoWidth;
	params.videoOuterHeight = params.windowHeight;//params.videoHeight;

	//image div
	params.imageWidth = params.windowWidth;
	params.imageHeight = params.windowHeight;
	//info div
	//infoWidth = parseFloat(window.innerWidth) - params.videoWidth - 3.*m
	params.infoWidth = params.windowWidth*(1-frac) - params.controlWidth;
	params.menuWidth = params.infoWidth;
	params.infoHeight = params.windowHeight;
	var useInfoWidth = params.infoWidth;

	if (params.showingMenu){
		params.menuLeft = params.windowWidth - params.menuWidth;
		//useInfoWidth -= params.menuWidth
	} else {
		params.menuLeft = params.windowWidth;
	}

	d3.select('#videoWrapper')
		.style('position','absolute')
		.style('top',0)
		.style('left',0)
		.style('padding',0)
		.style('margin',0)
		.style('width',params.videoOuterWidth*params.shrink)
		.style('height', params.videoOuterHeight*params.shrink)
		.style('background-color','black')
		.style('z-index',3);

	d3.select('#videoDiv')
		.style('position','absolute')
		.style('top',0)
		.style('left',0)
		.style('padding',0)
		.style('margin',0)
		.style('width',params.videoWidth*params.shrink + 'px')
		.style('height',params.videoHeight*params.shrink + 'px')	
		.style('z-index',4)
		.style('transform','scale('+params.videoFac+')')

	if (params.readyVideo){
		resetCanvas();
	}

	d3.select('#imageDiv')
		.style('position','absolute')
		.style('top',0)
		.style('left',(-1.*params.imgI*params.windowWidth)+'px')
		.style('padding',0)
		.style('margin',0)
		.style('width',params.imageWidth + 'px')
		.style('height',params.imageHeight + 'px')	
		.style('background-color','black')
		.style('z-index',2)
		//.style('clip', 'rect(0px,'+params.windowWidth+'px,'+params.windowHeight+'px, 0px)')
		.on("touchstart", slideImageDivStarted)
		.on("mousedown", slideImageDivStarted)

	d3.select('#infoDiv')
		.style('position','absolute')
		.style('top',0)
		.style('left',(params.windowWidth - useInfoWidth - params.controlWidth  - 5) +'px')
		.style('margin',0)
		.style('padding',0)
		.style('padding-left',(params.controlWidth+5)+'px')
		.style('width',useInfoWidth + 'px')
		.style('height',params.infoHeight + 'px')
		.style('z-index',3)
	if (params.imagesAvail.length == 0){
		d3.select('#infoDiv').classed('hidden',true);
	}

	d3.select('#controlDiv')
		.style('position','absolute')
		.style('top',0)
		.style('left',0)
		.style('margin',0)
		.style('padding',0)
		.style('width',params.controlWidth + 'px')
		.style('height',params.infoHeight + 'px')
		.style('z-index',3)
		.style('background-color','white')
		.style('opacity',0.8)
		.style('cursor','ew-resize')
		.on("mousedown", resizeInfoDivStarted)

	d3.select('#objectMenu')
		.style('position','absolute')
		.style('top',0)
		.style('left',params.menuLeft + 'px')
		.style('margin',0)
		.style('padding',0)
		.style('width',params.menuWidth - 4 + 'px')//to account for 2px border
		.style('height',params.windowHeight - 4 + 'px')//to account for 2px border

	d3.select('#trainingDiv')
		.style('position','absolute')
		.style('top',0)
		.style('left',params.imageWidth +'px')
		.style('margin',0)
		.style('padding',0)
		.style('width',useInfoWidth + 'px')
		.style('height',params.infoHeight + 'px')
		.classed('hidden',!params.showingTraining)


	//reload the images
	if (params.imagesAvail.length > 0){
		loadAllImages(params.imagesAvail);
	}
	//resize image if necessary
	// var w = parseFloat(d3.select('#imageDiv').style('width'));
	// var h = parseFloat(d3.select('#imageDiv').style('height'));
	// var imgs = d3.select('#imageDiv').selectAll('img')
	// imgs._groups[0].forEach(function(n){
	// 	var x = d3.select(n)
	// 	console.log("testing", x) g
	// 	if (x.node() != null){
	// 		var h2 = parseFloat(x.style('height'))
	// 		//try to center the image when clipping
	// 		var offset = max((h2 - h)/2.,0);
	// 		var ctop = h+offset;
	// 		x.attr('width',w + 'px')
	// 			.style('clip', 'rect('+offset+'px,'+w+'px,'+ctop+'px,0px)')
	// 			.style('top',-offset+'px')

	// 	}
	// });



	populateTrainingDiv()
}

function setup(){

	resetCanvas();
	background(0);

	var w = params.video.width;
	var h = params.video.height;
	params.backgroundImageMean = new Array(w*h);
	params.backgroundImageVariance = new Array(w*h);
	d3.select('canvas').classed('redBordered',true)

	initializeML();
	loadSavedModel();
}



function draw() {
	background(0);

	if (params.readyModel && params.readyVideo && params.doClassify && !params.captureBackground){//&& !params.initialCapture){//} 
		classify();
	} 


	//for background subtraction
	if (params.readyVideo){
		params.video.loadPixels();
		divideMean(); // my function to divide out the mean value, to try to remove fluctuations in exposure time
		if (params.captureBackground){ //if we don't constantly do this, then any fluctuations in the exposure time of the webcam (which I can't control) changes the subtraction, but if we do constantly do this, we can't hold an object in the same place!
			setBackgroundImage(); //create the background image
		}
		if (params.useBackground){
			if (params.backgroundImageMean != null) {
				subtractBackgroundImage(); //my function below to set the pixels 
			}
		}
		if (params.initialCapture){
			params.label = 'capturing background'
			console.log(params.iBackground, params.nBackground);
		}
		if (params.captureBackground && params.initialCapture && params.iBackground > params.nBackground){ //initial background capture
			params.captureBackground = false;
			params.initialCapture = false;
			d3.select('canvas').classed('redBordered',false)

		}

		params.video.updatePixels(); //p5js library
	}

	// Flip the canvas so that we get a mirror image
	//and seems like I need to scale this by 0.5 to see the full image?? something is wrong here.
	var fac = 1.0
	translate(fac*params.videoWidth, 0);
	scale(-fac, fac);
	//scale(-1.0,1.0);    // flip x-axis backwards
	if (params.showBackgroundSubtractedVideo){
		image(params.video, 0, 0, params.videoWidth, params.videoHeight);// 
	} else {
		image(params.videoShow, 0, 0, params.videoWidth, params.videoHeight);// 
	}

	fill('gray');
	textSize(24);
	stroke('gray');
	strokeWeight(1);
	var h = Math.min(params.windowHeight, params.videoHeight)
	// Flip back for the text (but this doesn't work when not fullscreened because of clipping)
	scale(-1.0, 1.0);	
	translate(-params.videoWidth, 0);
	text(params.label, 10, h-10);


	if (videoReady && params.doClassify && !params.captureBackground && params.drawLine){
		drawLines();
	}

}