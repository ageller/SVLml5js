function initializeML(numClasses=null, empty=false, interval=10){
	var check = setInterval(function(){
		if (typeof ml5.featureExtractor != "undefined") {
			clearInterval(check);
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
			if (!empty) {
				loadSavedModel();
			}

		}
	}, interval);

}

function modelReady(){
	console.log('Base Model (MobileNet) Loaded!');
	params.label = 'model ready';
	params.readyModel = true;
	resetTrainingText("Model Loaded")

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

function loadEmptyModel(){
	params.readyModel = false;
	console.log('Loading Empty Model ...')
	resetTrainingText("Loading Empty Model ...");
	params.featureExtractor = null;
	params.classifier = null;
	params.doClassify = false;
	initializeML(numClasses = params.numObjects, empty = true);
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
		console.log("err, results[0]", err, results[0])
		params.label = results[0].label;
		confidence = results[0].confidence;
		if (confidence > params.confidenceLim){
			if (params.label == "Blank"){
				params.doClassify = true;
				params.resultsReady = true;
			} else {
				console.log("have result", params.label)
				console.log(results)
				if (params.showingMenu){
					showHideMenu();
				}
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
			loadEmptyModel();
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

//If I want to retrain with new images and also keep the old model, I think that I need to load a blank model and add in all the old images, then add the new ones, then train
function addImageToModel(){

	var d = params.trainingImageList[params.trainingImageI]
	var path = d.fileName
	var p1 = path.lastIndexOf('_')
	var id = path.slice(0,p1);
	var p2 = id.lastIndexOf('_')
	var p3 = id.lastIndexOf('/')+1
	id = id.slice(p3,p2)
	var img = loadImage(path, function(){
		//rescale to the video size (does this work?)
		var vAspect = params.videoWidth/params.videoHeight;
		var iAspect = img.width/img.height;
		var newiHeight = params.videoWidth/iAspect;
		//console.log("aspects, newiHeight", vAspect, iAspect, newiHeight);
		if (newiHeight >= params.videoHeight){
			img.resize(params.videoWidth, 0)
		} else {
			img.resize(0, params.videoHeight)
		}
		params.video.loadPixels();
		img.loadPixels();
		console.log(params.trainingImageI, path, id, img, img.pixels.length, pixels.length)
		//replace the video pixels with this image
		//https://www.youtube.com/watch?v=nMUMZ5YRxHI
		for (x=0; x<params.videoWidth; x++) {
			for (y=0; y<params.videoHeight; y++) {
				var index = (x + y*params.videoWidth)*4; //p5js pixel location
				for (k=0; k<4; k++) {
					pixels[index + k] = img.pixels[index + k]; 
				}
			}
		}
		params.video.updatePixels();
		//console.log('loaded image', id, img);
		params.classifier.addImage(id);	
		
		params.trainingImageI += 1;
		params.addNextImageToModel = true;
		d3.select('#trainingNumber').text(params.classifier.mapStringToIndex.length);

		if (params.trainingImageI == params.trainingImageList.length){
			params.loadingImagesToModel = false
			params.addNextImageToModel = false;
		}
	});

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
					if (id != 'Blank'){
						var fname = id + '_'+inum+'_';
						saveFrames(fname, 'png', 1, 1);
					}
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
