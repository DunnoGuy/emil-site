// This page only contains my own code

function TrackNavigator() {
    this.name = "track navigator";

    this.draw = function () {
        const SCALE = 500;
        for (let i = 0; i < peaks.length; i++) {
            stroke(255);
            line(i, height / 2 + peaks[i] * SCALE, i, height / 2 - peaks[i] * SCALE);
            noStroke();
        }

        let playhead = map(sound.currentTime(), 0, sound.duration(), 0, width);
        stroke('red');
        line(playhead, -SCALE, playhead, SCALE);
        noStroke();
    }

    this.rewind = function (posX) {
        timestamp = map(posX, 0, width, 0, sound.duration());
        sound.jump(timestamp);
    }

    this.onResize = function () {
        peaks = sound.getPeaks(width);
    }
}