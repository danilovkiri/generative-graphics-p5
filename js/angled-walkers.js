/*
  Copyright Kirill Danilov, 2022
  MIT License
*/

let width = 1000;
let height = 1000;
let branchProbability = 0.9;
let maxLife = 500;
let step = 20;
let nOfAngles = 3;
let depthThreshold = 10;
let initialWalkersN = 3;

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

function onSegment(p, q, r) {
    return q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) &&
        q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y);
}

function orientation(p, q, r) {
    let val = (q.y - p.y) * (r.x - q.x) -
        (q.x - p.x) * (r.y - q.y);
    if (val === 0) return 0;
    return (val > 0)? 1: 2;
}

function doIntersect(p1, q1, p2, q2) {
    let o1 = orientation(p1, q1, p2);
    let o2 = orientation(p1, q1, q2);
    let o3 = orientation(p2, q2, p1);
    let o4 = orientation(p2, q2, q1);
    // General case
    if (o1 != o2 && o3 != o4)
        return true;
    // Special Cases
    // p1, q1 and p2 are collinear and p2 lies on segment p1q1
    if (o1 === 0 && onSegment(p1, p2, q1)) return true;
    // p1, q1 and q2 are collinear and q2 lies on segment p1q1
    if (o2 === 0 && onSegment(p1, q2, q1)) return true;
    // p2, q2 and p1 are collinear and p1 lies on segment p2q2
    if (o3 === 0 && onSegment(p2, p1, q2)) return true;
    // p2, q2 and q1 are collinear and q1 lies on segment p2q2
    if (o4 === 0 && onSegment(p2, q1, q2)) return true;
    return false; // Doesn't fall in any of the above cases
}

function intersects(paths, path) {
    let p2 = path[0];
    let q2 = path[1];
    for(let i = 0; i < paths.length; i++) {
        let p1 = paths[i][0];
        let q1 = paths[i][1];
        if (p1.x !== p2.x && p1.x !== q2.x && p1.y !== p2.y && p1.y !== q2.y &&
            q1.x !== p2.x && q1.x !== q2.x && q1.y !== p2.y && q1.y !== q2.y) {
            if (doIntersect(p1, q1, p2, q2)) {
                return true
            }
        }
    }
    return false
}

class Walker {
    constructor (x, y, depth) {
        this.x = x;
        this.y = y;
        this.cycles = 0;
        this.path = [];
        this.dead = false;
        this.depth = depth;
        this.subwalkers = [];
    }

    move (paths) {
        let allPaths = paths;
        if (this.dead) return;
        for(let i = 0; i < maxLife; i++) {
            let oneAngle = Math.PI * 2 / nOfAngles;
            let lineStart = new Point(this.x, this.y);
            let trigger = false;
            for(let k = 0; k < 5; k++) {
                let movingAngle = Math.floor(Math.random() * nOfAngles) * oneAngle;
                // let stepLength = Math.ceil(Math.random() * step) + step;
                let stepLength = Math.ceil(Math.random() * 3) * step/3;
                var lineEnd = new Point(this.x + stepLength * Math.cos(movingAngle),
                    this.y + stepLength * Math.sin(movingAngle));
                if (!intersects(allPaths, [lineStart, lineEnd])) {
                    allPaths.push([lineStart, lineEnd])
                    trigger = true;
                    break;
                }
            }
            if (trigger) {
                this.path.push([lineStart, lineEnd]);
                this.x = lineEnd.x;
                this.y = lineEnd.y;
                this.cycles += 1;
                if (this.cycles >= maxLife/(this.depth + 1)) {
                    this.dead = true;
                    break;
                } else {
                    this.subwalkers.push(this.spawn());
                }
            } else {
                this.dead = true;
                break;
            }
        }
        return this.subwalkers;
    }

    spawn() {
        if (Math.random() > branchProbability && this.depth < depthThreshold) {
            return new Walker(this.x, this.y, this.depth += 1)
        }
    }
}

function getAllPaths() {
    let startX = width / 2;
    let startY = height / 2;
    let paths = [];
    let walkers = [];
    for(let i = 0; i < initialWalkersN; i++) {
        walkers.push(new Walker(startX, startY, 0))
    }
    for (let i = 0; i < depthThreshold; i++) {
        console.log("### INFO: Depth", i)
        let walkersStorage = [];
        for (let k = 0; k < walkers.length; k++) {
            console.log("### INFO: Walker", k)
            let subwalkers = walkers[k].move(paths);
            let subpaths = walkers[k].path;
            paths.push(...subpaths);
            walkersStorage.push(...subwalkers)
        }
        walkers = walkersStorage.filter(function( element ) {
            return element !== undefined;
        });
        console.log("New walkers", walkers)
    }
    return paths
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

        let paths = getAllPaths();
        console.log(paths)
        paths.forEach(object => {
            p.line(object[0].x, object[0].y, object[1].x, object[1].y);
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