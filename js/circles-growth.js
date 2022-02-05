let objectArray = [];
let width = 500;
let height = 500;
let defaultR = 2;
let iterations = 100;
let growthStep = 1;

class Circle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.r = defaultR;
        this.done = false;
    }
}

function resetCircles() {
    circles = [];
}

function dist(x1, y1, x2, y2) {
    return Math.hypot(x1 - x2, y1 - y2);
}

function validPos(x, y) {
    for(let i = 0; i < objectArray.length; i++) {
        let current = objectArray[i];
        let d = dist(x, y, current.x, current.y);
        if(d <= current.r + defaultR) {
            return false;
        }
    }
    return true;
}

function addCircles() {
    let counter = 0;
    do {
        let x = Math.random() * width;
        let y = Math.random() * height;
        if (validPos(x, y)) {
            let c = new Circle(x, y);
            objectArray.push(c);
        }
        counter += 1;
    } while (counter < iterations)
}

function canGrow(circle) {
    for(let i = 0; i < objectArray.length; i++) {
        let current = objectArray[i];
        if(circle !== current) {
            let d = dist(circle.x, circle.y, current.x, current.y);
            if(d - growthStep <= circle.r + current.r) {
                return false;
            }
        }
    }
    return true;
}

function packCircles() {
    let counter = width * height / 100;
    for(let i = 0; i < counter; i++) {
        if(i % 2 === 0) {
            addCircles();
        } else {
            objectArray.filter(c => !c.done).forEach(c => {
                if (canGrow(c)) {
                    c.r += growthStep;
                } else {
                    c.done = true;
                }
            });
        }
    }
}


let sketch = function (p) {
    p.setup = function () {
        if (p.type === "SVG") {p.createCanvas(width, height, p.SVG);}
        else if (p.type === "NORMAL") {p.createCanvas(width, height);}
        else {alert("Unknown canvas type")}
        p.noLoop();
    };

    p.draw = function () {
        p.clear()
        p.background("white");
        p.stroke("black");
        p.strokeWeight(1);
        resetCircles();
        packCircles();
        objectArray.forEach(object => {
            if (object.r >= 10) {
                p.fill('black');
                p.circle(object.x, object.y, object.r * 2);
            } else {
                p.fill('white');
                p.circle(object.x, object.y, object.r * 2);
            }

        });
        waiting = false;
    }

    p.save_canvas = function() {
        p.draw();
        p.save();
    }
};

cvs = new p5(sketch, "png_image");
cvs.type = "NORMAL";

// svg = new p5(sketch, "svg_image");
// svg.type = "SVG";