function getDivSizes(){
	params.windowWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
	params.windowHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
	params.videoFac = params.windowWidth/params.setVideoWidth;

	var frac = 0.75; //fraction of screen width allowed for video/images

	//size this based on the screen
	//video/image div
	//params.videoHeight = parseFloat(window.innerHeight);
	params.videoWidth = params.windowWidth/params.videoFac;
	params.videoHeight = params.videoWidth*params.aspect;
	if (params.videoHeight*params.videoFac < params.windowHeight){
		params.videoHeight = params.windowHeight;
		params.videoWidth = params.videoHeight/params.aspect;
	}
	params.videoOuterWidth = params.windowWidth;//params.videoWidth;
	params.videoOuterHeight = params.windowHeight;//params.videoHeight;

	//image div
	params.imageWidth = params.windowWidth;
	params.imageHeight = params.windowHeight;
	//info div
	//infoWidth = parseFloat(window.innerWidth) - params.videoWidth - 3.*m
	params.infoWidth = params.windowWidth*(1-frac);
	params.menuWidth = params.infoWidth;
	params.infoHeight = params.windowHeight;
	var useInfoWidth = params.infoWidth;

	if (params.showingMenu){
		params.menuLeft = params.windowWidth - params.menuWidth;
		//useInfoWidth -= params.menuWidth
	} else {
		params.menuLeft = params.windowWidth;
	}

	return useInfoWidth;

}

function resizeDivs(){

	if (!params.resizing){
		// set all the sizes
		console.log('resizing...')
		params.yLine = 0;
		var useInfoWidth = getDivSizes();

		if (params.readyVideo){
			resetCanvas();
		}

		var iLeft = params.windowWidth - useInfoWidth - 5;
		if (params.showingMenu){
			iLeft -= params.menuWidth;
		}
		d3.select('#imageDiv')
			.style('left',(-1.*params.imgI*params.windowWidth)+'px')
			.style('width',params.imageWidth + 'px')
			.style('height',params.imageHeight + 'px')	

		d3.select('#infoDiv')
			.style('left',iLeft +'px')
			.style('height',params.infoHeight + 'px')
			.style('width',useInfoWidth + 'px')


		d3.select('#controlDiv')
			.style('left',(iLeft - params.controlWidth) +'px')
			.style('width',params.controlWidth + 'px')
			.style('height',params.windowHeight + 'px')

		d3.select('#controlDivText')
			.style('left',params.controlWidth/2 - 5 + 'px')
			.style('top',params.windowHeight/2. -20 + 'px')	

		d3.select('#objectMenu')
			.style('left',params.menuLeft + 'px')
			.style('width',params.menuWidth - 4 + 'px')//to account for 2px border
			.style('height',params.windowHeight - 4 + 'px')//to account for 2px border

		d3.select('#objectMenu').selectAll('.buttonDiv')
			.style('width',params.menuWidth-40 + 'px')

		d3.select('#trainingDiv')
			.style('left',(params.windowWidth - 2.*useInfoWidth  - 5) +'px')
			.style('padding-left',(params.controlWidth+5)+'px')
			.style('width',2.*useInfoWidth + 'px')
			.style('height',params.infoHeight + 'px')
			.classed('hidden',!params.showingTraining)



		//reload the images
		if (params.imagesAvail.length > 0){
			loadAllImages(params.imagesAvail);
		}
	}
}




function gotoFullscreen(){
	fullscreen(true)
	params.resizing = true;
	if (params.showingMenu){ //something breaks when this is open... not sure why
		showHideMenu();
	}
	setTimeout(function(){//would prefer a callback from fullscreen...
		params.resizing = false;
		resizeDivs();		
	}, 500)

}