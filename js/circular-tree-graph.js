/*
  Copyright Kirill Danilov, 2022
  danilovkiri@yandex.ru
  MIT License
*/

const width = 800;
const height = 800;
const nLevels = 30;
const spawnCoef = 3;
const radiusIncrement = 10;
const noiseSizePx = 5;

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

function dist(point1, point2) {
    return Math.hypot(point1.x - point2.x, point1.y - point2.y);
}

function findClosest(point, arrayOfPoints) {
    let distances = [];
    for(let i = 0; i < arrayOfPoints.length; i++) {
        distances.push(dist(point, arrayOfPoints[i]));
    }
    let minDist = Math.min(...distances)
    return arrayOfPoints[distances.indexOf(minDist)]
}

function rand() {
    return Math.random()
}

function getRandomEquidistantPoints(radius) {
    let spawnedPoints = [];
    let nSpawns = Math.ceil(radius * spawnCoef);
    for(let i = 0; i <= nSpawns; i++) {
        randomValue = rand()
        let x = graphCenter.x + noiseSizePx * rand() + radius * Math.cos(2 * Math.PI * randomValue)
        let y = graphCenter.y + noiseSizePx * rand() + radius * Math.sin(2 * Math.PI * randomValue)
        spawnedPoints.push(new Point(x, y))
    }
    return spawnedPoints
}

function main() {
    let edges = [];
    let radius = 0;
    let iterationPoints = [graphCenter];

    for(let i = 0; i < nLevels; i++) {
        console.log('### Processing iteration', i)
        console.log(edges)
        radius += radiusIncrement;
        let spawnedPoints = getRandomEquidistantPoints(radius);
        if (i === 0) {
            for(let k = 0; k < spawnedPoints.length; k++) {
                let edgeEnd = spawnedPoints[k];
                let edgeStart = findClosest(edgeEnd, iterationPoints);
                edges.push([edgeStart, edgeEnd])
            }
            iterationPoints = spawnedPoints;
        } else {
            for(let k = 0; k < spawnedPoints.length; k++) {
                let edgeEnd = spawnedPoints[k];
                let edgeStart = findClosest(edgeEnd, iterationPoints);
                // extend edges with new points, if more than one point is available,
                // extend with the first and create new edges with the remaining points
                let trigger = false
                for(let j = 0; j < edges.length; j++) {
                    if (edges[j].slice(-1)[0].x === edgeStart.x && edges[j].slice(-1)[0].y === edgeStart.y) {
                        edges[j].push(edgeEnd);
                        trigger = true;
                        break;
                    }
                }
                if (!trigger) {
                    edges.push([edgeStart, edgeEnd])
                }
            }
            iterationPoints = spawnedPoints;
        }
    }
    return edges
}

let graphCenter = new Point(width * 0.5, height * 0.5);

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
        let edges = main(graphCenter);
        // simple line drawing of the graph
        /**
        edges.forEach(object => {
            for(let i = 0; i < object.length - 1; i++) {
                p.line(object[i].x, object[i].y, object[i+1].x, object[i+1].y,)
            }
        })
         **/
        // curved drawing of the graph
        edges.forEach(object => {
            p.noFill();
            p.beginShape();
            p.curveVertex(object[0].x, object[0].y);
            for(let i = 0; i < object.length; i++) {
                p.curveVertex(object[i].x, object[i].y)
            }
            p.curveVertex(object[object.length-1].x, object[object.length-1].y);
            p.endShape();
        })
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