let classifier = null;
let featureExtractor = null;
let video;
let loss;
let label = 'loading model';
let canvas;

function createTrainingButton(delay){
	var div = createDiv().parent(select("#infoDiv"));
	var input = createInput().parent(div);
	var button = createButton('record').parent(div); //p5
	button.mousePressed(function () {
		const feature = input.value();
		console.log(feature)
		var t = setInterval(function(){ //do this every delay ms
			console.log(feature)
			classifier.addImage(feature);
			if (!mouseIsPressed) {
				select('#trainingNumber').html(classifier.mapStringToIndex.length);
				clearInterval(t);
			}
		},delay);

	});
}

function setup(){
	
	// Create a camera input
	canvas = createCanvas(320, 270).parent(select('#videoDiv'));
	video = createCapture(VIDEO);
	video.hide();
	background(0);
  	//video.hide();



	div = createDiv().parent(select("#infoDiv")).style('margin-bottom:20px');
	loadButton = createButton('load').parent(div);
	loadButton.mousePressed(function () {
		initializeML();
		loadSavedModel();
	});

	var div = createDiv("Number of classes to add to training set : ").parent(select("#infoDiv"));
	var input = createInput().parent(div);
	var button = createButton('submit').parent(div); //p5
	button.mousePressed(function () {
		initializeML(numClasses=parseInt(input.value()));
	})


	createTrainingButton(250);

	div = createDiv().parent(select("#infoDiv"));
	trainButton = createButton('train').parent(div);
	trainButton.mousePressed(function () {
		classifier.train(whileTraining);
	});

	saveButton = createButton('save').parent(div).style('margin-top:10px');
	saveButton.mousePressed(function () {
		classifier.save();
	});

	div = createDiv().parent(select("#infoDiv")).style('margin-top:20px');
	saveButton = createButton('begin').parent(div);
	saveButton.mousePressed(function () {
		classify();
	});

}

function initializeML(numClasses=null){
	// Extract the already learned features from MobileNet (eventually we want to only use our own training set)
	console.log(numClasses)
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
	image(video, 0, 0, 320, 240);
	fill(255);
	textSize(16);
	text(label, 10, height - 10);
}



function modelReady(){
	select('#modelStatus').html('Base Model (MobileNet) Loaded!');
}

function whileTraining(lossValue) {
	if (lossValue) {
		loss = lossValue;
		select('#trainingStatus').html('Loss: ' + loss);
	} else {
		select('#trainingStatus').html('Done Training! Final Loss: ' + loss);
	}
}

function videoReady() {
	// Change the status of the model once its ready
	select('#videoStatus').html('Video ready');
	//classify();

}

function loadSavedModel(){
	classifier.load('./model/model.json', function() {
		select('#modelStatus').html('Custom Model Loaded!');
	});
	console.log(classifier)
	select('#trainingNumber').html(classifier.numClasses);

}
// Get a prediction for the current video frame
function classify() {
	classifier.classify(gotResults); 
	//classifier.predict(gotResults)
}

// Show the results
function gotResults(err, results) {
	//console.log("checking",err, results)
	// Display any error
	//console.log(results)
	if (results == "casA"){
		console.log("checking", results, err)
	}
	if (err) {
		console.error(err);
	}
	if (results && results[0]) {
		//select('#result').html(results[0].className + "<br/> with probability "+nf(results[0].probability,0,2));
		select('#result').html(results);
		classify();
  }
}
