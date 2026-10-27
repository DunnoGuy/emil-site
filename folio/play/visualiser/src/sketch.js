//global for the controls and input 
var controls = null;
//store visualisations in a container
var vis = null;
//variable for the p5 sound object
var sound = null;
//variable for p5 fast fourier transform
var fourier;

//my code
let isSoundLoaded = false;
let peaks = null;
let graphics;
let lightShader;
//end of my code

function preload(){
	sound = loadSound('assets/0.mp3');
	lightShader = loadShader('src/shaders/shader.vert', 'src/shaders/light.frag');
}

function setup(){
	 createCanvas(windowWidth, windowHeight, WEBGL);
	 background(0);
	 graphics = createGraphics(width, height);
	 controls = new ControlsAndInput();

	 //instantiate the fft object
	 fourier = new p5.FFT();

	 //create a new visualisation container and add visualisations
	 vis = new Visualisations();
	 vis.add(new Spectrum());
	 vis.add(new WavePattern());
	 // my code
	 vis.add(new TrackNavigator());
	 vis.add(new GlowingMoth());
	 vis.add(new SmokingTorus());
	 console.log(vis);
	 if (sound) {
		peaks = sound.getPeaks(width);
		isSoundLoaded = true;
	 }
	 //end of my code
}

function draw(){
	background(0);
	translate(-width / 2, -height / 2);
	//draw the selected visualisation
	vis.selectedVisual.draw();
	//draw the controls on top.
	controls.getInstance().draw();
}

function mouseClicked(){
	controls.getInstance().mousePressed();
}

function keyPressed(){
	controls.getInstance().keyPressed(keyCode);
}

//when the window has been resized. Resize canvas to fit 
//if the visualisation needs to be resized call its onResize method
function windowResized(){
	resizeCanvas(windowWidth, windowHeight);
	if(vis.selectedVisual.hasOwnProperty('onResize')){
		vis.selectedVisual.onResize();
	}
}
