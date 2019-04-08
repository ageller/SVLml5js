let objData = null;
let classifier = null;
let featureExtractor = null;
let video;
let videoShow;
let label = 'loading model';
let canvas;
let readyVideo = false;
let readyModel = false;
let doClassify = true;
let aspect = 9./12. //this is the  aspect (y/x) of my webcam 
let vWidth;
let iWidth;
let vHeight;
let menuWidth;
let menuLeft;
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
					}
					updateTraining(d);
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
			resetInfo()
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


	// //background reset
	// menu.append('div')
	// 	.attr('class','buttonDiv')
	// 	.attr('id','backgroundCaptureButton')
	// 	.style('width',menuWidth-40 + 'px')
	// 	.style('margin','10px')
	// 	.style('padding','2px')
	// 	.style('height','20px')
	// 	.style('font-size','16px')
	// 	.text('Reset Background Image')
	// 	.on('click', function(e){
	// 		var w = video.width;
	// 		var h = video.height;
	// 		backgroundImageMean = new Array(w*h);
	// 		backgroundImageVariance = new Array(w*h);
	// 		captureBackground = true;
	// 		useBackground = true
	// 		iBackground = 0;
	// 	})

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

function showHideMenu(x){
	showingMenu = !showingMenu;

	x.classList.toggle("change");
	var useiWidth = iWidth
	if (showingMenu){
		menuLeft = parseFloat(window.innerWidth) - menuWidth;
		useiWidth -= menuWidth
	} else {
		menuLeft = parseFloat(window.innerWidth);
	}
	d3.select('#infoDiv').transition(tTrans).style('width',useiWidth + 'px')
	d3.select('#trainingDiv').transition(tTrans).style('width',useiWidth + 'px')
	d3.select('#trainingDiv').selectAll('.trainingText').transition(tTrans).style('width',useiWidth -10 + 'px')
	d3.select('#objectMenu').transition(tTrans).style('left',menuLeft + 'px');

}

function resetInfo(){
	shrink = 1.0;
	d3.select('canvas').transition(tTrans)
		.style('width',vWidth*shrink+'px')
		.style('height',vHeight*shrink+'px');
	d3.select('#videoDiv').transition(tTrans)
		.style('width',vWidth*shrink+'px')
		.style('height',vHeight*shrink+'px');

	var iDiv = d3.select('#infoDiv')
	iDiv.select('#objectName').html('')
	iDiv.select('#objectDistance').html('')
	iDiv.select('#objectSize').html('')
	iDiv.select('#objectNotes').html('')
	iDiv.select('#wikipedia').selectAll('span').remove()
	iDiv.select('#wikipedia').selectAll('a').remove()

	d3.select('#imageDiv').select('img').html('')
	d3.select('#imageCaption').html('')

	doClassify = true;

}


function updateInfo(obj){
	//shrink the video
	imgI = 0;
	showingVideo = false;
	shrink = 0.2
	d3.select('canvas').transition(tTrans)
		.style('width',vWidth*shrink+'px')
		.style('height',vHeight*shrink+'px');
	d3.select('#videoDiv').transition(tTrans)
		.style('width',vWidth*shrink+'px')
		.style('height',vHeight*shrink+'px');

	var iDiv = d3.select('#infoDiv')

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
			showImage(obj[id]['images'], obj[id]['captions'], imgI);
			d3.select('#imageDiv').selectAll('div').classed("hidden",false)
			d3.select('#forwardImage').on('click', function(){
				showImage(obj[id]['images'], obj[id]['captions'], imgI+1)
			})
			d3.select('#backwardImage').on('click', function(){
				showImage(obj[id]['images'], obj[id]['captions'], imgI-1)
			})
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
	var h = parseFloat(d3.select('#imageDiv').style('height'));
	var x = d3.select('#imageCaption')
	x.classed("hidden",false);
	if (cap != null){
		x.html('<span class="highlighted"> Image Caption: </span>'+cap)
		var hc = min(parseFloat(x.style('max-height')), parseFloat(x.node().scrollHeight));
		if (parseFloat(x.style('max-height')) < parseFloat(x.node().scrollHeight)){
			hc += 10; //for padding, but not sure why I need this if statement
		}
		x.style('top',h-hc-2+'px'); //2 for border
		return hc
	} else {
		return 0
	}
}

function showImage(images, captions, i){
	if (i < 0){
		i = images.length-1;
	}
	d3.select('#imageDiv').selectAll('img').remove()
	d3.select('#imageDiv').selectAll('a').remove()
	imgI = i % images.length;
	// console.log(i, imgI, images.length, images[imgI])

	img = images[imgI]
	cap = captions[imgI]
	var w = parseFloat(d3.select('#imageDiv').style('width'));
	var h = parseFloat(d3.select('#imageDiv').style('height'));

	var hc = showCaption(cap);
	h -= hc;


	d3.select('#imageDiv').append('a')
		.attr('href',img)
		.attr('target','_blank')
		.append('img')
			.attr('src',img) 
			.attr('width',w + 'px')
			.style('position','absolute')
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
		console.log("err, results[0]", err, results[0])
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

	var useiWidth = iWidth
	if (showingMenu){
		useiWidth -= menuWidth
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
		.style('width',useiWidth - 10 + 'px')
		.text("Status : ")
		.append('span')
			.attr('id','trainingStatus')
			.classed('highlighted', false)
			.text('--')

	d.append('div')
		.attr('class','training trainingText')
		.style('width',useiWidth - 10 + 'px')
		.text("Number of objects in training set : ")
		.append('span')
			.attr('id','trainingNumber')
			.classed('highlighted', false)
			.text('--')


	d.append('div')
		.attr('class','training trainingText')
		.style('width',useiWidth - 10 + 'px')
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
			if (recording){
				record = setInterval(function(){
					d3.select('#addObject').text("Recording")
					d3.select('#addObject').classed('buttonDivActive', true);
					console.log(id)
					classifier.addImage(id);
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
	console.log('resizing...', showingVideo, showingTraining)

	var m = 10; //margin
	var b = 50; //button height
	var frac = 0.6; //maximum fraction of screen width allowed for video/images

	//size this based on the screen
	vHeight = parseFloat(window.innerHeight) - 3.*m - b;
	vWidth = vHeight/aspect;
	if (vWidth > frac*parseFloat(window.innerWidth)){ 
		vWidth = frac*parseFloat(window.innerWidth);
		vHeight = vWidth*aspect;
	}

	var cvs = d3.select('canvas');
	if (cvs != null){
		resizeCanvas(vWidth, vHeight);
		cvs.style('width',vWidth*shrink+'px')
			.style('height',vHeight*shrink+'px');
	}


	d3.select('#videoDiv')
		.style('position','absolute')
		.style('top',m + 'px')
		.style('left',m +'px')
		.style('padding',0)
		.style('margin',0)
		.style('width',vWidth*shrink + 'px')
		.style('height',vHeight*shrink + 'px')	
		.style('z-index',4)

	d3.select('#imageDiv')
		.style('position','absolute')
		.style('top',m + 'px')
		.style('left',m +'px')
		.style('padding',0)
		.style('margin',0)
		.style('width',vWidth + 'px')
		.style('height',vHeight + 'px')	
		.style('background-color','black')
		// .style('z-index',-1)

	var hc = 100;
	var x = d3.select('#imageCaption');
	if (x.node() != null){
		hc = min(100, parseFloat(x.node().scrollHeight));
		if (parseFloat(x.style('max-height')) < parseFloat(x.node().scrollHeight)){
			hc += 10; //for padding, but not sure why I need this if statement
		}
	}
	d3.select('#imageCaption')
		.style('position','absolute')
		.style('top',vHeight-hc-2 + 'px') //for borders
		.style('left',-2) //for borders
		.style('padding','5px')
		.style('margin',0)
		.style('width',vWidth-10 + 'px')//for padding
		.style('max-height',100 + 'px')	
		.style('background-color',getComputedStyle(document.documentElement).getPropertyValue('--background-color'))
		.style('color',getComputedStyle(document.documentElement).getPropertyValue('--foreground-color'))
		// .style('color','white')
		// .style('z-index',-1)

	iWidth = parseFloat(window.innerWidth) - vWidth - 3.*m
	var useiWidth = iWidth
	if (showingMenu){
		menuLeft = parseFloat(window.innerWidth) - menuWidth;
		useiWidth -= menuWidth
	} else {
		menuLeft = parseFloat(window.innerWidth);
	}

	d3.select('#infoDiv')
		.style('position','absolute')
		.style('top',m + 'px')
		.style('left',(vWidth + 2.*m) +'px')
		.style('margin',0)
		.style('padding',0)
		.style('width',useiWidth + 'px')
		.style('height',vHeight + b + m + 'px')

	menuWidth = 0.25*parseFloat(window.innerWidth);
	d3.select('#objectMenu')
		.style('position','absolute')
		.style('top',0)
		.style('left',menuLeft + 'px')
		.style('margin',0)
		.style('padding',0)
		.style('width',menuWidth - 4 + 'px')//to account for 2px border
		.style('height',parseFloat(window.innerHeight) - 4 + 'px')//to account for 2px border

	d3.select('#resetButton')
		.style('position','absolute')
		.style('top',vHeight + 2.*m + 'px')
		.style('left',m +'px')
		.style('margin',0)
		.style('padding',0)
		.style('width',vWidth + 'px')
		.style('height',b + 'px')

	d3.select('#trainingDiv')
		.style('position','absolute')
		.style('top',m + 'px')
		.style('left',(vWidth + 2.*m) +'px')
		.style('margin',0)
		.style('padding',0)
		.style('width',useiWidth + 'px')
		.style('height',vHeight + b + m + 'px')
		.classed('hidden',!showingTraining)


	//buttons to look through images
	//check if we need to create the buttons
	var x = d3.select('#imageDiv').select('#forwardImage');
	if (x.node() == null){
		x = d3.select('#imageDiv').append('div')
			.attr('id','forwardImage')
			.attr('class','buttonDivInverse')
			.style('position','absolute')
			.style('font-size', '60px')
			.style('background-color','None')
			.style('z-index',1)
			.style('right','15px')
			.text('>')
			.classed('hidden',showingVideo);
	}
	x.style('top',vHeight/2 - 30 + 'px')

	var x = d3.select('#imageDiv').select('#backwardImage');
	if (x.node() == null){
		x = d3.select('#imageDiv').append('div')
			.attr('id','backwardImage')
			.attr('class','buttonDivInverse')
			.style('position','absolute')
			.style('left','15px')
			.style('font-size', '60px')
			.style('background-color','None')
			.style('z-index',1)
			.text('<')	
			.classed('hidden',showingVideo);
	}
	x.style('top',vHeight/2 - 30 + 'px');

	//resize image if necessary
	var w = parseFloat(d3.select('#imageDiv').style('width'));
	var h = parseFloat(d3.select('#imageDiv').style('height'));
	h -= hc;
	var x = d3.select('#imageDiv').select('img')

	if (x.node() != null){
		var h2 = parseFloat(x.style('height'))
		//try to center the image when clipping
		var offset = max((h2 - h)/2.,0);
		var ctop = h+offset;
		x.attr('width',w + 'px')
			.style('clip', 'rect('+offset+'px,'+w+'px,'+ctop+'px,0px)')
			.style('top',-offset+'px')

	}



	populateTrainingDiv()
}

function setup(){
	canvas = createCanvas(vWidth, vHeight).parent(select('#videoDiv'));
	pixelDensity(1);

	d3.select('canvas').classed('bordered', true);

	video = createCapture(VIDEO);
	video.hide();
	videoShow = createCapture(VIDEO);
	videoShow.hide();

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



	if (readyModel && readyVideo && doClassify && !initialCapture){//} && !captureBackground){
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
	if (showBackgroundSubtractedVideo){
		image(video, 0, 0, vWidth, vHeight);// 
	} else {
		image(videoShow, 0, 0, vWidth, vHeight);// 
	}
	fill('gray');
	textSize(24);
	text(label, 10, height - 10);

}

//set the background image
//https://en.wikipedia.org/wiki/Foreground_detection#Running_Gaussian_average
function setBackgroundImage(){
	var w = video.width;
	var h = video.height;
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
function divideMean(){

	var w = video.width;
	var h = video.height;

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
function subtractBackgroundImage(){

	var w = video.width;
	var h = video.height;

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
window.addEventListener("resize", preload)
d3.select('#resetButton').on('click',function(e){
	resetInfo();
})
d3.select('#showMenuButton').on('click',function(e){
	showHideMenu(this);
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


