//chrome command to enable COR : /Applications/Google\ Chrome.app/Contents/MacOS/./Google\ Chrome --disable-web-security --user-data-dir="/Users/ageller/Visualizations/ml5js/onGitHub/SVLml5js/chromeJunk/"

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
Promise.all([
	d3.json('data/allObjects.json'),
	d3.csv('model/trainingImages/imageList.txt')
]).then(function(data) {
		params.objData = data[0];
		params.trainingImageList = data[1];
		console.log('objects list',params.objData)
		console.log('training images', params.trainingImageList)
		populateMenu(data[0])
	});
// //undo fullscreen with escape
// document.body.onkeyup = function(e){
// 	if(e.keyCode == 27){
// 		resetCanvas(false);
// 	}
// }




// //testing the background subtraction values
// d3.select('body').on('keydown', function(){
// 	var key = d3.event.key;
// 	if (key == 'q'){
// 		params.openCVhistory += 10;
// 	}
// 	if (key == 'a'){
// 		params.openCVhistory -= 10;
// 	}
// 	if (key == 'w'){
// 		params.openCVvarThreshold += 1;
// 	}
// 	if (key == 's'){
// 		params.openCVvarThreshold -= 1;
// 	}
// 	if (key == 'e'){
// 		params.openCVlearningRate += 0.1;
// 	}
// 	if (key == 'd'){
// 		params.openCVlearningRate -= 0.1;
// 	}
// 	if (key == 'r'){
// 		params.openCVdetectShadows = !params.openCVdetectShadows;
// 	}

// 	console.log(params.openCVhistory, params.openCVvarThreshold, params.openCVdetectShadows, params.openCVlearningRate);
// 	params.openCVfgbg = new cv.BackgroundSubtractorMOG2(params.openCVhistory, params.openCVvarThreshold, params.openCVdetectShadows);	

// })

//list available devices
if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
	console.log("enumerateDevices() not supported.");
} else {
	navigator.mediaDevices.enumerateDevices()
		.then(function(devices) {
			devices.forEach(function(device) {
				console.log(device.kind + ": " + device.label + " id = " + device.deviceId);
			});
		})
		.catch(function(err) {
			console.log(err.name + ": " + err.message);
	});
}
