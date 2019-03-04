let classifier = null;
let featureExtractor = null;
let video;
let label = 'loading model';
let canvas;
let readyVideo = false;
let readyModel = false;
let classifying = false;
let aspect = 9./12. //this is the  aspect (y/x) of my webcam 
let vWidth;
let iWidth;
let vHeight;
let menuWidth = 0.25*parseFloat(window.innerWidth);
let menuLeft = parseFloat(window.innerWidth);
let menuVisible = false;

let shrink = 0.2; //fraction to shrink down the video when showing image

let t = d3.transition().duration(1000);
function populateMenu(data){
	var menu = d3.select('#objectMenu')
	for (var key in data) {
	if (data.hasOwnProperty(key)) {
		menu.append('div')
			.attr('class','subTitle')
			.text(key)
		data[key].forEach(function(d){
			menu.append('div')
				.attr('class','caption')
				.text(d['Object'])
				.style('cursor','pointer')
				.on('click', function(e){
					updateInfo(d)
				})
		})
	}
}

}
function showHideMenu(x){
	menuVisible = !menuVisible;

	x.classList.toggle("change");
	var useiWidth = iWidth
	if (menuVisible){
		menuLeft = parseFloat(window.innerWidth) - menuWidth;
		useiWidth -= menuWidth
	} else {
		menuLeft = parseFloat(window.innerWidth);
	}
	d3.select('#infoDiv').transition(t).style('width',useiWidth + 'px')
	d3.select('#objectMenu').transition(t).style('left',menuLeft + 'px');

}
function resetInfo(){
	shrink = 0.2;
	var cvs = d3.select('#videoDiv').select('canvas');
	cvs.transition(t)
		// .attr('width',vWidth)
		// .attr('height',vHeight)
		.style('width',vWidth+'px')
		.style('height',vHeight+'px');

	var iDiv = d3.select('#infoDiv')

	iDiv.select('#objectName').html('')
	iDiv.select('#objectDistance').html('')
	iDiv.select('#objectSize').html('')
	iDiv.select('#ImageCaption').html('')

}
function updateInfo(obj){
	//shrink the video
	var cvs = d3.select('#videoDiv').select('canvas');
	var w = parseFloat(cvs.style('width'));
	var h = parseFloat(cvs.style('height'));
	cvs.transition(t)
		// .attr('width',w*shrink)
		// .attr('height',h*shrink)
		.style('width',w*shrink+'px')
		.style('height',h*shrink+'px')
	var iDiv = d3.select('#infoDiv')
	shrink = 1.
	
	var hColor = getComputedStyle(document.documentElement).getPropertyValue('--highlight-color')
	iDiv.select('#objectName').html(obj['Object'])
	if (obj['Distance'] != null){
		iDiv.select('#objectDistance')
			.html('<span style="color:'+hColor+'"> Distance: </span>'+obj['Distance'])
	}
	if (obj['Size'] != null){
		iDiv.select('#objectSize')
			.html('<span style="color:'+hColor+'"> Size: </span>'+obj['Size'])
	}
	if (obj['Notes'] != null){
		iDiv.select('#ImageCaption')
			.html('<span style="color:'+hColor+'"> Notes: </span>'+obj['Notes'])
	}
}
//set all the sizes
function preload(){
	console.log('resizing...')

	var m = 10; //margin
	var b = 50; //button height
	var frac = 0.6; //maximum fraction of screen width allowed for video/images

	//size this based on the screen
	vHeight = parseFloat(window.innerHeight) - 3.*m - b;
	vWidth = vHeight/aspect;
	if (vWidth > frac*window.innerWidth){ 
		vWidth = frac*window.innerWidth;
		vHeight = vWidth*aspect;
	}

	d3.select('#videoDiv')
		.style('position','absolute')
		.style('top',m + 'px')
		.style('left',m +'px')
		.style('padding','0')
		.style('margin','0')
		.style('width',vWidth + 'px')
		.style('height',vHeight + 'px')		

	iWidth = parseFloat(window.innerWidth) - vWidth - 3.*m
	d3.select('#infoDiv')
		.style('position','absolute')
		.style('top',m + 'px')
		.style('left',(vWidth + 2.*m) +'px')
		.style('margin',0)
		.style('padding','0')
		.style('width',iWidth + 'px')
		.style('height',vHeight + b + m + 'px')

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
		.style('padding','0')
		.style('width',vWidth + 'px')
		.style('height',b + 'px')



	var cvs = d3.select('#videoDiv').select('canvas');
	if (cvs != null){
		resizeCanvas(vWidth, vHeight);
	}


}


function setup(){
	createCanvas(vWidth, vHeight).parent(select('#videoDiv'));
	d3.select('#videoDiv').select('canvas').classed('bordered', true);

	video = createCapture(VIDEO);
	video.hide();
	background(0);

	initializeML();
	loadSavedModel();


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
	//classifier = featureExtractor.regression(video, videoReady);
	//classifier = ml5.imageClassifier('MobileNet', video, videoReady);  
}

function draw() {
	background(0);
	image(video, 0, 0, vWidth, vHeight);
	fill('gray');
	textSize(24);
	text(label, 10, height - 10);

	if (readyModel && readyVideo && !classifying){
		classify();
	}
}



function modelReady(){
	console.log('Base Model (MobileNet) Loaded!');
	readyModel = true;
}


function videoReady() {
	console.log('Video ready');
	readyVideo = true;
}

function loadSavedModel(){
	classifier.load('./model/model.json', function() {
		console.log('Custom Model Loaded!');
	});
	console.log(classifier)
	console.log(classifier.numClasses);

}
// Get a prediction for the current video frame
function classify() {
	classifier.classify(gotResults); 
	//classifier.predict(gotResults)
}

// Show the results
function gotResults(err, results) {

	//need something in here to check if the result is finalized
	//then I will update the infoDiv

	// Display any error
	if (results == "casA"){
		console.log("checking", results, err)
	}
	if (err) {
		console.error(err);
	}
	if (results && results[0]) {
		label = results;
  }
}


///////////////////////////
//attach some functions to buttons
window.addEventListener("resize", preload)
d3.select('#resetButton').on('click',function(e){
	resetInfo();
})
d3.select('#showMenuButton').on('click',function(e){
	showHideMenu(this);
})
//read in the data
d3.json('data/allObjects.json')
	.then(function(data) {
		populateMenu(data)
	});


