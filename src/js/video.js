function videoReady() {
	console.log('Video ready');
	params.readyVideo = true;
}


function resetCanvas(){

	var w = params.videoWidth;
	var wOuter = params.videoOuterWidth;
	var hClip = params.windowHeight;
	var wOffset = 0;


	var vW = d3.select('#videoWrapper');
	var vD = d3.select('#videoDiv');
	//clip and center so that I can switch between full screen and not
	w += wOffset;
	wOuter += wOffset;
	var h = w*params.aspect;
	var hOuter = hOuter*params.aspect;

	vW.style('clip', 'rect(0px,'+w*params.videoFac*params.shrink+'px,'+hClip*params.shrink+'px,'+wOffset+'px)');
	vW.style('transform', 'translate(-'+wOffset+'px,0px)');

	//canvas
	var cvs = d3.select('canvas');
	if (params.canvas == null){
		pixelDensity(1); //need this or else the pixel density is 2 by default (!), and confuses things (and slows down)
		params.video = createCapture(VIDEO);
		params.video.size(w,h)
		params.video.hide();
		// params.videoShow = createCapture(videoConstraints, function(stream) {
		// 	console.log(stream);
		//  });
		params.videoShow = createCapture(VIDEO);
		params.videoShow.size(w,h)
		params.videoShow.hide();		
		params.canvas = createCanvas(w, h).parent(select('#videoDiv'));
		cvs = d3.select('canvas');
		cvs.classed('bordered', false);
	} 

	if (params.canvas != null && params.readyVideo) { //this is needed for background subtraction, but breaks transitions!
		resizeCanvas(w, h);
	}

	var left = 0;
	if (w < params.windowWidth) {
		left = (params.windowWidth - w)/2.;
	}
	cvs.classed('bordered', false)
		.attr('width',w)
		.attr('height',h)
	cvs.transition(params.tTrans)
		.style('width',w*params.shrink+'px')
		.style('height',h*params.shrink+'px');	


	//videoDiv
	vW.transition(params.tTrans)
		.style('width',wOuter*params.shrink+'px')
		.style('height',hOuter*params.shrink+'px')
	vD.transition(params.tTrans)
		.style('width',w*params.shrink+'px')
		.style('height',h*params.shrink+'px')
		.style('margin-left', left*params.shrink+'px')


	if (params.shrink == 1.){
		vW.transition(params.tTrans)
			.style('top','0px')
			.style('left','0px');
	} else {
		vW.transition(params.tTrans)
			.style('top','10px')
			.style('left','10px');

	}
	// console.log("aspect", parseFloat(cvs.style('height'))/parseFloat(cvs.style('width')), params.aspect, cvs.style('height'), window.innerHeight)

}

//set the background image
//https://en.wikipedia.org/wiki/Foreground_detection#Running_Gaussian_average
function setBackgroundImage(fac = 1.){
	console.log('setting background image', params.video.width, params.video.height, pixels.length)

	var w = fac*params.video.width;
	var h = fac*params.video.height;
	//https://www.youtube.com/watch?v=nMUMZ5YRxHI
	for (x=0; x<w; x++) {
		for (y=0; y<h; y++) {
			var index = (x + y*w)*4; 

			for (k=0; k<4; k++) {
				if (params.iBackground == 0){
					params.backgroundImageMean[index + k] = pixels[index + k];
					params.backgroundImageVariance[index + k] = 1.;
				} else {
					var d = Math.abs(pixels[index + k] - params.backgroundImageMean[index + k])
					params.backgroundImageMean[index + k] = params.rhoBackground*pixels[index + k] + (1. - params.rhoBackground)*params.backgroundImageMean[index + k]
					params.backgroundImageVariance[index + k] = d*d*params.rhoBackground + (1. - params.rhoBackground)*params.backgroundImageVariance[index + k]
				}
			}
			
		}
	}
	params.iBackground += 1;

}
//divide the image by the mean value
function divideMean(fac = 1.){

	var w = fac*params.video.width;
	var h = fac*params.video.height;

	var meanR = 0;
	var meanG = 0;
	var meanB = 0;
	for (x=0; x<w; x++) {
		for (y=0; y<h; y++) {
			var index = (x + y*w)*4; 
			meanR += pixels[index + 0];
			meanG += pixels[index + 1];
			meanB += pixels[index + 2];
		}
	}
	meanR /= (w*h);
	meanG /= (w*h);
	meanB /= (w*h);
	var norm = (meanR + meanG + meanB)/3.
	//console.log('meanR,G,B', meanR, meanG, meanB, norm)
	for (x=0; x<w; x++) {
		for (y=0; y<h; y++) {
			var index = (x + y*w)*4; 

			pixels[index + 0] = pixels[index + 0]/meanR*norm;
			pixels[index + 1] = pixels[index + 1]/meanG*norm;
			pixels[index + 2] = pixels[index + 2]/meanB*norm;
		}
	}
}
//subtract the background image
function subtractBackgroundImage(fac = 1.){

	var w = fac*params.video.width;
	var h = fac*params.video.height;
	//console.log("background", w, h, pixels.length, (w + w*h)*4);
	for (x=0; x<w; x++) {
		for (y=0; y<h; y++) {
			var index = (x + y*w)*4; 
			var chi2 = 0;
			var variance = 0;
			var mean = 0;
			for (k=0; k<3; k++) { //don't subtract the opacity! 
				var d = Math.abs(pixels[index + k] - params.backgroundImageMean[index + k])
				chi2 += d*d/params.backgroundImageVariance[index + k];
				mean += d;
				variance += d*d;
			}
			mean /= 3.;
			variance = variance/3. - mean*mean;
			//if (chi2 > 0){console.log(x,y,chi2)}
			if (chi2 <= params.backgroundChi2Threshold || variance < params.backgroundVarianceThreshold){ //low variance is maybe just different exposure time?
				for (k=0; k<4; k++) { 
					pixels[index + k] = 0;
				}
			} 
		}
	}

}

function drawLines(){

	//line as if scanning (for fun)
	strokeWeight(1.);
	for (var i=0; i<N; i++){
		stroke(0, 255, 0, 255*(1. - i/(params.lineSize-1)));
		var y = params.yLine - Math.sign(params.lineSpeed)*i;
		line(0,  y, params.videoWidth, y);
	}
	if (params.yLine > params.videoHeight || params.yLine < 0) {
		params.lineSpeed *= -1;
	}
	params.yLine += params.lineSpeed;
}