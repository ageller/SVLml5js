function resizeDivs(){
	// set all the sizes
	console.log('resizing...')
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
		.style('width',params.videoOuterWidth*params.shrink)
		.style('height', params.videoOuterHeight*params.shrink)

	d3.select('#videoDiv')
		.style('width',params.videoWidth*params.shrink + 'px')
		.style('height',params.videoHeight*params.shrink + 'px')	
		.style('transform','scale('+params.videoFac+')')

	if (params.readyVideo){
		resetCanvas();
	}

	d3.select('#imageDiv')
		.style('left',(-1.*params.imgI*params.windowWidth)+'px')
		.style('width',params.imageWidth + 'px')
		.style('height',params.imageHeight + 'px')	

	d3.select('#infoDiv')
		.style('left',(params.windowWidth - useInfoWidth - params.controlWidth - 5) +'px')
		.style('height',params.infoHeight + 'px')

	d3.select('#controlDiv')
		.style('height',params.infoHeight + 'px')

	d3.select('#objectMenu')
		.style('left',params.menuLeft + 'px')
		.style('width',params.menuWidth - 4 + 'px')//to account for 2px border
		.style('height',params.windowHeight - 4 + 'px')//to account for 2px border

	d3.select('#trainingDiv')
		.style('left',(params.windowWidth - 2.*useInfoWidth - params.controlWidth  - 5) +'px')
		.style('padding-left',(params.controlWidth+5)+'px')
		.style('width',2.*useInfoWidth + 'px')
		.style('height',params.infoHeight + 'px')
		.classed('hidden',!params.showingTraining)


	//reload the images
	if (params.imagesAvail.length > 0){
		loadAllImages(params.imagesAvail);
	}

}




function gotoFullscreen(){
	fullscreen(true)
	setTimeout(function(){
		resizeCanvas()
		resizeDivs();		
	}, 1000)

	//setTimeout(resizeCanvas(), 1000) //would prefer a callback from fullscreen...
}