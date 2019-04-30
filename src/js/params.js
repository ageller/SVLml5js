let params;
function defineParams(){
	params = new function() {
    	this.objData = null; //holds the input data for objects that will be shown in the menu 
		this.trainingImageList = null; //will hold a list of images from the current model (read in from a file)

    	//related ml5 classifier
    	this.classifier = null; //ml5 classifies object
    	this.featureExtractor = null; //ml5 featureExtractor object
		this.readyModel = false; //true when classifier is ready
		this.doClassify = true; //when true, we run through the classifier (false when showing images)
		this.loss; //holds the "loss" value while training
		this.numObjects = 2; //initial number of objects for model (will be reset to the length of objData)
		this.trainingDelay = 100; //ms delay between capturing images from video for training
		this.showingTraining = false;
		this.resultsReady = true;
		this.confidenceLim = 0.99; //limit before object is considered identified.
		this.loadingImagesToModel = false; //will be true if we are reloading images into the model
		this.trainingImageI = 0;//counter for the trainingImageList
		this.addNextImageToModel = false; //check to see if the image is done being added to the model
		this.trainingImageID = null; //will contain the id of the image for training from previous model
		this.trainingImage = null;// will hold the current training image
		
		//related to the p5js video
    	this.video = null; //holds the p5js video object that we use to classify (can use background sub)
    	this.videoShow = null; //holds the p5js video object that we show the user
    	this.label = 'loading model'; //a text label on top of the video
		this.canvas = null; //dom element to hold the video
		this.readyVideo = false; //true when video is ready to show


		/////////////////////////////
		///////change this for different webcams
		this.aspect = 9./12. //this is the  aspect (y/x) of my webcam 
		this.setVideoWidth = 400; //width of video in pixels (will be scaled to fill the browser window width)
		/////////////////////////////

		//size for the video div (defined by window size)
		this.videoWidth = null;
		this.videoHeight = null;
		this.videoOuterWidth = null;
		this.videoOuterHeight = null;
		this.videoFac = 1.;//factor to scale the video by, will be determined by maxVideoWidth/windowWidth
		this.shrink = 1.0; //fraction to shrink down the video when showing image (set to 0.2 below)

		// could use something like this for finer control over the video
		// this.videoConstraints = {
		// 	video: {
		// 		deviceId: "e2d1e7a1022f08a4ab3131ad8b24696ed535c298c08925c16f964da208f352a9",
		// 		// width: { min: 1280 },
		// 		// height: { min: 720 },
		// 		// mandatory: {
		// 		// 	deviceId: "e2d1e7a1022f08a4ab3131ad8b24696ed535c298c08925c16f964da208f352a9",
		// 		// 	// width: { min: 1280 },
		// 		// 	// height: { min: 720 }
		// 		// },
		// 		// optional: [{ maxFrameRate: 10 }]
		// 	},
		// 	audio: false
		// };

		//size for the image div (defined by window size)
		this.imageWidth = null;
		this.imageHeight = null;
		this.imgI = 0; //index of the image that is currently showing to user
		this.imagesAvail = []; //urls to available images for an active object
		this.captionsAvail = []; //captions for the available images
		this.allImageDivs = []; //the dom img elements holding the images

		//size for the info div (defined by window size)
		this.infoWidth = null;
		this.infoHeight = null;
		this.resizing = false;
		
		//size and location for the menu div (defined by window size)
		this.menuWidth;
		this.menuLeft;
		this.showingMenu = false;

		this.controlWidth = 20;// pixels width of the small controls div on the side of infoDiv

		//window size (will be rest if resized)
		this.windowWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
		this.windowHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

		//d3 transitions
		this.tTrans = d3.transition().duration(1000);

		//for background subtraction (also see commented out testing section at bottom)
		this.showBackgroundSubtractedVideo = false; //don't show the user the background subtracted video (unless they click the button)
		this.useBackground = true; //start with background subtraction
		this.captureBackground = true; //start with background subtraction
		this.backgroundImage = null; //will hold the background image
		//openCV for background subtraction
		this.readyOpenCV = false;
		this.openCVvideo = null;
		this.openCVcap = null ;
		this.openCVframe = null;
		this.openCVfgmask = null;
		this.openCVfgbg = null;

		this.initialCapture = true; //only true during the initial background capture
		this.nBackground = 100; //number of frames for the initial background capture
		this.iBackground = 0; //counter for the initial background capture frames
		//settings for the openCV background subtraction MOG2 
		this.openCVhistory = 500;
		this.openCVvarThreshold = 16;
		this.openCVdetectShadows = true;

		//if we want to scanning draw the line on top of the video (might be fun... or distracting)
		this.drawLine = false; //set to true to draw the line
		this.yLine = 0; //will change to move the line up and down
		this.lineSize = 150; //thickness of the line, in pixels
		this.lineSpeed = 10; //number of pixels for line to jump each frame


		//for click/touch controls in the small controlsDiv of the size and opacity of the info (and menu) div
		this.infoDivControlsActive = false; //will be true when user clicks inside controlsDiv
		this.dragInfoSamples = []; //will hold the click/touch events inside controlsDiv

		//for click/touch control of images (changing image, and scrolling in y)
		this.slideImageDivActive = false;
		this.dragImageSamples = [];
		this.dragImageVx = 0.;
	};


}
defineParams();
