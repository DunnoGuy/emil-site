//this file was heavily refactored into a class

//displays and handles clicks on the playback button.
class PlaybackButton extends ControlButton {
	//my code
	constructor(order = 1) {
		super(order);
		//end of my code

		//flag to determine whether to play or pause after button click and
		//to determine which icon to draw
		this.playing = false;
	}

	draw(size) {
		//my code
		super.draw(size);
		//end of my code

		if (this.playing) {
			rect(
				this.x, this.y,
				this.width / 2 - 2, this.height);
			rect(
				this.x + (this.width / 2 + 2), this.y,
				this.width / 2 - 2, this.height);
		}
		else {
			triangle(
				this.x, this.y,
				this.x + this.width, this.y + this.height / 2,
				this.x, this.y + this.height);
		}
	}

	// modified code

	//checks for clicks on the button, starts or pauses playabck.
	//@returns true if clicked false otherwise.
	hitCheck() {
		if (super.hitCheck()) {
			this.switchState();
			return true;
		}
		return false;
	}

	switchState() {
		if (sound.isPlaying()) {
			sound.pause();
		} else {
			sound.loop();
		}
		this.playing = !this.playing;
	}
	// end of modified code

	// my code
	set playingState(state) { this.playing = state; }
	get playingState() { return this.playing; }
	//end of my code

}