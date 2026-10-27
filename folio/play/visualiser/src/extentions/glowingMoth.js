// This file only contains my own code

function GlowingMoth() {
    this.name = "glowing moth";
    this.amplitude = new p5.Amplitude();
    // the light area (diameter) brighten by the Moth
    this.lightSize = width;
    // the tiny Moth should be much smaller than the emitted light
    this.mothSize = this.lightSize / 50;
    // how many trail positions should be recorded and drawn
    this.trailLength = 70;
    this.trailPositionsQueue = new TrailPositionsQueue2D(this.trailLength);
    this.particles = [];
    this.x = 0;
    this.y = 0;
    this.previousX = 0;
    this.previousY = 0;
    this.initialColor = color(240, 0, 255);
    this.color = this.initialColor;


    this.draw = function () {
        fourier.analyze();

        push();
        noStroke();
        this.changeColor();

        // Update coordinates proportionally to the sound energy groups
        this.previousX = this.x;
        this.previousY = this.y;
        const MAX_ENERGY = 255;
        this.x = map(
            fourier.getEnergy("lowMid", "highMid"),
            0, MAX_ENERGY, 0, width);
        this.y = map(
            fourier.getEnergy("bass", "treble"),
            0, MAX_ENERGY, height, 0);

        // only add particles when the Moth is significantly moving.
        if (this.trailPositionsQueue.length > 0) {
            if (abs(this.x - this.previousX) > 1
                && abs(this.y - this.previousY) > 1
            ) {
                this.addParticle();
            }
        }

        // continuously rotating the queue with [x,y] coordinates
        this.trailPositionsQueue.ROTATE(this.x, this.y);

        // global light emitted by the Moth
        applyLightShader2D(this.color);
        ellipse(this.x, this.y, this.lightSize, this.lightSize);

        this.drawParticles();
        this.drawTrail();

        // draw the Moth
        applyLightShader2D("white");
        ellipse(this.x, this.y, this.mothSize, this.mothSize);

        pop();
    }

    this.drawTrail = function () {
        const TRAIL_PARTICLES = this.trailPositionsQueue.fullList;
        for (let i = 0; i < TRAIL_PARTICLES.length; i++) {
            let particleX = TRAIL_PARTICLES[i][0];
            let particleY = TRAIL_PARTICLES[i][1];
            // Make the trail particles proportionally fading while they are moving
            // down the sequence (i.e. index is closer to the HEAD of the Queue)
            let particleSize = this.mothSize * i / TRAIL_PARTICLES.length;
            // COLOR_FALLOFF defines how rapidly the base light is scattered
            const COLOR_FALLOFF = 4;
            applyLightShader2D(this.color, COLOR_FALLOFF);
            ellipse(particleX, particleY, particleSize, particleSize);
            applyLightShader2D("white");
            ellipse(particleX, particleY, particleSize / 2, particleSize / 2);
        }
        resetShader();
    }

    this.changeColor = function (pace = 1) {
        // Changing the color with the set pace by using my util clamp()
        // to constraint all numbers within the allowed color range (0-255),
        // and my util randomizeSign() to randomize the change direction
        const MAX_COLOR_VALUE = 255;
        this.color = color(
            (red(this.color) + pace.randomizeSign()).clamp(0, MAX_COLOR_VALUE),
            (green(this.color) + pace.randomizeSign()).clamp(0, MAX_COLOR_VALUE),
            (blue(this.color) + pace.randomizeSign()).clamp(0, MAX_COLOR_VALUE)
        )
    }

    this.randomizeSign = (value = 1, probability = 0.5) =>
        Math.random() < probability ? value : -value;

    // adds a particle to the list based on the current Moth position.
    this.addParticle = function (
        lifespan = random(1000), dispersion = 10, particlesSize = 50,
        mainColor = color(random(255), random(255), random(255), random(125)),
        maxSpeed = 2
    ) {
        let particle = new Particle(
            // randomize (scatter) initial position
            x = this.x + random(-dispersion, dispersion),
            y = this.y + random(0, dispersion),
            size = particlesSize,
            baseColor = mainColor,
            // the speed and direction are based on the Moth moving
            xSpeed = (this.x - this.previousX).clamp(-maxSpeed, maxSpeed),
            ySpeed = (this.y - this.previousY).clamp(-maxSpeed, maxSpeed),
            lifespan);
        this.particles.push(particle);
    }

    this.drawParticles = function () {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].updateParticle();
            this.particles[i].drawParticle();
            if (this.particles[i].lifeTime > this.particles[i].lifespan) {
                this.particles.splice(i, 1);
            }
        }
    }
}
