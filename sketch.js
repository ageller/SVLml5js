let params;
function defineParams(){
	params = new function() {
    	this.objData = null; //holds the input data for objects that will be shown in the menu 

    	//related ml5 classifier
    	this.classifier = null; //ml5 classifies object
    	this.featureExtractor = null; //ml5 featureExtractor object
		this.readyModel = false; //true when classifier is ready
		this.doClassify = true; //when true, we run through the classifier (false when showing images)
		this.loss; //holds the "loss" value while training
		this.numObjects = 2; //initial number of objects for model (will be reset to the length of objData)
		this.trainingDelay = 100; //ms delay between capturing images from video for training
		this.showingTraining = false;
		this.resultsReady = true;
		this.confidenceLim = 0.99; //limit before object is considered identified.

		//related to the p5js video
    	this.video = null; //holds the p5js video object that we use to classify (can use background sub)
    	this.videoShow = null; //holds the p5js video object that we show the user
    	this.label = 'loading model'; //a text label on top of the video
		this.canvas = null; //dom element to hold the video
		this.readyVideo = false; //true when video is ready to show


		/////////////////////////////
		///////change this for different webcams
		this.aspect = 9./12. //this is the  aspect (y/x) of my webcam 
		this.setVideoWidth = 400; //width of video in pixels (will be scaled to fill the browser window width)
		/////////////////////////////

		//size for the video div (defined by window size)
		this.videoWidth = null;
		this.videoHeight = null;
		this.videoOuterWidth = null;
		this.videoOuterHeight = null;
		this.videoFac = 1.;//factor to scale the video by, will be determined by maxVideoWidth/windowWidth
		this.shrink = 1.0; //fraction to shrink down the video when showing image (set to 0.2 below)

		// could use something like this for finer control over the video
		// this.videoConstraints = {
		// 	video: {
		// 		deviceId: "e2d1e7a1022f08a4ab3131ad8b24696ed535c298c08925c16f964da208f352a9",
		// 		// width: { min: 1280 },
		// 		// height: { min: 720 },
		// 		// mandatory: {
		// 		// 	deviceId: "e2d1e7a1022f08a4ab3131ad8b24696ed535c298c08925c16f964da208f352a9",
		// 		// 	// width: { min: 1280 },
		// 		// 	// height: { min: 720 }
		// 		// },
		// 		// optional: [{ maxFrameRate: 10 }]
		// 	},
		// 	audio: false
		// };

		//size for the image div (defined by window size)
		this.imageWidth = null;
		this.imageHeight = null;
		this.imgI = 0; //index of the image that is currently showing to user
		this.imagesAvail = []; //urls to available images for an active object
		this.captionsAvail = []; //captions for the available images
		this.allImageDivs = []; //the dom img elements holding the images

		//size for the info div (defined by window size)
		this.infoWidth = null;
		this.infoHeight = null;

		//size and location for the menu div (defined by window size)
		this.menuWidth;
		this.menuLeft;
		this.showingMenu = false;

		this.controlWidth = 15;// pixels width of the small controls div on the side of infoDiv

		//window size (will be rest if resized)
		this.windowWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
		this.windowHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

		//d3 transitions
		this.tTrans = d3.transition().duration(1000);

		//for background subtraction (also see commented out testing section at bottom)
		this.showBackgroundSubtractedVideo = false; //don't show the user the background subtracted video (unless they click the button)
		this.useBackground = true; //start with background subtraction
		this.captureBackground = true; //start with background subtraction
		this.initialCapture = true; //only true during the initial background capture
		this.nBackground = 100; //number of frames for the initial background capture
		this.iBackground = 0; //counter for the initial background capture frames
		this.backgroundImageMean = null; //will hold the image mean pixel array for background subtraction
		this.backgroundImageVariance = null; //will hold the image mean variance array for background subtraction
		//need to tune these...
		this.rhoBackground = 0.01; //for time average of mean and variance
		this.backgroundChi2Threshold = 0; //chi2 values below this are considered background (variance seems better?)
		this.backgroundVarianceThreshold = 25; //variance values below this are considered background


		//if we want to scanning draw the line on top of the video (might be fun... or distracting)
		this.drawLine = false; //set to true to draw the line
		this.yLine = 0; //will change to move the line up and down
		this.lineSize = 150; //thickness of the line, in pixels
		this.lineSpeed = 10; //number of pixels for line to jump each frame


		//for click/touch controls in the small controlsDiv of the size and opacity of the info (and menu) div
		this.infoDivControlsActive = false; //will be true when user clicks inside controlsDiv
		this.dragInfoSamples = []; //will hold the click/touch events inside controlsDiv

		//for click/touch control of images (changing image, and scrolling in y)
		this.slideImageDivActive = false;
		this.dragImageSamples = [];
		this.dragImageVx = 0.;
	};


}
defineParams();









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
			resetInfo(fullscreen = false);
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

	//background capture
	menu.append('div')
		.attr('class','buttonDiv')
		.attr('id','backgroundCaptureButton')
		.style('width',params.menuWidth-40 + 'px')
		.style('margin','10px')
		.style('padding','2px')
		.style('height','20px')
		.style('font-size','16px')
		.text('Capture Background Image')
		.on('click', function(e){
			elem = d3.select('#backgroundCaptureButton');
			params.captureBackground = !params.captureBackground;
			d3.select('canvas').classed('redBordered',params.captureBackground)
			elem.classed('buttonDivActive', params.captureBackground)
			if (params.captureBackground){
				var w = params.video.width;
				var h = params.video.height;
				params.backgroundImageMean = new Array(w*h);
				params.backgroundImageVariance = new Array(w*h);
				params.useBackground = true
				params.iBackground = 0;
				elem.text('Capturing Background Image')
			} else {
				elem.text('Capture Background Image')
			}
		})

	//background capture
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

	d3.select('#trainingDiv').transition(params.tTrans).style('width',useInfoWidth + 'px')
	d3.select('#trainingDiv').selectAll('.trainingText').transition(params.tTrans).style('width',useInfoWidth -10 + 'px')
	d3.select('#objectMenu').transition(params.tTrans).style('left',params.menuLeft + 'px');
	

}
//https://stackoverflow.com/questions/11068240/what-is-the-most-efficient-way-to-parse-a-css-color-in-javascript
function parseRGBA(input){
	m = input.match(/^rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+\.\d+)\s*\)/i);
	if (m) {
		return [m[1],m[2],m[3],m[4]];
	}
}
function resizeInfoDivStarted(){
	params.infoDivControlsActive = true;
}
function resizeInfoDivMoved(){
	if (params.infoDivControlsActive){
		if (d3.event != null){
			params.dragInfoSamples.push(d3.event)
		}
		if (params.dragInfoSamples.length >2){
			params.dragInfoSamples.shift();
			//for MouseEvent
			var x1 = params.dragInfoSamples[0].screenX;
			var x2 = params.dragInfoSamples[1].screenX;
			var y1 = params.dragInfoSamples[0].screenY;
			var y2 = params.dragInfoSamples[1].screenY;
			if (params.dragInfoSamples[0].touches){ //for TouchEvent
				x1 = params.dragInfoSamples[0].touches[0].screenX;
				x2 = params.dragInfoSamples[1].touches[0].screenX;
				y1 = params.dragInfoSamples[0].touches[0].screenY;
				y2 = params.dragInfoSamples[1].touches[0].screenY;
			}
			var diffX = x2-x1;
			var width = parseFloat(d3.select('#infoDiv').style('width'));
			var left = parseFloat(d3.select('#infoDiv').style('left'));

			var dirY = Math.sign(y1-y2);
			var m = parseRGBA(d3.select('#infoDiv').style('background-color'));
			var alpha = parseFloat(m[3])+dirY*0.02;
			alpha = Math.min(Math.max(alpha,0.01),0.99);

			var useLeft = Math.min(left+diffX, params.menuLeft-params.controlWidth-5);

			var useInfoWidth = (width-diffX);
			params.infoWidth = useInfoWidth;
			if (params.showingMenu){
				params.infoWidth = useInfoWidth + params.menuWidth;
			}
			d3.select('#infoDiv')
				.style('background-color','rgba('+m[0]+','+m[1]+','+m[2]+','+alpha+')')
				.style('width', useInfoWidth+'px')
				.style('left', useLeft+'px')
			d3.select('#objectMenu')
				.style('background-color','rgba('+m[0]+','+m[1]+','+m[2]+','+alpha+')')

			if (useInfoWidth > 2.*params.controlWidth){
				d3.select('#infoDiv').classed('notScrollable', false);
			} else {
				d3.select('#infoDiv').classed('notScrollable', true);
			}
		}
	}
}
function resizeInfoDivEnded(){
	params.infoDivControlsActive = false;
	params.dragInfoSamples = [];
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

function resetInfo(){
	console.log("resetInfo")
	params.shrink = 1.0;
	resetCanvas();

	var iDiv = d3.select('#infoDiv')
	iDiv.select('#objectName').html('')
	iDiv.select('#objectDistance').html('')
	iDiv.select('#objectSize').html('')
	iDiv.select('#objectNotes').html('')
	iDiv.select('#wikipedia').selectAll('span').remove()
	iDiv.select('#wikipedia').selectAll('a').remove()

	d3.select('#imageDiv').selectAll('img').html('') //is this not working?
	d3.select('#imageCaption').html('')

	d3.select('#infoDiv').classed('hidden',true)
	params.doClassify = true;
}


function updateInfo(obj){
	//shrink the video
	params.imgI = 0;
	params.shrink = 0.2
	resetCanvas();

	var iDiv = d3.select('#infoDiv')
	iDiv.classed('hidden',false)

	id = Object.keys(obj)[0]
	if (obj.hasOwnProperty(id)){
		if (obj[id] != null){
			iDiv.select('#objectName').html(id)
		}
	}
	if (obj[id].hasOwnProperty('Distance')){
		if (obj[id]['Distance'] != null){
			iDiv.select('#objectDistance')
				.html('<span class="highlighted"> Distance: </span>'+obj[id]['Distance'])
		}
	}
	if (obj[id].hasOwnProperty('Size')){
		if (obj[id]['Size'] != null){
			iDiv.select('#objectSize')
				.html('<span class="highlighted"> Size: </span>'+obj[id]['Size'])
		}
	}
	if (obj[id].hasOwnProperty('Notes')){
		if (obj[id]['Notes'] != null){
			iDiv.select('#objectNotes')
				.html('<span class="highlighted"> Notes: </span>'+obj[id]['Notes'])
		}
	}
	if (obj[id].hasOwnProperty('WWTurl')){
		if (obj[id]['WWTurl'] != null){
			//flyWWT(obj[id]['WWTurl'])
			//launchVLC3D('foo')
		}
	}
	d3.select('#imageDiv').selectAll('img').remove()
	d3.select('#imageDiv').selectAll('div').classed("hidden",true)
	d3.select('#imageCaption').classed("hidden",true);
	if (obj[id].hasOwnProperty('images')){
		if (obj[id]['images'] != null){
			params.imagesAvail = obj[id]['images'];
			params.captionsAvail = obj[id]['captions'];
			console.log("N images for",id,params.imagesAvail.length)
			loadAllImages(params.imagesAvail);
			showCaption(params.captionsAvail[0]);
		}
	}
	d3.select('#wikipedia').selectAll('span').remove()
	d3.select('#wikipedia').selectAll('a').remove()
	// if (obj[id].hasOwnProperty('wikipedia')){
	// 	if (obj[id]['wikipedia'] != null){
	// 		//in future we can show all images
	// 		var wiki = d3.select('#wikipedia')
	// 		wiki.append('span')
	// 			.attr('class','highlighted')
	// 			.text('Wikipedia: ');
	// 		wiki.append('a')
	// 			.attr('href',obj[id]['wikipedia'])
	// 			.attr('target','_blank')
	// 			.text(obj[id]['wikipedia']);
	// 	}
	// }
}
function flyWWT(url){
	//try with Ajax
	var http = new XMLHttpRequest();
	http.open("GET", url);
	http.send();
	http.onreadystatechange = function(){
		if (this.readyState == 4 && this.status == 200){
			console.log('finished flying to WWT location')
		}
	}

	// var popup = window.open(url,"WWT", "width=200,height=100");
	// setTimeout(function() {popup.close();}, 1000); //I want to make this fire onload, but it won't let me
	// //popup.blur(); //doesn't work
	// //window.focus();
}
function launchVLC3D(movie){
	//testing for now

	//try with Ajax

	//clear the playlist
	var url1 = "http://SVL3DTV.adlerplanetarium.org:8080/requests/status.xml?command=pl_empty";
	
	//add a movie to playlist
	var url2 = "http://SVL3DTV.adlerplanetarium.org:8080/requests/status.xml?command=in_enqueue&input=/Users/svladler/AstroConversationMedia/Movies3D_TopBottom/Stars/Sun/EUVI_171_Angstroms-TB2.mov";
	
	//play the playlist
	var url3 = "http://SVL3DTV.adlerplanetarium.org:8080/requests/status.xml?command=pl_play";
	
	//go to fullscreen
	var url4 = "http://SVL3DTV.adlerplanetarium.org:8080/requests/status.xml?command=fullscreen"
	
	var http1 = new XMLHttpRequest();
	http1.open("GET", url1);
	http1.send();
	http1.onreadystatechange = function(){
		if (this.readyState == 4 && this.status == 200){
			var http2 = new XMLHttpRequest();
			http2.open("GET", url2);
			http2.send();
			http2.onreadystatechange = function(){
				if (this.readyState == 4 && this.status == 200){
					var http3 = new XMLHttpRequest();
					http3.open("GET", url3);
					http3.send();
					http3.onreadystatechange = function(){
						if (this.readyState == 4 && this.status == 200){
							var http4 = new XMLHttpRequest();
							http4.open("GET", url4);
							http4.send();
							http4.onreadystatechange = function(){
								if (this.readyState == 4 && this.status == 200){
									console.log('playing VLC 3D movie')
								}
							}
						}
					}
				}
			}
		}
	}

	// var popup = window.open("http://SVL3DTV.adlerplanetarium.org:8080/requests/status.xml?command=pl_empty","VLC3D", "width=200,height=100");
	// setTimeout(function() {
	// 	popup.location.replace("http://SVL3DTV.adlerplanetarium.org:8080/requests/status.xml?command=in_enqueue&input=/Users/svladler/AstroConversationMedia/Movies3D_TopBottom/Stars/Sun/EUVI_171_Angstroms-TB2.mov")},
	// 	200);
	// setTimeout(function() {
	// 	popup.location.replace("http://SVL3DTV.adlerplanetarium.org:8080/requests/status.xml?command=pl_play")},
	// 	400);
	// setTimeout(function() {
	// 	popup.location.replace("http://SVL3DTV.adlerplanetarium.org:8080/requests/status.xml?command=fullscreen")},
	// 	600);
	// //setTimeout(function() {popup.close();}, 1000); //I want to make this fire onload, but it won't let me
	// console.log("showing video")

}
function showCaption(cap){
	var x = d3.select('#imageCaption')
	x.classed("hidden",false);
	if (cap != null){
		x.html('<span class="highlighted"> Image Caption: </span>'+cap)
		x.selectAll('a').on('click', function(){return false}); //don't allow links
	}
}

function loadAllImages(images){
	params.allImageDivs = new Array(images.length);

	d3.select('#imageDiv').selectAll('img').remove()

	var w = parseFloat(d3.select('#imageDiv').style('width'));
	var h = parseFloat(d3.select('#imageDiv').style('height'));


	d3.select('#imageDiv').selectAll('img').data(images).enter()
		.append('img')
			.attr('src',function(d){return d}) 
			.attr('width',w + 'px')
			.style('position','absolute')
			.style('left', function(d,i){
				return (i*params.windowWidth)+'px';
			})
			.style('z-index',0)
			.on('load', function(foo, index){
				var i = d3.select(this);
				var h2 = parseFloat(i.style('height'))
				//console.log('images', foo, index)
				params.allImageDivs[index] = i;
				i.attr('height', h2+'px')
				//try to center the image when clipping
				var offset = max((h2 - h)/2.,0);
				//var ctop = h+offset;
				//i.style('clip', 'rect('+offset+'px,'+w+'px,'+ctop+'px,0px)')
				i.style('top',-offset+'px')
				if (h > h2){
					i.style('margin-top',(h-h2)/2. + 'px')
				}

			})

}

function initializeML(numClasses=null){
	// Extract the already learned features from MobileNet (eventually we want to only use our own training set)
	if (params.featureExtractor == null){
		params.featureExtractor = ml5.featureExtractor('MobileNet', modelReady);
	} else {
		numClasses += params.featureExtractor.numClasses;
	}
	if (numClasses != null){
		params.featureExtractor.numClasses = numClasses;
	}
	// Initialize the Image Classifier method with MobileNet and the video as the second argument
	params.classifier = params.featureExtractor.classification(params.video, videoReady);
	params.classifier.numClasses = numClasses;
	//params.classifier = params.featureExtractor.regression(params.video, videoReady);
	//params.classifier = ml5.imageClassifier('MobileNet', params.video, videoReady);  

}

function modelReady(){
	console.log('Base Model (MobileNet) Loaded!');
	params.label = '';
	params.readyModel = true;
	resetTrainingText("Model Loaded")

}


function videoReady() {
	console.log('Video ready');
	params.readyVideo = true;
}

function resetTrainingText(status="--"){
	d3.select('#trainingNumber').text("--");
	if (params.classifier != null){
		if (params.classifier.hasOwnProperty('mapStringToIndex')){
			d3.select('#trainingNumber').text(params.classifier.mapStringToIndex.length).classed('highlighted', true);
		} 
	}
	d3.select('#trainingObject').text("[select from menu on right]");
	d3.select('#trainingStatus').text(status);
}
function loadSavedModel(){
	resetTrainingText("Loading Saved Model...");
	params.classifier.load('./model/model.json', function() {
		console.log('Custom Model Loaded!');
		console.log(params.classifier)
		params.featureExtractor.numClasses = params.numObjects;
		console.log("Number of classes", params.featureExtractor.numClasses);
		resetTrainingText("Model Loaded");

		

	});

}
// Get a prediction for the current video frame
function classify() {
	params.classifier.classify(function(err, results){
		if (params.resultsReady){
			gotResults(err, results)
		}
	}); 
	// params.classifier.predict(gotResults)
}

function findObject(name){
	//identify the object based on the name
	var foundObject = null;

	for (var key in params.objData) {
		params.objData[key].forEach(function(d,i){
			if (Object.keys(d)[0] == name){
				console.log(name, Object.keys(d)[0], params.objData[key][i], d)
				foundObject = d
			}
		})
	}

	return foundObject;

}

// Show the results
function gotResults(err, results) {



	params.resultsReady = false;
	foundObject = null;
	//need something in here to check if the result is finalized
	//then I will update the infoDiv

	// Display any error
	if (err) {
		console.error(err);
		params.resultsReady = true;
	}
	if (results && results[0]) {
		//console.log("err, results[0]", err, results[0])
		params.label = results[0].label;
		confidence = results[0].confidence;
		if (confidence > params.confidenceLim){
			if (params.label == "Blank"){
				params.doClassify = true;
				params.resultsReady = true;
			} else {
				console.log("have result", params.label)
				console.log(results)
				foundObject = findObject(params.label);
			}
		} else {
			params.resultsReady = true;
		}
	}

	if (foundObject != null){
		params.resultsReady = true;
		params.doClassify = false;
		updateInfo(foundObject);	
	}
}

///////////////////////////
// for training
///////////////////////////
function populateTrainingDiv(){

	var useInfoWidth = params.infoWidth
	if (params.showingMenu){
		useInfoWidth -= params.menuWidth
	} 

	d = d3.select('#trainingDiv');
	d.selectAll('div').remove();

	d.append('div')
		.attr('class','buttonDiv training')
		.text('Load New Empty Model')
		.on('click', function(e){
			params.featureExtractor = null;
			params.classifier = null;
			params.doClassify = false;
			resetTrainingText("Loading Empty Model ...");
			initializeML(numClasses = params.numObjects);
		})

	d.append('div')
		.attr('class','buttonDiv training')
		.text('Reload Saved Model')
		.on('click', function(e){
			loadSavedModel();
		})

	d.append('div')
		.attr('class','training trainingText')
		.style('margin-top','30px')
		.style('width',useInfoWidth - 10 + 'px')
		.text("Status : ")
		.append('span')
			.attr('id','trainingStatus')
			.classed('highlighted', false)
			.text('--')

	d.append('div')
		.attr('class','training trainingText')
		.style('width',useInfoWidth - 10 + 'px')
		.text("Number of objects in training set : ")
		.append('span')
			.attr('id','trainingNumber')
			.classed('highlighted', false)
			.text('--')


	d.append('div')
		.attr('class','training trainingText')
		.style('width',useInfoWidth - 10 + 'px')
		.text("Training model on : ")
		.append('span')
			.attr('id','trainingObject')
			.classed('highlighted', false)
			.text('[select from menu on right]')

	d.append('div')
		.attr('id','addObject')
		.attr('class','buttonDiv training')
		.text('Record')

	d.append('div')
		.attr('class','buttonDiv training')
		.style('margin-top','30px')
		.text('Train Model')
		.on('click', function(e){
			params.classifier.train(whileTraining);
		})

	d.append('div')
		.attr('class','buttonDiv training')
		.text('Save Model')
		.on('click', function(e){
			params.classifier.save();
		})

	d.append('div')
		.attr('class','buttonDiv training')
		.style('margin-top','30px')
		.text('Done')
		.on('click', function(e){
			params.doClassify = true;
			d3.select('#infoDiv').classed('hidden',false)
			d3.select('#trainingDiv').classed('hidden',true)
			d3.select('#trainingButton').classed('buttonDivActive', false);

			params.showingTraining = false;
		})


}
function updateTraining(obj){
	id = Object.keys(obj)[0]
	d3.select('#trainingObject').text(id).classed('highlighted', true);
	d3.select('#trainingNumber').text(params.classifier.mapStringToIndex.length).classed('highlighted', true);

	var recording = false;
	var record;
	d3.select('#addObject')
		.on('click', function(e){
			recording = !recording
			var inum = 0;
			if (recording){
				record = setInterval(function(){
					d3.select('#addObject').text("Recording")
					d3.select('#addObject').classed('buttonDivActive', true);
					console.log(id)
					params.classifier.addImage(id);
					//var fname = id.replace(/\s/g,'') + '_'+inum+'_';
					var fname = id + '_'+inum+'_';
					saveFrames(fname, 'png', 1, 1);
					inum += 1;
					if (!recording){
						d3.select('#trainingNumber').text(params.classifier.mapStringToIndex.length);
						clearInterval(record);
					}
				}, params.trainingDelay);
			} else {
				d3.select('#addObject').text("Record")
				d3.select('#addObject').classed('buttonDivActive', false);
				d3.select('#trainingNumber').text(params.classifier.mapStringToIndex.length).classed('highlighted', true);
				clearInterval(record);
			}
		})
}

function whileTraining(lossValue) {
	d3.select('#trainingStatus').classed('highlighted',true);
	console.log("loss",lossValue)
	if (lossValue) {
		params.loss = lossValue;
		d3.select('#trainingStatus').text('Training... Loss = ' + params.loss);
	} else {
		d3.select('#trainingStatus').text('Done Training! Final Loss = ' + params.loss);
	}
}

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
		.style('left',params.imageWidth +'px')
		.style('width',useInfoWidth + 'px')
		.style('height',params.infoHeight + 'px')
		.classed('hidden',!params.showingTraining)


	//reload the images
	if (params.imagesAvail.length > 0){
		loadAllImages(params.imagesAvail);
	}

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

function gotoFullscreen(){
	fullscreen(true);
	resizeCanvas();
	//setTimeout(resizeCanvas(), 1000) //would prefer a callback from fullscreen...
}
///////////////////////////
// runs on load
///////////////////////////
// attach some functions to buttons
d3.select(window).on("resize", resizeDivs);

// d3.select(window).on("mousedown", function(){
// 	if (!fullscreen()){
// 		gotoFullscreen();
// 	}
// });
// d3.select(window).on("touchstart", function(){
// 	if (!fullscreen()){
// 		gotoFullscreen();
// 	}
// });

d3.select(window).on("mouseup", function(){
	resizeInfoDivEnded();
	slideImageDivEnded();
});
d3.select(window).on("touchend", function(){
	resizeInfoDivEnded();
	slideImageDivEnded();
});
d3.select(window).on("mousemove", function(){
	resizeInfoDivMoved();
	slideImageDivMoved();
})
d3.select(window).on("touchmove", function(){
	resizeInfoDivMoved();
	slideImageDivMoved();
})



d3.select('#resetButton').on('click',function(e){
	resetInfo();
})
d3.select('#showMenuButton').on('click',function(e){
	showHideMenu();
})
d3.select('#videoDiv').on('click',function(e){
	resetInfo();

})

//read in the data
d3.json('data/allObjects.json')
	.then(function(data) {
		params.objData = data;
		console.log(params.objData)
		populateMenu(data)
	});

// //undo fullscreen with escape
// document.body.onkeyup = function(e){
// 	if(e.keyCode == 27){
// 		resetCanvas(false);
// 	}
// }

/////////////////////
//for swiping the instructions

function slideImageDivStarted(){
	params.slideImageDivActive = true;
	d3.event.preventDefault();
}
function slideImageDivMoved(){
	if (params.slideImageDivActive){
		if (d3.event != null){
			params.dragImageSamples.push(d3.event)
		}
		if (params.dragImageSamples.length >2){
			params.dragImageSamples.shift();
			//for MouseEvent
			var x1 = params.dragImageSamples[0].screenX;
			var x2 = params.dragImageSamples[1].screenX;
			var y1 = params.dragImageSamples[0].screenY;
			var y2 = params.dragImageSamples[1].screenY;
			if (params.dragImageSamples[0].touches){ //for TouchEvent
				x1 = params.dragImageSamples[0].touches[0].screenX;
				x2 = params.dragImageSamples[1].touches[0].screenX;
				y1 = params.dragImageSamples[0].touches[0].screenY;
				y2 = params.dragImageSamples[1].touches[0].screenY;
			}

			var dt = params.dragImageSamples[1].timeStamp - params.dragImageSamples[0].timeStamp;
			var diffX = x2-x1;
			var diffY = y2-y1;
			params.dragImageVx = diffX/dt;
			// var s = Math.sign(diffX/dt);
			// params.dragImageVx = s*Math.max(Math.abs(params.dragImageVx),Math.abs(diffX/dt));
			var left = parseFloat(d3.select('#imageDiv').style('left'));
			var top = parseFloat(params.allImageDivs[params.imgI].style('top'));
			var hi = parseFloat(params.allImageDivs[params.imgI].attr('height'))
			var newTop = Math.max(Math.min(top+diffY, 0), params.windowHeight - hi);

			//console.log('testing3', x1, x2, dt, diffX, diffY, top, newTop, left, params.dragImageVx, params.dragImageSamples, hi)
			//console.log('testing3', y1, y2, diffY, top, newTop, hi, params.windowHeight)

			d3.select('#imageDiv')
				.style('left', (left+diffX)+'px')
			params.allImageDivs[params.imgI].style('top', newTop+'px')
		}
	}
}
function slideImageDivEnded(){
	params.slideImageDivActive = false;
	params.dragImageSamples = [];
	//check if we need to move the image
	var moveImg = true;
	if (Math.abs(params.dragImageVx) < params.windowWidth/100./20.){ //only if user traverses 1/100 of window size in 20 ms?
		console.log('too slow')
		moveImg = false;
	}
	if (params.imagesAvail.length  <= 1){//only if >1 images available
		console.log('only one image')
		moveImg = false
	}
	if (params.dragImageVx > 0 && params.imgI <= 0){ //only if moving in right direction
		console.log('at first image')
		moveImg = false
	}
	if (params.dragImageVx < 0 && params.imgI >= params.imagesAvail.length-1){ //only if moving in right direction
		console.log('at last image')
		moveImg = false
	}
	if (moveImg){ 
		params.imgI -= Math.sign(params.dragImageVx)
		console.log("showing image", params.imgI, params.dragImageVx)
		params.imgI = Math.min(Math.max(params.imgI, 0),params.imagesAvail.length-1);


	} 

	d3.select('#imageDiv').transition(params.tTrans)
		.style('left',(-1.*params.imgI*params.windowWidth)+'px')

	showCaption(params.captionsAvail[params.imgI]);
	params.dragImageVx = 0.;
}



// //testing the threshold values
// d3.select('#infoDiv').append('input')
// 	.on('keypress', function(){
// 		var key = d3.event.key;
// 		if (key == 'q'){
// 			params.rhoBackground += 0.001;
// 		}
// 		if (key == 'a'){
// 			params.rhoBackground -= 0.001;
// 		}
// 		if (key == 'w'){
// 			params.backgroundChi2Threshold += 1;
// 		}
// 		if (key == 's'){
// 			params.backgroundChi2Threshold -= 1;
// 		}
// 		if (key == 'e'){
// 			params.backgroundVarianceThreshold += 1;
// 		}
// 		if (key == 'd'){
// 			params.backgroundVarianceThreshold -= 1;
// 		}	
// 		console.log(params.rhoBackground, params.backgroundChi2Threshold, params.backgroundVarianceThreshold)					

// 	})

//list available devices
// if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
//   console.log("enumerateDevices() not supported.");
// }

// // List cameras and microphones.

// navigator.mediaDevices.enumerateDevices()
// .then(function(devices) {
//   devices.forEach(function(device) {
//     console.log(device.kind + ": " + device.label +
//                 " id = " + device.deviceId);
//   });
// })
// .catch(function(err) {
//   console.log(err.name + ": " + err.message);
// });

