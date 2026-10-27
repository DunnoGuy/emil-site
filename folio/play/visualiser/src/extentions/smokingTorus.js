// This file only contains my own code

function SmokingTorus() {
    this.name = "smoking torus";
    this.amplitude = new p5.Amplitude();


    this.draw = function () {
        fourier.analyze();

    }

    
}
