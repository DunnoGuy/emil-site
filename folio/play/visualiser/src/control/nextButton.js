//The whole file comprises of my own code

// displays and handles click on the "next" button
class NextButton extends ControlButton {
    constructor(order = 2) {
        super(order);
        this.soundsQty = 4;
        this.nextTrack = 1;
    }

    draw(size) {
        super.draw(size);

        triangle(
            this.x, this.y,
            this.x + this.width, this.y + this.height / 2,
            this.x, this.y + this.height);
        triangle(
            this.x + this.width / 2, this.y,
            this.x + this.width + this.width / 2, this.y + this.height / 2,
            this.x + this.width / 2, this.y + this.height);
    }

    hitCheck() {
        if (super.hitCheck()) {
            this.switchSound();
            return true;
        }
        return false;
    }

    switchSound() {
        isSoundLoaded = false;
        sound.stop();
        sound = loadSound(
            'assets/' + (this.nextTrack++) + '.mp3',
            soundLoaded => {
                peaks = sound.getPeaks(width);
                isSoundLoaded = true;
                sound.loop();
            });
        this.nextTrack = this.nextTrack % this.soundsQty;
        return true;
    }
}