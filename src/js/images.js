function showCaption(cap){
	var x = d3.select('#imageCaption')
	x.classed("hidden",false);
	if (cap != null){
		x.html('<span class="highlighted"> Image Caption: </span>'+cap)
		x.selectAll('a').on('click', function(){return false}); //don't allow links
		//also resize the control Div
		d3.select('#controlDiv').style('height',windowHeight); //default (do this first, or else we don't get correct height for infoDiv)
		d3.select('#controlDiv').style('height',d3.select('#infoDiv').node().scrollHeight); //in case we need to extend it

	}
}

function loadAllImages(images){
	params.imgI = 0;
	params.allImageDivs = new Array(images.length);

	d3.select('#imageDiv').selectAll('img').remove()

	var w = parseFloat(d3.select('#imageDiv').style('width'));
	var h = parseFloat(d3.select('#imageDiv').style('height'));


	d3.select('#imageDiv').selectAll('img').data(images).enter()
		.append('img')
			.attr('src',function(d){return d}) 
			.attr('width',w + 'px')
			.style('position','absolute')
			.style('left', function(d,i){
				return (i*params.windowWidth)+'px';
			})
			.style('z-index',0)
			.on('load', function(foo, index){
				var i = d3.select(this);
				var h2 = parseFloat(i.style('height'))
				//console.log('images', foo, index)
				params.allImageDivs[index] = i;
				i.attr('height', h2+'px')
				//try to center the image when clipping
				var offset = max((h2 - h)/2.,0);
				//var ctop = h+offset;
				//i.style('clip', 'rect('+offset+'px,'+w+'px,'+ctop+'px,0px)')
				i.style('top',-offset+'px')
				if (h > h2){
					i.style('margin-top',(h-h2)/2. + 'px')
				}

			})

}

/////////////////////
//for click/touch to move the images

function slideImageDivStarted(){
	params.slideImageDivActive = true;
	d3.event.preventDefault();
}
function slideImageDivMoved(){
	if (params.slideImageDivActive){
		if (d3.event != null){
			params.dragImageSamples.push(d3.event)
		}
		if (params.dragImageSamples.length >2){
			params.dragImageSamples.shift();
			//for MouseEvent
			var x1 = params.dragImageSamples[0].screenX;
			var x2 = params.dragImageSamples[1].screenX;
			var y1 = params.dragImageSamples[0].screenY;
			var y2 = params.dragImageSamples[1].screenY;
			if (params.dragImageSamples[0].touches){ //for TouchEvent
				x1 = params.dragImageSamples[0].touches[0].screenX;
				x2 = params.dragImageSamples[1].touches[0].screenX;
				y1 = params.dragImageSamples[0].touches[0].screenY;
				y2 = params.dragImageSamples[1].touches[0].screenY;
			}

			var dt = params.dragImageSamples[1].timeStamp - params.dragImageSamples[0].timeStamp;
			var diffX = x2-x1;
			var diffY = y2-y1;
			params.dragImageVx = diffX/dt;
			// var s = Math.sign(diffX/dt);
			// params.dragImageVx = s*Math.max(Math.abs(params.dragImageVx),Math.abs(diffX/dt));
			var left = parseFloat(d3.select('#imageDiv').style('left'));
			var top = parseFloat(params.allImageDivs[params.imgI].style('top'));
			var hi = parseFloat(params.allImageDivs[params.imgI].attr('height'))
			var newTop = Math.max(Math.min(top+diffY, 0), params.windowHeight - hi);

			//console.log('testing3', x1, x2, dt, diffX, diffY, top, newTop, left, params.dragImageVx, params.dragImageSamples, hi)
			//console.log('testing3', y1, y2, diffY, top, newTop, hi, params.windowHeight)

			d3.select('#imageDiv')
				.style('left', (left+diffX)+'px')
			params.allImageDivs[params.imgI].style('top', newTop+'px')
		}
	}
}
function slideImageDivEnded(){
	params.slideImageDivActive = false;
	params.dragImageSamples = [];
	//check if we need to move the image
	var moveImg = true;
	if (Math.abs(params.dragImageVx) < params.windowWidth/100./20.){ //only if user traverses 1/100 of window size in 20 ms?
		console.log('too slow')
		moveImg = false;
	}
	if (params.imagesAvail.length  <= 1){//only if >1 images available
		console.log('only one image')
		moveImg = false
	}
	if (params.dragImageVx > 0 && params.imgI <= 0){ //only if moving in right direction
		console.log('at first image')
		moveImg = false
	}
	if (params.dragImageVx < 0 && params.imgI >= params.imagesAvail.length-1){ //only if moving in right direction
		console.log('at last image')
		moveImg = false
	}
	if (moveImg){ 
		params.imgI -= Math.sign(params.dragImageVx)
		console.log("showing image", params.imgI, params.dragImageVx)
		params.imgI = Math.min(Math.max(params.imgI, 0),params.imagesAvail.length-1);


	} 

	d3.select('#imageDiv').transition(params.tTrans)
		.style('left',(-1.*params.imgI*params.windowWidth)+'px')

	showCaption(params.captionsAvail[params.imgI]);
	params.dragImageVx = 0.;
}
