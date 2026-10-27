// This file only comprises of my own code
class ControlButton {
    constructor(order) {
        this.x;
        this.y;
        this.width;
        this.height;
        this.order = order;
    }

    draw(size) {
        const PADDING = size / 20;
        this.width = size;
        this.height = size;
        this.x = size + this.width * this.order * PADDING;
        this.y = size;
        this.defaultColor();
    }

    defaultColor() {
        fill("white");
        stroke("black");
        strokeWeight(2);
    }

    hitCheck() {
        if (
            mouseX > this.x
            && mouseX < this.x + this.width
            && mouseY > this.y
            && mouseY < this.y + this.height
        ) {
            return true;
        }
        return false;
    }
}