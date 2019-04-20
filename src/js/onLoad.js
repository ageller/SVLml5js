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

