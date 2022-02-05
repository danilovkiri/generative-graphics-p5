let objectArray = [];
let width = 800;
let height = 800;
let nLines = 50;
let step = 20;

function getLinesVertical() {
    let x1 = width * 0.1;
    let y1 = height * 0.1;
    let x2 = width * 0.9;
    let y2 = height * 0.9;
    let cp1x = Math.random() * width * 0.8 + width * 0.1;
    let cp1y = Math.random() * height * 0.8 + height * 0.1;
    let cp2x = Math.random() * width * 0.8 + width * 0.1;
    let cp2y = Math.random() * height * 0.8 + height * 0.1;
    let x1List = [];
    let x2List = [];
    for(let i = 0; i < nLines; i++) {
        x1 += Math.random() * step;
        x1List.push(x1);
        x2 -= Math.random() * step;
        x2List.push(x2);
    }
    for(let i = 0; i < nLines; i++) {
        let anchorX1 = x1List[i];
        let anchorX2 = x2List[nLines - i];
        objectArray.push([anchorX1, y1, cp1x, cp1y, cp2x, cp2y, anchorX2, y2])
    }
}

function getLinesHorizontal() {
    let x1 = width * 0.1;
    let y1 = height * 0.9;
    let x2 = width * 0.9;
    let y2 = height * 0.1;
    let cp1x = Math.random() * width * 0.8 + width * 0.1;
    let cp1y = Math.random() * height * 0.8 + height * 0.1;
    let cp2x = Math.random() * width * 0.8 + width * 0.1;
    let cp2y = Math.random() * height * 0.8 + height * 0.1;
    let y1List = [];
    let y2List = [];
    for(let i = 0; i < nLines; i++) {
        y1 -= Math.random() * step;
        y1List.push(y1);
        y2 += Math.random() * step;
        y2List.push(y2);
    }
    for(let i = 0; i < nLines; i++) {
        let anchorY1 = y1List[i];
        let anchorY2 = y2List[nLines - i];
        objectArray.push([x1, anchorY1, cp1x, cp1y, cp2x, cp2y, x2, anchorY2])
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
        p.noFill();
        p.strokeWeight(1);
        getLinesVertical();
        getLinesHorizontal();
        objectArray.forEach(object => p.bezier(...object));
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


