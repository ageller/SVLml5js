function videoReady() {
	console.log('Video ready');
	params.readyVideo = true;
}

//https://docs.opencv.org/3.4.3/dd/d00/tutorial_js_video_display.html
//https://docs.opencv.org/3.4.0/de/df4/tutorial_js_bg_subtraction.html
function initializeOpenCV(w,h, interval = 10){
	console.log('checking for OpenCV...' )
	//takes a while to load the opencv.js library...
	var check = setInterval(function(){
		if (typeof cv.BackgroundSubtractorMOG2 != "undefined") {
			console.log('OpenCV is loaded.')
			params.readyOpenCV = true;
			clearInterval(check);
			d3.select('#videoDiv').append('video')
				.attr('width', w)
				.attr('height', h)
				.attr('id', 'videoInput')
				.classed('hidden', true)
			params.openCVvideo = document.getElementById("videoInput"); // video is the id of video tag
			params.openCVcap = new cv.VideoCapture(params.openCVvideo);	
			navigator.mediaDevices.getUserMedia({ video: true, audio: false })
				.then(function(stream) {
					params.openCVvideo.srcObject = stream;
					params.openCVvideo.play();
				})
				.catch(function(err) {
					console.log("An error occurred! " + err);
				});
			params.openCVfgbg = new cv.BackgroundSubtractorMOG2(params.openCVhistory, params.openCVvarThreshold, params.openCVdetectShadows);
			params.openCVframe = new cv.Mat(h, w, cv.CV_8UC4);
			params.openCVfgmask = new cv.Mat(h, w, cv.CV_8UC1);
		}
	}, interval);

}

//https://docs.opencv.org/3.4.3/de/d06/tutorial_js_basic_ops.html
function applyOpenCVmaskToP5(mask){

	//https://www.youtube.com/watch?v=nMUMZ5YRxHI
	for (x=0; x<params.videoWidth; x++) {
		for (y=0; y<params.videoHeight; y++) {
			var index = (x + y*params.videoWidth)*4; //p5js pixel location

			var openCVmask = mask.ucharPtr(y, x);
			//console.log(x,y,openCVsrc, openCVmask)
			for (k=0; k<4; k++) {
				pixels[index + k] *= openCVmask[0]/255.; 
			}
		}
	}
}

function resetCanvas(){


	var vW = d3.select('#videoWrapper');
	var vD = d3.select('#videoDiv');
	//clip and center so that I can switch between full screen and not

	vW.style('width',params.videoOuterWidth*params.shrink)
		.style('height', params.videoOuterHeight*params.shrink)

	vD.style('width',params.videoWidth*params.shrink + 'px')
		.style('height',params.videoHeight*params.shrink + 'px')	
		.style('transform','scale('+params.videoFac+')')

	vW.style('clip', 'rect(0px,'+params.videoWidth*params.videoFac*params.shrink+'px,'+params.windowHeight*params.shrink+'px, 0px)');

	//video element for OpenCV
	if (params.openCVvideo == null){
		initializeOpenCV(params.videoWidth, params.videoHeight);
	}

	//canvas
	cvs = d3.select('canvas');
	if (params.canvas == null){
		pixelDensity(1); //need this or else the pixel density is 2 by default (!), and confuses things (and slows down)
		params.video = createCapture(VIDEO);
		params.video.size(params.videoWidth, params.videoHeight)
		params.video.hide();
		// params.videoShow = createCapture(videoConstraints, function(stream) {
		// 	console.log(stream);
		//  });
		params.videoShow = createCapture(VIDEO);
		params.videoShow.size(params.videoWidth, params.videoHeight)
		params.videoShow.hide();	



		params.canvas = createCanvas(params.videoWidth, params.videoHeight).parent(select('#videoDiv'));
		cvs = d3.select('canvas');
		cvs.classed('bordered', false);
	} 

	if (params.canvas != null && params.readyVideo) { //this is needed for background subtraction, but breaks transitions!
		resizeCanvas(params.videoWidth, params.videoHeight);
	}

	var left = 0;
	if (params.videoWidth < params.windowWidth) {
		left = (params.windowWidth - params.videoWidth)/2.; //don't understand this /2??
	}
	var top = 0;
	if (params.videoHeight < params.windowHeight) {
		top = (params.windowHeight - params.videoHeight)/2.; //don't understand this /2??
	}	
	cvs.classed('bordered', false)
		.attr('width',params.videoWidth)
		.attr('height',params.videoHeight)
	cvs.transition(params.tTrans)
		.style('width',params.videoWidth*params.shrink+'px')
		.style('height',params.videoHeight*params.shrink+'px');	


	//videoDiv
	vW.transition(params.tTrans)
		.style('width',params.videoOuterWidth*params.shrink+'px')
		.style('height',params.videoOuterHeight*params.shrink+'px')
	vD.transition(params.tTrans)
		.style('width',params.videoWidth*params.shrink+'px')
		.style('height',params.videoHeight*params.shrink+'px')
		.style('margin-left', left*params.shrink+'px')
		.style('margin-top', top*params.shrink+'px')


	if (params.shrink == 1.){
		vW.transition(params.tTrans)
			.style('top','0px')
			.style('left','0px');
	} else {
		vW.transition(params.tTrans)
			.style('top','10px')
			.style('left','10px');

	}
	// console.log("aspect", parseFloat(params.canvas.style('height'))/parseFloat(params.canvas.style('width')), params.aspect, params.canvas.style('height'), window.innerHeight)

}


//old background subtraction functions... now using openCV

// //set the background image
// //https://en.wikipedia.org/wiki/Foreground_detection#Running_Gaussian_average
// function setBackgroundImage(fac = 1.){
// 	console.log('setting background image', params.video.width, params.video.height, pixels.length)

// 	var w = fac*params.video.width;
// 	var h = fac*params.video.height;
// 	//https://www.youtube.com/watch?v=nMUMZ5YRxHI
// 	for (x=0; x<w; x++) {
// 		for (y=0; y<h; y++) {
// 			var index = (x + y*w)*4; 

// 			for (k=0; k<4; k++) {
// 				if (params.iBackground == 0){
// 					params.backgroundImageMean[index + k] = pixels[index + k];
// 					params.backgroundImageVariance[index + k] = 1.;
// 				} else {
// 					var d = Math.abs(pixels[index + k] - params.backgroundImageMean[index + k])
// 					params.backgroundImageMean[index + k] = params.rhoBackground*pixels[index + k] + (1. - params.rhoBackground)*params.backgroundImageMean[index + k]
// 					params.backgroundImageVariance[index + k] = d*d*params.rhoBackground + (1. - params.rhoBackground)*params.backgroundImageVariance[index + k]
// 				}
// 			}
			
// 		}
// 	}
// 	params.iBackground += 1;

// }


// //divide the image by the mean value
// function divideMean(fac = 1.){

// 	var w = fac*params.video.width;
// 	var h = fac*params.video.height;

// 	var meanR = 0;
// 	var meanG = 0;
// 	var meanB = 0;
// 	for (x=0; x<w; x++) {
// 		for (y=0; y<h; y++) {
// 			var index = (x + y*w)*4; 
// 			meanR += pixels[index + 0];
// 			meanG += pixels[index + 1];
// 			meanB += pixels[index + 2];
// 		}
// 	}
// 	meanR /= (w*h);
// 	meanG /= (w*h);
// 	meanB /= (w*h);
// 	var norm = (meanR + meanG + meanB)/3.
// 	//console.log('meanR,G,B', meanR, meanG, meanB, norm)
// 	for (x=0; x<w; x++) {
// 		for (y=0; y<h; y++) {
// 			var index = (x + y*w)*4; 

// 			pixels[index + 0] = pixels[index + 0]/meanR*norm;
// 			pixels[index + 1] = pixels[index + 1]/meanG*norm;
// 			pixels[index + 2] = pixels[index + 2]/meanB*norm;
// 		}
// 	}
// }
// //subtract the background image
// function subtractBackgroundImage(fac = 1.){

// 	var w = fac*params.video.width;
// 	var h = fac*params.video.height;
// 	//console.log("background", w, h, pixels.length, (w + w*h)*4);
// 	for (x=0; x<w; x++) {
// 		for (y=0; y<h; y++) {
// 			var index = (x + y*w)*4; 
// 			var chi2 = 0;
// 			var variance = 0;
// 			var mean = 0;
// 			for (k=0; k<3; k++) { //don't subtract the opacity! 
// 				var d = Math.abs(pixels[index + k] - params.backgroundImageMean[index + k])
// 				chi2 += d*d/params.backgroundImageVariance[index + k];
// 				mean += d;
// 				variance += d*d;
// 			}
// 			mean /= 3.;
// 			variance = variance/3. - mean*mean;
// 			//if (chi2 > 0){console.log(x,y,chi2)}
// 			if (chi2 <= params.backgroundChi2Threshold || variance < params.backgroundVarianceThreshold){ //low variance is maybe just different exposure time?
// 				for (k=0; k<4; k++) { 
// 					pixels[index + k] = 0;
// 				}
// 			} 
// 		}
// 	}

// }

// function drawLines(){

// 	//line as if scanning (for fun)
// 	strokeWeight(1.);
// 	for (var i=0; i<N; i++){
// 		stroke(0, 255, 0, 255*(1. - i/(params.lineSize-1)));
// 		var y = params.yLine - Math.sign(params.lineSpeed)*i;
// 		line(0,  y, params.videoWidth, y);
// 	}
// 	if (params.yLine > params.videoHeight || params.yLine < 0) {
// 		params.lineSpeed *= -1;
// 	}
// 	params.yLine += params.lineSpeed;
// }