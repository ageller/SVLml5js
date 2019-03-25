let objData = null;
let classifier = null;
let featureExtractor = null;
let video;
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
let allResults = {"label":[], "confidence":[]};
let nResultsTest = 100;
let imgI = 0;
let showingVideo = true;
let showingTraining = false;
let showingMenu = false;

function populateMenu(data){
	var menu = d3.select('#objectMenu')
	for (var key in data) {
		menu.append('div')
			.attr('class','subTitle')
			.text(key)
		//for (var id in data[key]){
		//	var d = data[key][id]
		//	console.log(key, id, d)
		data[key].forEach(function(d){
			numObjects += 1;
			menu.append('div')
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
			resetInfo();
			d3.select('#infoDiv').classed('hidden',true)
			d3.select('#trainingDiv').classed('hidden',false)
			doClassify = false;
			showingTraining = true;
			showingVideo = true;
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
	iDiv.select('#ImageCaption').html('')
	iDiv.select('#wikipedia').selectAll('span').remove()
	iDiv.select('#wikipedia').selectAll('a').remove()

	d3.select('#imageDiv').select('img').html('')

	doClassify = true;
	allResults = {"label":[], "confidence":[]};

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
			iDiv.select('#ImageCaption')
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
	if (obj[id].hasOwnProperty('images')){
		if (obj[id]['images'] != null){
			showImage(obj[id]['images'], imgI);
			d3.select('#imageDiv').selectAll('div').classed("hidden",false)
			console.log("here",d3.select('#imageDiv').selectAll('div'))
			d3.select('#forwardImage').on('click', function(){
				showImage(obj[id]['images'], imgI+1)
			})
			d3.select('#backwardImage').on('click', function(){
				showImage(obj[id]['images'], imgI-1)
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
	var popup = window.open(url,"WWT", "width=200,height=100");
	setTimeout(function() {popup.close();}, 1000); //I want to make this fire onload, but it won't let me
	//popup.blur(); //doesn't work
	//window.focus();
}
function launchVLC3D(movie){
	//testing for now
	var popup = window.open("http://192.168.13.178:8080/requests/status.xml?command=pl_empty","VLC3D", "width=200,height=100");
	setTimeout(function() {
		popup.location.replace("http://192.168.13.178:8080/requests/status.xml?command=in_enqueue&input=/Users/svladler/AstroConversationMedia/Movies3D_TopBottom/Stars/Sun/EUVI_171_Angstroms-TB2.mov")},
		200);
	setTimeout(function() {
		popup.location.replace("http://192.168.13.178:8080/requests/status.xml?command=pl_play")},
		400);
	setTimeout(function() {
		popup.location.replace("http://192.168.13.178:8080/requests/status.xml?command=fullscreen")},
		600);
	setTimeout(function() {popup.close();}, 1000); //I want to make this fire onload, but it won't let me

}
function showImage(images, i){
	if (i < 0){
		i = images.length-1;
	}
	d3.select('#imageDiv').selectAll('img').remove()
	d3.select('#imageDiv').selectAll('a').remove()
	imgI = i % images.length;
	// console.log(i, imgI, images.length, images[imgI])

	img = images[imgI]
	var w = parseFloat(d3.select('#imageDiv').style('width'));
	var h = parseFloat(d3.select('#imageDiv').style('height'));

	d3.select('#imageDiv').append('a')
		.attr('href',img)
		.attr('target','_blank')
		.append('img')
			.attr('src',img) 
			.attr('width',w + 'px')
			.style('position','absolute')
			.style('clip', 'rect(0px,'+w+'px,'+h+'px,0px)')
			.style('z-index',0)
			.on('load', function(){
				var i = d3.select('#imageDiv').select('img');
				var h2 = parseFloat(i.style('height'))
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
	//classifier = featureExtractor.regression(video, videoReady);
	//classifier = ml5.imageClassifier('MobileNet', video, videoReady);  


}

function modelReady(){
	console.log('Base Model (MobileNet) Loaded!');
	d3.select('#trainingNumber').text(classifier.mapStringToIndex.length).classed('highlighted', true);
	label = '';
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
	classifier.classify(function(err, results){
		gotResults(err, results)
	}); 
	// classifier.predict(gotResults)
}


// Show the results
function gotResults(err, results) {

	//need something in here to check if the result is finalized
	//then I will update the infoDiv

	// Display any error
	if (err) {
		console.error(err);
	}
	if (results && results[0]) {
		console.log("result, err", err, results[0])
		label = results[0].label;
		confidence = results[0].confidence;
		allResults.label.push(results[0].label)
		allResults.confidence.push(results[0].confidence)
		console.log(allResults.label.length)
		if (allResults.label.length >= nResultsTest){
			if (doClassify){
				result = checkResult();
				if (result != 'Blank') {
					doClassify = false;
				}
			}
		}
		//updateInfo(objData[results])
  }
}
function checkResult(){
	console.log("in checkResult")
	console.log("labels", allResults.label)
	console.log("confidence", allResults.confidence)

	//something better here!
	i = allResults.label.length - 1;
	result = allResults.label[i];
	confidence = allResults.confidence[i];

	if (result == "Blank"){
		allResults = {"label":[], "confidence":[]};
		doClassify = true;
		console.log("Blank")
	} else {
		//identify the object based on the name
		for (var key in objData) {
			objData[key].forEach(function(d,i){
				if (Object.keys(d)[0] == result){
					console.log(result, Object.keys(d)[0], objData[key][i], d)
					doClassify = false;
					updateInfo(d);
				}
			})
		}
	}

	return result
}

///////////////////////////
// for training
///////////////////////////
function populateTrainingDiv(){

	d = d3.select('#trainingDiv');
	d.selectAll('div').remove();

	d.append('div')
		.attr('class','buttonDiv training')
		.text('Load New Empty Model')
		.on('click', function(e){
			featureExtractor = null;
			classifier = null;
			doClassify = false;
			initializeML(numClasses = numObjects);
		})

	d.append('div')
		.attr('class','buttonDiv training')
		.text('Reload Saved Model')
		.on('click', function(e){
			loadSavedModel();
		})

	d.append('div')
		.attr('class','training')
		.style('margin-top','30px')
		.style('width',iWidth - 10 + 'px')
		.text("Training Status : ")
		.append('span')
			.attr('id','trainingStatus')
			.classed('highlighted', false)
			.text('--')

	d.append('div')
		.attr('class','training')
		.style('width',iWidth - 10 + 'px')
		.text("Number of objects in training set : ")
		.append('span')
			.attr('id','trainingNumber')
			.classed('highlighted', false)
			.text('--')


	d.append('div')
		.attr('class','training')
		.style('width',iWidth - 10 + 'px')
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
			showingTraining = false;
		})


}
function updateTraining(obj){
	id = Object.keys(obj)[0]
	d3.select('#trainingObject').text(id).classed('highlighted', true);
	d3.select('#trainingNumber').text(classifier.mapStringToIndex.length).classed('highlighted', true);

	var mouseUp = true;
	var record;
	d3.select('#addObject')
		.on('mousedown', function(e){
			mouseUp = false;
			record = setInterval(function(){ 
				console.log(id)
				classifier.addImage(id);
				if (mouseUp){
					d3.select('#trainingNumber').text(classifier.mapStringToIndex.length);
					clearInterval(record);
				}
			}, trainingDelay);
		})
		.on('mouseup', function(e){
			mouseUp = true;
		})
}

function whileTraining(lossValue) {
	d3.select('#trainingStatus').classed('highlighted',true);
	if (lossValue) {
		loss = lossValue;
		d3.select('#trainingStatus').text('Loss: ' + loss);
	} else {
		d3.select('#trainingStatus').text('Done Training! Final Loss: ' + loss);
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

	var x = d3.select('#imageDiv').select('img')
	if (x.node() != null){
		x.attr('width',w + 'px')
			.style('clip', 'rect(0px,'+w+'px,'+h+'px,0px)')
	}



	populateTrainingDiv()
}

function setup(){
	createCanvas(vWidth, vHeight).parent(select('#videoDiv'));
	d3.select('canvas').classed('bordered', true);

	video = createCapture(VIDEO);
	video.hide();
	background(0);

	initializeML();
	loadSavedModel();
}

function draw() {
	background(0);
	image(video, 0, 0, vWidth, vHeight);
	fill('gray');
	textSize(24);
		text(label, 10, height - 10);

	if (readyModel && readyVideo && doClassify){
		classify();
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
//read in the data
d3.json('data/allObjects.json')
	.then(function(data) {
		objData = data;
		console.log(objData)
		populateMenu(data)
	});


