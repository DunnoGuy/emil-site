/*
This file is designed for self-written helper tools (utils) to
be used across the project and modularized for reuse purposes.
*/

/**
* This helper applies a 2D shader with a gradient effect based on
specified colors.
* @param {color} color - the base color presented in the center of the light source
* @param {number} falloffLevel - defines how abruptly the alpha channel will be applied
* @param {p5.Shader} shader2D - the light shader object preloaded using
loadShader(): https://p5js.org/reference/p5/loadShader/
*/
function applyLightShader2D(color, falloffLevel = 1, shader2D = lightShader) {
  // map p5js colors (0-255) to the GLSL colors system (0-1)
  color = [
    map(red(color), 0, 255, 0., 1.),
    map(green(color), 0, 255, 0., 1.),
    map(blue(color), 0, 255, 0., 1.)];

  shader(shader2D);
  // pass customized variables to the shader
  shader2D.setUniform('color', color);
  shader2D.setUniform('falloffLevel', falloffLevel);
}

/*
This Queue class is based on my own previous submission
for ADS1 module, but modified for a better use of getters
and for allowing viewing the full list of items.
*/
class Queue {
  constructor() { this.elements = []; }
  ENQUEUE(item) { this.elements.push(item); }
  DEQUEUE() {
    if (this.elements.length === 0) return null;
    return this.elements.shift();
  }
  get tail() {
    return this.elements.length > 0 ? this.elements[this.elements.length - 1] : null;
  }
  get head() { return this.elements.length > 0 ? this.elements[0] : null; }
  get isEmpty() { return this.elements.length === 0; }
  get length() { return this.elements.length; }
  get fullList() { return this.elements; }
}

/**
* This is a trail-specific Queue extension that allows rotating
* elements of a visual trail with a specified length.
* @param {Number} maxLength - the maximum number of elements
(coordinates) in the trail, default value is 100.
* @method ROTATE(x,y) - accepts coordinates and rotates the trail
if the maxLength is reached
*/
class TrailPositionsQueue2D extends Queue {
  constructor(maxLength = 100) {
    super();
    this.maxLength = maxLength;
  }
  ROTATE(x, y) {
    this.elements.push([x, y]);
    if (this.length > this.maxLength) { this.DEQUEUE(); }
  }
}

/** this prototype extends the functionality of the "Number" class by adding
 * a method for constraining the value within a specified range.
 * @param {Number} min - minimum value
 * @param {Number} max - maximum value
 * @returns {Number} - the value constrained within the range of [min, max]
 */
Number.prototype.clamp = function (min, max) {
  return Math.max(min, Math.min(this, max));
}

/** this prototype extends the functionality of the "Number" class by adding
 * a method for changing the sign of its value randomly.
 * @param {Float} probability - a number from the range [0, 1]
 */
Number.prototype.randomizeSign = function (probability = 0.5) {
  return Math.random() < probability ? this : -1 * this;
}

/**
 * This Particle constructor is based on my own code from my previous
 * submission for ITP1 end-term project, with some modifications.
 */
function Particle(
  x, y, size, baseColor,
  xSpeed = 0.5, ySpeed = 0.5, lifespan = 100, narrowingRate = 0.6, slowDownRate = 0.03
) {
  this.color = baseColor;
  this.xSpeed = xSpeed;
  this.ySpeed = ySpeed;
  this.size = random(1, size);
  this.x = x;
  this.y = y;
  this.lifeTime = 0;
  this.lifespan = lifespan;

  this.drawParticle = function () {
    applyLightShader2D(this.color);
    ellipse(this.x, this.y, this.size)
    resetShader();
  }

  this.updateParticle = function () {
    // move the particle
    this.x += this.xSpeed;
    this.y += this.ySpeed;

    // slow down the particle unless it is already at its minimal speed
    this.xSpeed = Math.sign(xSpeed) * (
      abs(this.xSpeed) >= slowDownRate ? abs(this.xSpeed) - slowDownRate : null);
    this.ySpeed = Math.sign(ySpeed) * (
      abs(this.ySpeed) >= slowDownRate ? abs(this.ySpeed) - slowDownRate : null);

    // reduce the size of the particle unless it is already of a minimum size
    this.size = (this.size >= narrowingRate ? this.size - narrowingRate : null);

    // increment the timer
    this.lifeTime++;
  }
}