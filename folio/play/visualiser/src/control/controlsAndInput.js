/*
This file was heavily refactored for the Singleton pattern.
This is to clearly expose that only 1 instance of ControlsAndInput
(and, therefore, any UI buttons) is supposed to be created at a time.
*/

const ControlsAndInput = (function () {
	let instance;

	//Constructor function to handle the onscreen menu, keyboard and mouse
	function ControlsAndInput() {
		//my code

		// make sure there is only one instance of controls
		if (instance) {
			throw new Error("An instance of ControlAndInput already exists!");
		}
		//end of my code

		//playback button displayed in the top left of the screen
		this.playbackButton = new PlaybackButton();
		this.nextButton = new NextButton();

		//make the window fullscreen or revert to windowed
		this.mousePressed = function () {
			// my code
			if (!isSoundLoaded) return;
			// end of my code

			if (this.playbackButton.hitCheck()) return;

			// My code
			if (this.nextButton.hitCheck()) {
				this.playbackButton.playingState = true;
				return;
			}

			// rewinding over the current sound
			if (vis.selectedVisual.name == "track navigator") {
				vis.selectedVisual.rewind(mouseX);
				this.playbackButton.playingState = true;
				return;
			}
			// End of my code

			var fs = fullscreen();
			fullscreen(!fs);
		};

		//responds to keyboard presses
		//@param keycode the ascii code of the keypressed
		this.keyPressed = function (keycode) {
			console.log(keycode);

			if (keycode > 48 && keycode < 58 && keycode <= 48 + vis.visuals.length) {
				var visNumber = keycode - 49;
				vis.selectVisual(vis.visuals[visNumber].name);
			}
		};

		//draws the playback button and potentially the menu
		this.draw = function () {
			//my code
			const BUTTONS_SIZE = height / 25
			//end of my code

			push();
			//control buttons
			this.playbackButton.draw(BUTTONS_SIZE);

			// my code
			this.nextButton.draw(BUTTONS_SIZE);
			// end of my code
			pop();

		};
	};

	// my code

	// A static method that provides access to the ControlsAndInput instance
	// according to the Singleton pattern.
	ControlsAndInput.getInstance = function () {
		if (!instance) instance = new ControlsAndInput();
		return instance;
	};

	return ControlsAndInput;
	// end of my code
})
