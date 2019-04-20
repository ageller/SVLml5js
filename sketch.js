let objData = null;
let classifier = null;
let featureExtractor = null;
let video;
let videoShow;
let label = 'loading model';
let canvas = null;
let readyVideo = false;
let readyModel = false;
let doClassify = true;
let aspect = 9./12. //this is the  aspect (y/x) of my webcam 

let videoWidth;
let videoHeight;
let videoOuterWidth;
let videoOuterHeight;
let imageWidth;
let imageHeight;
let infoWidth;
let infoHeight;
let menuWidth;
let menuLeft;
let controlWidth = 15;// pixels width of the small controls div on the side of infoDiv

let setVideoWidth = 540; //width of video in pixels (will be scaled to fill the browser window)
let videoFac;//factor to scale the video by, will be determined by maxVideoWidth/windowWidth

let windowWidth;
let windowHeight;
// let videoConstraints = {
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

let loss;
let shrink = 1.0; //fraction to shrink down the video when showing image (set to 0.2 below)
let numObjects = 2;
let trainingDelay = 100;
let tTrans = d3.transition().duration(1000);
let imgI = 0;
let showingVideo = true;
let showingTraining = false;
let showingMenu = false;
let resultsReady = true;

let confidenceLim = 0.99; //limit before object is considered identified.

//for background subtraction (commented out testing section at bottom)
let showBackgroundSubtractedVideo = false; //don't show the user the background subtracted video (unless they click the button)
let useBackground = true; //start with background subtraction
let captureBackground = true; //start with background subtraction
let initialCapture = true;
let nBackground = 100;
let iBackground = 0;
let backgroundImageMean = null;
let backgroundImageVariance = null;
//need to tune these...
let rhoBackground = 0.01; //for time average of mean and variance
let backgroundChi2Threshold = 0; //chi2 values below this are considered background (variance seems better?)
let backgroundVarianceThreshold = 25; //variance values below this are considered background

let yLine = 0;
let lineSize = 1;
let lineSpeed = 10;

let infoDivControlsActive = false;
let dragInfoSamples = [];
let slideImageDivActive = false;
let dragImageSamples = [];
let dragImageVx = 0.;
let imagesAvail = [];
let captionsAvail = [];

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
			numObjects += 1;
			keyDiv.append('div')
				.attr('class','caption')
				.text(Object.keys(d)[0])
				.style('cursor','pointer')
				.on('click', function(e){
					if (d3.select('#trainingDiv').classed('hidden')){
						doClassify = false;
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
		.style('width',menuWidth-40 + 'px')
		.style('margin','10px')
		.style('padding','2px')
		.style('height','20px')
		.style('font-size','16px')
		.text('Update Model Training')
		.on('click', function(e){
			resetInfo(fullscreen = false);
			showingTraining = !showingTraining;
			doClassify = !showingTraining;
			elem = d3.select('#trainingButton')
			elem.classed('buttonDivActive', showingTraining);
			d3.select('#infoDiv').classed('hidden',showingTraining)
			d3.select('#trainingDiv').classed('hidden',!showingTraining)
			if (showingTraining){
				label = 'training'
				showingVideo = true;
				elem.text('Updating Model Training')
			} else {
				elem.text('Update Model Training')
			} 
		})

	//background capture
	menu.append('div')
		.attr('class','buttonDiv')
		.attr('id','backgroundCaptureButton')
		.style('width',menuWidth-40 + 'px')
		.style('margin','10px')
		.style('padding','2px')
		.style('height','20px')
		.style('font-size','16px')
		.text('Capture Background Image')
		.on('click', function(e){
			elem = d3.select('#backgroundCaptureButton');
			captureBackground = !captureBackground;
			d3.select('canvas').classed('redBordered',captureBackground)
			elem.classed('buttonDivActive', captureBackground)
			if (captureBackground){
				var w = video.width;
				var h = video.height;
				backgroundImageMean = new Array(w*h);
				backgroundImageVariance = new Array(w*h);
				useBackground = true
				iBackground = 0;
				elem.text('Capturing Background Image')
			} else {
				elem.text('Capture Background Image')
			}
		})

	//background capture
	menu.append('div')
		.attr('class','buttonDiv')
		.attr('id','backgroundOnOffButton')
		.style('width',menuWidth-40 + 'px')
		.style('margin','10px')
		.style('padding','2px')
		.style('height','20px')
		.style('font-size','16px')
		.text('Turn Off Background Subtraction')
		.on('click', function(e){
			useBackground = !useBackground;
			var elem = d3.select('#backgroundOnOffButton');
			elem.classed('buttonDivActive', !useBackground)
			if (useBackground){
				elem.text('Turn Off Background Subtraction')
			} else {
				elem.text('Background Subtraction Off')
			}

		})

	//background capture
	menu.append('div')
		.attr('class','buttonDiv')
		.attr('id','backgroundShowButton')
		.style('width',menuWidth-40 + 'px')
		.style('margin','10px')
		.style('padding','2px')
		.style('height','20px')
		.style('font-size','16px')
		.text('Show Background Subtracted Video')
		.on('click', function(e){
			showBackgroundSubtractedVideo = !showBackgroundSubtractedVideo;
			var elem = d3.select('#backgroundShowButton');
			elem.classed('buttonDivActive', showBackgroundSubtractedVideo)
			if (showBackgroundSubtractedVideo){
				elem.text('Showing Background Subtracted Video')
			} else {
				elem.text('Show Background Subtracted Video')
			}

		})
}


function showHideMenu(){
	showingMenu = !showingMenu;

	d3.select('#showMenuButton').node().classList.toggle("change");
	var useInfoWidth = infoWidth
	var pLeft = parseFloat(d3.select('#controlDiv').style('width')) + 5;
	if (showingMenu){
		menuLeft = windowWidth - menuWidth;
		useInfoWidth -= menuWidth
		//pLeft = 0;
		d3.select('#infoDiv').transition(tTrans)
			.style('width',useInfoWidth + 'px')
			.on('end',function(){
				if (useInfoWidth <= 0){
					d3.select('#infoDiv')
						.classed('notScrollable', showingMenu)
						.style('padding-left',pLeft +'px')
				}
			})
	} else {
		menuLeft = windowWidth;
		d3.select('#infoDiv')
			.classed('notScrollable', showingMenu)
			.style('padding-left',pLeft +'px')
			.transition(tTrans).style('width',useInfoWidth + 'px')

	}

	d3.select('#trainingDiv').transition(tTrans).style('width',useInfoWidth + 'px')
	d3.select('#trainingDiv').selectAll('.trainingText').transition(tTrans).style('width',useInfoWidth -10 + 'px')
	d3.select('#objectMenu').transition(tTrans).style('left',menuLeft + 'px');
	

}
//https://stackoverflow.com/questions/11068240/what-is-the-most-efficient-way-to-parse-a-css-color-in-javascript
function parseRGBA(input){
	m = input.match(/^rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+\.\d+)\s*\)/i);
	if (m) {
		return [m[1],m[2],m[3],m[4]];
	}
}
function resizeInfoDivStarted(){
	infoDivControlsActive = true;
}
function resizeInfoDivMoved(){
	if (infoDivControlsActive){
		if (d3.event != null){
			dragInfoSamples.push(d3.event)
		}
		if (dragInfoSamples.length >2){
			dragInfoSamples.shift();
			//for MouseEvent
			var x1 = dragInfoSamples[0].screenX;
			var x2 = dragInfoSamples[1].screenX;
			if (dragInfoSamples[0].hasOwnProperty('changedTouches')){ //for TouchEvent
				x1 = dragInfoSamples[0].changedTouches[0].screenX;
				x2 = dragInfoSamples[1].changedTouches[0].screenX;
			}
			var diffX = x2-x1;
			var width = parseFloat(d3.select('#infoDiv').style('width'));
			var left = parseFloat(d3.select('#infoDiv').style('left'));

			//for MouseEvent
			var y1 = dragInfoSamples[0].screenY;
			var y2 = dragInfoSamples[1].screenY;
			if (dragInfoSamples[0].hasOwnProperty('changedTouches')){ //for TouchEvent
				x1 = dragInfoSamples[0].changedTouches[0].screenY;
				x2 = dragInfoSamples[1].changedTouches[0].screenY;
			}
			var dirY = Math.sign(y1-y2);
			var m = parseRGBA(d3.select('#infoDiv').style('background-color'));
			var alpha = parseFloat(m[3])+dirY*0.02;
			alpha = Math.min(Math.max(alpha,0.01),0.99);

			var useLeft = Math.min(left+diffX, menuLeft-controlWidth-5);

			var useInfoWidth = (width-diffX);
			infoWidth = useInfoWidth;
			if (showingMenu){
				infoWidth = useInfoWidth + menuWidth;
			}
			d3.select('#infoDiv')
				.style('background-color','rgba('+m[0]+','+m[1]+','+m[2]+','+alpha+')')
				.style('width', useInfoWidth+'px')
				.style('left', useLeft+'px')
			d3.select('#objectMenu')
				.style('background-color','rgba('+m[0]+','+m[1]+','+m[2]+','+alpha+')')

			if (useInfoWidth > 2.*controlWidth){
				d3.select('#infoDiv').classed('notScrollable', false);
			} else {
				d3.select('#infoDiv').classed('notScrollable', true);
			}
		}
	}
}
function resizeInfoDivEnded(){
	infoDivControlsActive = false;
	dragInfoSamples = [];
}
function resetCanvas(fullscreen = true){

	var w = videoWidth;
	var wOuter = videoOuterWidth;
	var hClip = windowHeight;
	var wOffset = 0;
	if (!fullscreen){
		w = imageWidth;
		wOuter = w;
		hClip = imageHeight;
		wOffset = (videoOuterWidth - imageWidth)/2.
	}

	var vW = d3.select('#videoWrapper');
	var vD = d3.select('#videoDiv');
	//clip and center so that I can switch between full screen and not
	w += wOffset;
	wOuter += wOffset;
	var h = w*aspect;
	var hOuter = hOuter*aspect;

	vW.style('clip', 'rect(0px,'+w*videoFac*shrink+'px,'+hClip*shrink+'px,'+wOffset+'px)');
	vW.style('transform', 'translate(-'+wOffset+'px,0px)');

	//canvas
	var cvs = d3.select('canvas');
	if (canvas == null){
		pixelDensity(1); //need this or else the pixel density is 2 by default (!), and confuses things (and slows down)
		video = createCapture(VIDEO);
		video.size(w,h)
		video.hide();
		// videoShow = createCapture(videoConstraints, function(stream) {
		// 	console.log(stream);
		//  });
		videoShow = createCapture(VIDEO);
		videoShow.size(w,h)
		videoShow.hide();		
		canvas = createCanvas(w, h).parent(select('#videoDiv'));
		cvs = d3.select('canvas');
		cvs.classed('bordered', !fullscreen);
	} 

	if (canvas != null && readyVideo) { //this is needed for background subtraction, but breaks transitions!
		resizeCanvas(w, h);
	}

	var left = 0;
	if (fullscreen && w < windowWidth) {
		left = (windowWidth - w)/2.;
	}
	cvs.classed('bordered', !fullscreen)
		.attr('width',w)
		.attr('height',h)
	cvs.transition(tTrans)
		.style('width',w*shrink+'px')
		.style('height',h*shrink+'px');	


	//videoDiv
	vW.transition(tTrans)
		.style('width',wOuter*shrink+'px')
		.style('height',hOuter*shrink+'px')
	vD.transition(tTrans)
		.style('width',w*shrink+'px')
		.style('height',h*shrink+'px')
		.style('margin-left', left*shrink+'px')


	if (fullscreen && shrink == 1.){
		vW.transition(tTrans)
			.style('top','0px')
			.style('left','0px');
	} else {
		vW.transition(tTrans)
			.style('top','10px')
			.style('left','10px');

	}
	// console.log("aspect", parseFloat(cvs.style('height'))/parseFloat(cvs.style('width')), aspect, cvs.style('height'), window.innerHeight)

}

function resetInfo(fullscreen = true){
	console.log("resetInfo")
	shrink = 1.0;
	resetCanvas(fullscreen);

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
	doClassify = true;

}


function updateInfo(obj){
	//shrink the video
	imgI = 0;
	showingVideo = false;
	shrink = 0.2
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
			imagesAvail = obj[id]['images'];
			captionsAvail = obj[id]['captions'];
			console.log("N images for",id,imagesAvail.length)
			loadAllImages(imagesAvail);
			showCaption(captionsAvail[0]);
		}
	}
	d3.select('#wikipedia').selectAll('span').remove()
	d3.select('#wikipedia').selectAll('a').remove()
	if (obj[id].hasOwnProperty('wikipedia')){
		if (obj[id]['wikipedia'] != null){
			//in future we can show all images
			var wiki = d3.select('#wikipedia')
			wiki.append('span')
				.attr('class','highlighted')
				.text('Wikipedia: ');
			wiki.append('a')
				.attr('href',obj[id]['wikipedia'])
				.attr('target','_blank')
				.text(obj[id]['wikipedia']);
		}
	}
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
	}
}

function loadAllImages(images){

	d3.select('#imageDiv').selectAll('img').remove()

	var w = parseFloat(d3.select('#imageDiv').style('width'));
	var h = parseFloat(d3.select('#imageDiv').style('height'));


	d3.select('#imageDiv').selectAll('img').data(images).enter()
		.append('img')
			.attr('src',function(d){return d}) 
			.attr('width',w + 'px')
			.style('position','absolute')
			.style('left', function(d,i){
				return (i*windowWidth)+'px';
			})
			.style('z-index',0)
			.on('load', function(){
				var i = d3.select('#imageDiv').select('img');
				var h2 = parseFloat(i.style('height'))
				//try to center the image when clipping
				var offset = max((h2 - h)/2.,0);
				var ctop = h+offset;
				i.style('clip', 'rect('+offset+'px,'+w+'px,'+ctop+'px,0px)')
				i.style('top',-offset+'px')
				if (h > h2){
					i.style('margin-top',(h-h2)/2. + 'px')
				}

			})

}

function initializeML(numClasses=null){
	// Extract the already learned features from MobileNet (eventually we want to only use our own training set)
	if (featureExtractor == null){
		featureExtractor = ml5.featureExtractor('MobileNet', modelReady);
	} else {
		numClasses += featureExtractor.numClasses;
	}
	if (numClasses != null){
		featureExtractor.numClasses = numClasses;
	}
	// Initialize the Image Classifier method with MobileNet and the video as the second argument
	classifier = featureExtractor.classification(video, videoReady);
	classifier.numClasses = numClasses;
	//classifier = featureExtractor.regression(video, videoReady);
	//classifier = ml5.imageClassifier('MobileNet', video, videoReady);  

}

function modelReady(){
	console.log('Base Model (MobileNet) Loaded!');
	label = '';
	readyModel = true;
	resetTrainingText("Model Loaded")

}


function videoReady() {
	console.log('Video ready');
	readyVideo = true;
}

function resetTrainingText(status="--"){
	d3.select('#trainingNumber').text("--");
	if (classifier != null){
		if (classifier.hasOwnProperty('mapStringToIndex')){
			d3.select('#trainingNumber').text(classifier.mapStringToIndex.length).classed('highlighted', true);
		} 
	}
	d3.select('#trainingObject').text("[select from menu on right]");
	d3.select('#trainingStatus').text(status);
}
function loadSavedModel(){
	resetTrainingText("Loading Saved Model...");
	classifier.load('./model/model.json', function() {
		console.log('Custom Model Loaded!');
		console.log(classifier)
		featureExtractor.numClasses = numObjects;
		console.log("Number of classes", featureExtractor.numClasses);
		resetTrainingText("Model Loaded");

		

	});

}
// Get a prediction for the current video frame
function classify() {
	classifier.classify(function(err, results){
		if (resultsReady){
			gotResults(err, results)
		}
	}); 
	// classifier.predict(gotResults)
}

function findObject(label){
	//identify the object based on the name
	var foundObject = null;

	for (var key in objData) {
		objData[key].resultsReady = 0;
		objData[key].forEach(function(d,i){
			if (Object.keys(d)[0] == label){
				console.log(label, Object.keys(d)[0], objData[key][i], d)
				foundObject = d
			}
		})
	}

	return foundObject;

}

// Show the results
function gotResults(err, results) {



	resultsReady = false;
	foundObject = null;
	//need something in here to check if the result is finalized
	//then I will update the infoDiv

	// Display any error
	if (err) {
		console.error(err);
		resultsReady = true;
	}
	if (results && results[0]) {
		//console.log("err, results[0]", err, results[0])
		label = results[0].label;
		confidence = results[0].confidence;
		if (confidence > confidenceLim){
			if (label == "Blank"){
				doClassify = true;
				resultsReady = true;
			} else {
				console.log("have result", label)
				console.log(results)
				foundObject = findObject(label);
			}
		} else {
			resultsReady = true;
		}
	}

	if (foundObject != null){
		resultsReady = true;
		doClassify = false;
		updateInfo(foundObject);	
	}
}

///////////////////////////
// for training
///////////////////////////
function populateTrainingDiv(){

	var useInfoWidth = infoWidth
	if (showingMenu){
		useInfoWidth -= menuWidth
	} 

	d = d3.select('#trainingDiv');
	d.selectAll('div').remove();

	d.append('div')
		.attr('class','buttonDiv training')
		.text('Load New Empty Model')
		.on('click', function(e){
			featureExtractor = null;
			classifier = null;
			doClassify = false;
			resetTrainingText("Loading Empty Model ...");
			initializeML(numClasses = numObjects);
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
			classifier.train(whileTraining);
		})

	d.append('div')
		.attr('class','buttonDiv training')
		.text('Save Model')
		.on('click', function(e){
			classifier.save();
		})

	d.append('div')
		.attr('class','buttonDiv training')
		.style('margin-top','30px')
		.text('Done')
		.on('click', function(e){
			doClassify = true;
			d3.select('#infoDiv').classed('hidden',false)
			d3.select('#trainingDiv').classed('hidden',true)
			d3.select('#trainingButton').classed('buttonDivActive', false);

			showingTraining = false;
		})


}
function updateTraining(obj){
	id = Object.keys(obj)[0]
	d3.select('#trainingObject').text(id).classed('highlighted', true);
	d3.select('#trainingNumber').text(classifier.mapStringToIndex.length).classed('highlighted', true);

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
					classifier.addImage(id);
					//var fname = id.replace(/\s/g,'') + '_'+inum+'_';
					var fname = id + '_'+inum+'_';
					saveFrames(fname, 'png', 1, 1);
					inum += 1;
					if (!recording){
						d3.select('#trainingNumber').text(classifier.mapStringToIndex.length);
						clearInterval(record);
					}
				}, trainingDelay);
			} else {
				d3.select('#addObject').text("Record")
				d3.select('#addObject').classed('buttonDivActive', false);
				d3.select('#trainingNumber').text(classifier.mapStringToIndex.length).classed('highlighted', true);
				clearInterval(record);
			}
		})
}

function whileTraining(lossValue) {
	d3.select('#trainingStatus').classed('highlighted',true);
	console.log("loss",lossValue)
	if (lossValue) {
		loss = lossValue;
		d3.select('#trainingStatus').text('Training... Loss = ' + loss);
	} else {
		d3.select('#trainingStatus').text('Done Training! Final Loss = ' + loss);
	}
}

///////////////////////////
// p5 required functions
///////////////////////////

// set all the sizes
function preload(){
	yLine = 0;
	
	windowWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
	windowHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
	videoFac = windowWidth/setVideoWidth;

	var frac = 0.75; //fraction of screen width allowed for video/images

	//size this based on the screen
	//video/image div
	//videoHeight = parseFloat(window.innerHeight);
	videoWidth = windowWidth/videoFac;
	videoHeight = videoWidth*aspect;
	videoOuterWidth = windowWidth;//videoWidth;
	videoOuterHeight = windowHeight;//videoHeight;

	//image div
	imageWidth = windowWidth;
	imageHeight = windowHeight;
	//info div
	//infoWidth = parseFloat(window.innerWidth) - videoWidth - 3.*m
	infoWidth = windowWidth*(1-frac) - controlWidth;
	menuWidth = infoWidth;
	infoHeight = windowHeight;
	var useInfoWidth = infoWidth;

	if (showingMenu){
		menuLeft = windowWidth - menuWidth;
		//useInfoWidth -= menuWidth
	} else {
		menuLeft = windowWidth;
	}

	d3.select('#videoWrapper')
		.style('position','absolute')
		.style('top',0)
		.style('left',0)
		.style('padding',0)
		.style('margin',0)
		.style('width',videoOuterWidth*shrink)
		.style('height', videoOuterHeight*shrink)
		.style('background-color','black')
		.style('z-index',3);

	d3.select('#videoDiv')
		.style('position','absolute')
		.style('top',0)
		.style('left',0)
		.style('padding',0)
		.style('margin',0)
		.style('width',videoWidth*shrink + 'px')
		.style('height',videoHeight*shrink + 'px')	
		.style('z-index',4)
		.style('transform','scale('+videoFac+')')

	if (readyVideo){
		resetCanvas();
	}

	d3.select('#imageDiv')
		.style('position','absolute')
		.style('top',0)
		.style('left',(-1.*imgI*windowWidth)+'px')
		.style('padding',0)
		.style('margin',0)
		.style('width',imageWidth + 'px')
		.style('height',imageHeight + 'px')	
		.style('background-color','black')
		.style('z-index',2)
		.on("touchstart", slideImageDivStarted)
		.on("mousedown", slideImageDivStarted)

	d3.select('#infoDiv')
		.style('position','absolute')
		.style('top',0)
		.style('left',(windowWidth - useInfoWidth - controlWidth  - 5) +'px')
		.style('margin',0)
		.style('padding',0)
		.style('padding-left',(controlWidth+5)+'px')
		.style('width',useInfoWidth + 'px')
		.style('height',infoHeight + 'px')
		.style('z-index',3)
	if (imagesAvail.length == 0){
		d3.select('#infoDiv').classed('hidden',true);
	}

	d3.select('#controlDiv')
		.style('position','absolute')
		.style('top',0)
		.style('left',0)
		.style('margin',0)
		.style('padding',0)
		.style('width',controlWidth + 'px')
		.style('height',infoHeight + 'px')
		.style('z-index',3)
		.style('background-color','white')
		.style('opacity',0.8)
		.style('cursor','ew-resize')
		.on("mousedown", resizeInfoDivStarted)

	d3.select('#objectMenu')
		.style('position','absolute')
		.style('top',0)
		.style('left',menuLeft + 'px')
		.style('margin',0)
		.style('padding',0)
		.style('width',menuWidth - 4 + 'px')//to account for 2px border
		.style('height',windowHeight - 4 + 'px')//to account for 2px border

	d3.select('#trainingDiv')
		.style('position','absolute')
		.style('top',0)
		.style('left',imageWidth +'px')
		.style('margin',0)
		.style('padding',0)
		.style('width',useInfoWidth + 'px')
		.style('height',infoHeight + 'px')
		.classed('hidden',!showingTraining)


	//reload the images
	if (imagesAvail.length > 0){
		loadAllImages(imagesAvail);
	}
	//resize image if necessary
	// var w = parseFloat(d3.select('#imageDiv').style('width'));
	// var h = parseFloat(d3.select('#imageDiv').style('height'));
	// var imgs = d3.select('#imageDiv').selectAll('img')
	// imgs._groups[0].forEach(function(n){
	// 	var x = d3.select(n)
	// 	console.log("testing", x)
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
	console.log('resizing...', showingVideo, showingTraining)
	yLine = 0;
	
	windowWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
	windowHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
	videoFac = windowWidth/setVideoWidth;

	var frac = 0.75; //fraction of screen width allowed for video/images

	//size this based on the screen
	//video/image div
	//videoHeight = parseFloat(window.innerHeight);
	videoWidth = windowWidth/videoFac;
	videoHeight = videoWidth*aspect;
	videoOuterWidth = windowWidth;//videoWidth;
	videoOuterHeight = windowHeight;//videoHeight;

	//image div
	imageWidth = windowWidth;
	imageHeight = windowHeight;
	//info div
	//infoWidth = parseFloat(window.innerWidth) - videoWidth - 3.*m
	infoWidth = windowWidth*(1-frac) - controlWidth;
	menuWidth = infoWidth;
	infoHeight = windowHeight;
	var useInfoWidth = infoWidth;

	if (showingMenu){
		menuLeft = windowWidth - menuWidth;
		//useInfoWidth -= menuWidth
	} else {
		menuLeft = windowWidth;
	}

	d3.select('#videoWrapper')
		.style('width',videoOuterWidth*shrink)
		.style('height', videoOuterHeight*shrink)

	d3.select('#videoDiv')
		.style('width',videoWidth*shrink + 'px')
		.style('height',videoHeight*shrink + 'px')	
		.style('transform','scale('+videoFac+')')

	if (readyVideo){
		resetCanvas();
	}

	d3.select('#imageDiv')
		.style('left',(-1.*imgI*windowWidth)+'px')
		.style('width',imageWidth + 'px')
		.style('height',imageHeight + 'px')	

	d3.select('#infoDiv')
		.style('left',(windowWidth - useInfoWidth - controlWidth - 5) +'px')
		.style('height',infoHeight + 'px')

	d3.select('#controlDiv')
		.style('height',infoHeight + 'px')

	d3.select('#objectMenu')
		.style('left',menuLeft + 'px')
		.style('width',menuWidth - 4 + 'px')//to account for 2px border
		.style('height',windowHeight - 4 + 'px')//to account for 2px border

	d3.select('#trainingDiv')
		.style('left',imageWidth +'px')
		.style('width',useInfoWidth + 'px')
		.style('height',infoHeight + 'px')
		.classed('hidden',!showingTraining)


	//reload the images
	if (imagesAvail.length > 0){
		loadAllImages(imagesAvail);
	}

}

function setup(){

	resetCanvas();
	background(0);

	var w = video.width;
	var h = video.height;
	backgroundImageMean = new Array(w*h);
	backgroundImageVariance = new Array(w*h);
	d3.select('canvas').classed('redBordered',true)

	initializeML();
	loadSavedModel();
}



function draw() {
	background(0);

	if (readyModel && readyVideo && doClassify && !captureBackground){//&& !initialCapture){//} 
		classify();
	} 


	//for background subtraction
	if (readyVideo){
		video.loadPixels();
		divideMean(); // my function to divide out the mean value, to try to remove fluctuations in exposure time
		if (captureBackground){ //if we don't constantly do this, then any fluctuations in the exposure time of the webcam (which I can't control) changes the subtraction, but if we do constantly do this, we can't hold an object in the same place!
			setBackgroundImage(); //create the background image
		}
		if (useBackground){
			if (backgroundImageMean != null) {
				subtractBackgroundImage(); //my function below to set the pixels 
			}
		}
		if (initialCapture){
			label = 'capturing background'
			console.log(iBackground, nBackground);
		}
		if (captureBackground && initialCapture && iBackground > nBackground){ //initial background capture
			captureBackground = false;
			initialCapture = false;
			d3.select('canvas').classed('redBordered',false)

		}

		video.updatePixels(); //p5js library
	}

	// Flip the canvas so that we get a mirror image
	//and seems like I need to scale this by 0.5 to see the full image?? something is wrong here.
	var fac = 1.0
	translate(fac*videoWidth, 0);
	scale(-fac, fac);
	//scale(-1.0,1.0);    // flip x-axis backwards
	if (showBackgroundSubtractedVideo){
		image(video, 0, 0, videoWidth, videoHeight);// 
	} else {
		image(videoShow, 0, 0, videoWidth, videoHeight);// 
	}

	fill('gray');
	textSize(24);
	stroke('gray');
	strokeWeight(1);
	var h = Math.min(windowHeight, videoHeight)
	// Flip back for the text (but this doesn't work when not fullscreened because of clipping)
	scale(-1.0, 1.0);	
	translate(-videoWidth, 0);
	text(label, 10, h-10);


	if (videoReady && doClassify && !captureBackground){
		//drawLines();
	}

}
function drawLines(N=150){

	//line as if scanning (for fun)
	strokeWeight(Math.abs(lineSize));
	for (var i=0; i<N; i++){
		stroke(0, 255, 0, 255*(1. - i/(N-1)));
		var y = yLine - Math.sign(lineSpeed)*i*lineSize;
		line(0,  y, videoWidth, y);
	}
	if (yLine > videoHeight || yLine < 0) {
		lineSpeed *= -1;
	}
	yLine += lineSpeed;
}
//set the background image
//https://en.wikipedia.org/wiki/Foreground_detection#Running_Gaussian_average
function setBackgroundImage(fac = 1.){
	console.log('setting background image', video.width, video.height, pixels.length)

	var w = fac*video.width;
	var h = fac*video.height;
	//https://www.youtube.com/watch?v=nMUMZ5YRxHI
	for (x=0; x<w; x++) {
		for (y=0; y<h; y++) {
			var index = (x + y*w)*4; 

			for (k=0; k<4; k++) {
				if (iBackground == 0){
					backgroundImageMean[index + k] = pixels[index + k];
					backgroundImageVariance[index + k] = 1.;
				} else {
					var d = Math.abs(pixels[index + k] - backgroundImageMean[index + k])
					backgroundImageMean[index + k] = rhoBackground*pixels[index + k] + (1. - rhoBackground)*backgroundImageMean[index + k]
					backgroundImageVariance[index + k] = d*d*rhoBackground + (1. - rhoBackground)*backgroundImageVariance[index + k]
				}
			}
			
		}
	}
	iBackground += 1;

}
//divide the image by the mean value
function divideMean(fac = 1.){

	var w = fac*video.width;
	var h = fac*video.height;

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

	var w = fac*video.width;
	var h = fac*video.height;
	//console.log("background", w, h, pixels.length, (w + w*h)*4);
	for (x=0; x<w; x++) {
		for (y=0; y<h; y++) {
			var index = (x + y*w)*4; 
			var chi2 = 0;
			var variance = 0;
			var mean = 0;
			for (k=0; k<3; k++) { //don't subtract the opacity! 
				var d = Math.abs(pixels[index + k] - backgroundImageMean[index + k])
				chi2 += d*d/backgroundImageVariance[index + k];
				mean += d;
				variance += d*d;
			}
			mean /= 3.;
			variance = variance/3. - mean*mean;
			//if (chi2 > 0){console.log(x,y,chi2)}
			if (chi2 <= backgroundChi2Threshold || variance < backgroundVarianceThreshold){ //low variance is maybe just different exposure time?
				for (k=0; k<4; k++) { 
					pixels[index + k] = 0;
				}
			} 
		}
	}

}
///////////////////////////
// runs on load
///////////////////////////
// attach some functions to buttons
d3.select(window).on("resize", resizeDivs);

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
	//var doClassifySave = doClassify;
	resetInfo();
	//doClassify = doClassifySave;

})

//read in the data
d3.json('data/allObjects.json')
	.then(function(data) {
		objData = data;
		console.log(objData)
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
	slideImageDivActive = true;
	d3.event.preventDefault();
}
function slideImageDivMoved(){
	if (slideImageDivActive){
		if (d3.event != null){
			dragImageSamples.push(d3.event)
		}
		if (dragImageSamples.length >2){
			dragImageSamples.shift();
			//for MouseEvent
			var x1 = dragImageSamples[0].screenX;
			var x2 = dragImageSamples[1].screenX;
			if (dragImageSamples[0].hasOwnProperty('changedTouches')){ //for TouchEvent
				x1 = dragImageSamples[0].changedTouches[0].screenX;
				x2 = dragImageSamples[1].changedTouches[0].screenX;
			}

			var dt = dragImageSamples[1].timeStamp - dragImageSamples[0].timeStamp;
			var diffX = x2-x1;
			dragImageVx = diffX/dt;
			// var s = Math.sign(diffX/dt);
			// dragImageVx = s*Math.max(Math.abs(dragImageVx),Math.abs(diffX/dt));
			var left = parseFloat(d3.select('#imageDiv').style('left'));
			console.log(x1, x2, dt, diffX, dragImageVx, dragImageSamples)

			d3.select('#imageDiv')
				.style('left', (left+diffX)+'px')
		}
	}
}
function slideImageDivEnded(){
	slideImageDivActive = false;
	dragImageSamples = [];
	//check if we need to move the image
	var moveImg = true;
	if (Math.abs(dragImageVx) < windowWidth/100./20.){ //only if user traverses 1/100 of window size in 20 ms?
		console.log('too slow')
		moveImg = false;
	}
	if (imagesAvail.length  <= 1){//only if >1 images available
		console.log('only one image')
		moveImg = false
	}
	if (dragImageVx > 0 && imgI <= 0){ //only if moving in right direction
		console.log('at first image')
		moveImg = false
	}
	if (dragImageVx < 0 && imgI >= imagesAvail.length-1){ //only if moving in right direction
		console.log('at last image')
		moveImg = false
	}
	if (moveImg){ 
		imgI -= Math.sign(dragImageVx)
		console.log("showing image", imgI, dragImageVx)
		imgI = Math.min(Math.max(imgI, 0),imagesAvail.length-1);


	} 

	d3.select('#imageDiv').transition(tTrans)
		.style('left',(-1.*imgI*windowWidth)+'px')

	showCaption(captionsAvail[imgI]);
	dragImageVx = 0.;
}

//processing for fullscreen
// function mousePressed() {
//     let fs = fullscreen();
//     fullscreen(!fs);
// }

// //testing the threshold values
// d3.select('#infoDiv').append('input')
// 	.on('keypress', function(){
// 		var key = d3.event.key;
// 		if (key == 'q'){
// 			rhoBackground += 0.001;
// 		}
// 		if (key == 'a'){
// 			rhoBackground -= 0.001;
// 		}
// 		if (key == 'w'){
// 			backgroundChi2Threshold += 1;
// 		}
// 		if (key == 's'){
// 			backgroundChi2Threshold -= 1;
// 		}
// 		if (key == 'e'){
// 			backgroundVarianceThreshold += 1;
// 		}
// 		if (key == 'd'){
// 			backgroundVarianceThreshold -= 1;
// 		}	
// 		console.log(rhoBackground, backgroundChi2Threshold, backgroundVarianceThreshold)					

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

