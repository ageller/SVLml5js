

function populateMenu(data){
	//https://www.w3schools.com/howto/howto_js_collapsible.asp
	var menu = d3.select('#objectMenu')
	for (var key in data) {
		var id = key.replace(/\s/g, '');
		menu.append('div')
			.attr('class','subTitle collapsible')
			.attr('id',id)
			.style('cursor','pointer')
			.text(key)
			.on('click', function(e){
				//show/hide objects
				var id = this.innerHTML.replace(/\s/g, '');
				var header = d3.select('#'+id);
				var content = d3.select('#'+id+'Content');
				var bool = header.classed("active");
				if (!bool){
					content.style('max-height',parseFloat(content.node().scrollHeight) + "px");
				} else {
					content.style('max-height', 0);
				}
				header.classed("active", !bool);
			})
		//for (var id in data[key]){
		//	var d = data[key][id]
		//	console.log(key, id, d)
		var keyDiv = menu.append('div')
			.attr('id',id+'Content')
			.attr('class','content');

		data[key].forEach(function(d){
			params.numObjects += 1;
			keyDiv.append('div')
				.attr('class','caption')
				.text(Object.keys(d)[0])
				.style('cursor','pointer')
				.on('click', function(e){
					if (d3.select('#trainingDiv').classed('hidden')){
						params.doClassify = false;
						updateInfo(d);
						showHideMenu();
					} else {
						updateTraining(d);
					}
				})
		})
	}

	//blank entry
	menu.append('div')
		.attr('class','caption')
		.text('Blank')
		.style('cursor','pointer')
		.style('margin-top','50px')
		.on('click', function(e){
			d = {'Blank':{}}
			updateTraining(d);
		})

	//training button
	menu.append('div')
		.attr('class','buttonDiv')
		.attr('id','trainingButton')
		.style('width',params.menuWidth-40 + 'px')
		.style('margin','10px')
		.style('padding','2px')
		.style('height','20px')
		.style('font-size','16px')
		.text('Update Model Training')
		.on('click', function(e){
			//params.loadingImagesToModel = true;
			//addImageToModel();
			resetInfo();
			params.showingTraining = !params.showingTraining;
			params.doClassify = !params.showingTraining;
			elem = d3.select('#trainingButton')
			elem.classed('buttonDivActive', params.showingTraining);
			d3.select('#infoDiv').classed('hidden',params.showingTraining)
			d3.select('#trainingDiv').classed('hidden',!params.showingTraining)
			if (params.showingTraining){
				params.label = 'training'
				elem.text('Updating Model Training')
			} else {
				elem.text('Update Model Training')
			} 
		})

	// //background capture
	// menu.append('div')
	// 	.attr('class','buttonDiv')
	// 	.attr('id','backgroundCaptureButton')
	// 	.style('width',params.menuWidth-40 + 'px')
	// 	.style('margin','10px')
	// 	.style('padding','2px')
	// 	.style('height','20px')
	// 	.style('font-size','16px')
	// 	.text('Capture Background Image')
	// 	.on('click', function(e){

	// 		elem = d3.select('#backgroundCaptureButton');
	// 		params.captureBackground = !params.captureBackground;
	// 		d3.select('canvas').classed('redBordered',params.captureBackground)
	// 		elem.classed('buttonDivActive', params.captureBackground)
	// 		if (params.captureBackground){
	// 			var w = params.video.width;
	// 			var h = params.video.height;
	// 			params.backgroundImageMean = new Array(w*h);
	// 			params.backgroundImageVariance = new Array(w*h);
	// 			params.useBackground = true
	// 			params.iBackground = 0;
	// 			elem.text('Capturing Background Image')
	// 		} else {
	// 			elem.text('Capture Background Image')
	// 		}
	// 	})

	//turn on/off background subtraction
	menu.append('div')
		.attr('class','buttonDiv')
		.attr('id','backgroundOnOffButton')
		.style('width',params.menuWidth-40 + 'px')
		.style('margin','10px')
		.style('padding','2px')
		.style('height','20px')
		.style('font-size','16px')
		.text('Turn Off Background Subtraction')
		.on('click', function(e){
			params.useBackground = !params.useBackground;
			var elem = d3.select('#backgroundOnOffButton');
			elem.classed('buttonDivActive', !params.useBackground)
			if (params.useBackground){
				elem.text('Turn Off Background Subtraction')
			} else {
				elem.text('Background Subtraction Off')
			}

		})

	//background capture
	menu.append('div')
		.attr('class','buttonDiv')
		.attr('id','backgroundShowButton')
		.style('width',params.menuWidth-40 + 'px')
		.style('margin','10px')
		.style('padding','2px')
		.style('height','20px')
		.style('font-size','16px')
		.text('Show Background Subtracted Video')
		.on('click', function(e){
			params.showBackgroundSubtractedVideo = !params.showBackgroundSubtractedVideo;
			var elem = d3.select('#backgroundShowButton');
			elem.classed('buttonDivActive', params.showBackgroundSubtractedVideo)
			if (params.showBackgroundSubtractedVideo){
				elem.text('Showing Background Subtracted Video')
			} else {
				elem.text('Show Background Subtracted Video')
			}

		})

	//fullscreen
	menu.append('div')
		.attr('class','buttonDiv')
		.attr('id','fullscreenButton')
		.style('width',params.menuWidth-40 + 'px')
		.style('margin','10px')
		.style('padding','2px')
		.style('height','20px')
		.style('font-size','16px')
		.text('Fullscreen')
		.on('click', function(e){
			gotoFullscreen();
		})


	//try to click automatically (since need user gesture) -- neither of these work
    var button = document.getElementById('fullscreenButton');
    //button.click();
    //simulateClick(button);

}


function showHideMenu(){
	params.showingMenu = !params.showingMenu;

	d3.select('#showMenuButton').node().classList.toggle("change");
	var useInfoWidth = params.infoWidth
	var pLeft = parseFloat(d3.select('#controlDiv').style('width')) + 5;
	if (params.showingMenu){
		params.menuLeft = params.windowWidth - params.menuWidth;
		useInfoWidth -= params.menuWidth
		//pLeft = 0;
		d3.select('#infoDiv').transition(params.tTrans)
			.style('width',useInfoWidth + 'px')
			.on('end',function(){
				if (useInfoWidth <= 0){
					d3.select('#infoDiv')
						.classed('notScrollable', params.showingMenu)
						.style('padding-left',pLeft +'px')
				}
			})
	} else {
		params.menuLeft = params.windowWidth;
		d3.select('#infoDiv')
			.classed('notScrollable', params.showingMenu)
			.style('padding-left',pLeft +'px')
			.transition(params.tTrans).style('width',useInfoWidth + 'px')

	}

	d3.select('#objectMenu').transition(params.tTrans).style('left',params.menuLeft + 'px');
	

}

//https://gomakethings.com/how-to-simulate-a-click-event-with-javascript/
/**
 * Simulate a click event.
 * @public
 * @param {Element} elem  the element to simulate a click on
 */
var simulateClick = function (elem) {
	// Create our event (with options)
	var evt = new MouseEvent('click', {
		bubbles: true,
		cancelable: true,
		view: window
	});
	// If cancelled, don't dispatch our event
	var canceled = !elem.dispatchEvent(evt);
};