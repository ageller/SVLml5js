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
let vHeight;

let shrink = 0.2; //fraction to shrink down the video when showing image

let t = d3.transition().duration(10000);

function resetInfo(){
	var cvs = d3.select('#videoDiv').select('canvas');
	cvs.transition(t)
		.attr('width',vWidth)
		.attr('height',vHeight)
		.style('width',vWidth+'px')
		.style('height',vHeight+'px');

	var iDiv = d3.select('#infoDiv')

	iDiv.select('#objectName').html('')
}
function updateInfo(objectName){
	//shrink the video
	var cvs = d3.select('#videoDiv').select('canvas');
	var w = cvs.attr('width');
	var h = cvs.attr('height');
	cvs.transition(t)
		.attr('width',w*shrink)
		.attr('height',h*shrink)
		.style('width',w*shrink+'px')
		.style('height',h*shrink+'px')
	var iDiv = d3.select('#infoDiv')

	iDiv.select('#objectName').html(objectName)


}
//set all the sizes
function preload(){
	console.log('resizing...')

	var m = 10; //margin
	var b = 50; //button height
	var w = parseFloat(window.innerWidth)/2. - 3.*m;
	var h = parseFloat(window.innerHeight) - 2.*m;

	//size this based on the screen
	var sze = Math.max(w, h);
	vWidth = sze;
	vHeight = vWidth*aspect;
	if (vHeight > h){
		vHeight = h;
		vWidth = vHeight/aspect;
	}

	d3.select('#videoDiv')
		.style('position','absolute')
		.style('top',m + 'px')
		.style('left',m +'px')
		.style('padding','0')
		.style('margin','0')
		.style('width',vWidth + 'px')
		.style('height',vHeight + 'px')
	d3.select('#infoDiv')
		.style('position','absolute')
		.style('top',m + 'px')
		.style('left',(vWidth + 2.*m) +'px')
		.style('margin',0)
		.style('padding','0')
		.style('width',parseFloat(window.innerWidth) - vWidth - 3.*m + 'px')
		.style('height',vHeight - b - m + 'px')


	d3.select('#resetButton')
		.style('position','absolute')
		.style('top',m + vHeight - b + 'px')
		.style('left',(vWidth + 2.*m) +'px')
		.style('margin',0)
		.style('padding','0')
		.style('width',parseFloat(window.innerWidth) - vWidth - 3.*m + 'px')
		.style('height',b + 'px')



	var iWidth = parseFloat(window.innerWidth) - parseFloat(w);
	d3.select('#infoDiv').attr('width', iWidth+"px");

	var cvs = d3.select('#videoDiv').select('canvas');
	if (cvs != null){
		resizeCanvas(vWidth, vHeight);
	}



}


function setup(){
	createCanvas(vWidth, vHeight).parent(select('#videoDiv'));
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
	var cvs = d3.select('#videoDiv').select('canvas');
	var w = cvs.attr('width');
	var h = cvs.attr('height');
	image(video, 0, 0, w, h);
	fill(255);
	textSize(16);
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
window.addEventListener("resize", preload)
d3.select('#resetButton').on('click',function(e){
	resetInfo('Eta Carina');
})
//for testing
d3.select('#infoDiv').on('click',function(e){
	console.log('testing')
	updateInfo('Eta Carina');
})
