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
			launchVLC3D() //testing, will need to send movie to function
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