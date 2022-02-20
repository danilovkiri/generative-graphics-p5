/*
  Copyright Johan Karlsson, Kirill Danilov, 2022
  MIT License
*/

const width = 1000;
const height = 1000;
const nOfPoints = 500;
const muScale = 0.2;
const bezierRound = 10;

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    equals(anotherPoint) {
        return this.x === anotherPoint.x && this.y === anotherPoint.y
    }

    getDist(anotherPoint) {
        return Math.hypot(this.x - anotherPoint.x, this.y - anotherPoint.y);
    }

    scale(anotherPoint, mu) {
        let newX = this.x * mu + anotherPoint.x * (1 - mu)
        let newY = this.y * mu + anotherPoint.y * (1 - mu)
        return new Point(newX, newY)
    }

    scaleByDist(anotherPoint, dist) {
        // dist is the distance from anotherPoint to the new point
        if (2 * dist >= this.getDist(anotherPoint)) {
            dist = 1
        }
        let newX = this.x + (anotherPoint.x - this.x) * (dist / this.getDist(anotherPoint))
        let newY = this.y + (anotherPoint.y - this.y) * (dist / this.getDist(anotherPoint))
        return new Point(newX, newY)
    }
}

class Triangle {
    constructor(a, b, c) {
        this.a = a;
        this.b = b;
        this.c = c;
    }

    vertexes() {
        return [this.a, this.b, this.c];
    }

    edges() {
        return [
            [this.a, this.b],
            [this.b, this.c],
            [this.c, this.a]
        ];
    }

    sharesAVertexWith(triangle) {
        for(let i = 0; i < 3; i++) {
            for(let j = 0; j < 3; j++) {
                let v = this.vertexes()[i];
                let vv = triangle.vertexes()[j];
                if(v.x === vv.x && v.y === vv.y) {
                    return true;
                }
            }
        }
        return false;
    }

    sharesAnEdgeWith(triangle) {
        let edges = triangle.edges();
        for(let i = 0; i < edges.length; i++) {
            let edge = edges[i];
            if(this.hasEdge(edge)) {
                return true;
            }
        }
        return false;
    }

    hasEdge(edge) {
        for(let i = 0; i < 3; i++) {
            let e = this.edges()[i];
            if((e[0].x === edge[0].x && e[0].y === edge[0].y && e[1].x === edge[1].x && e[1].y === edge[1].y) ||
                (e[1].x === edge[0].x && e[1].y === edge[0].y && e[0].x === edge[1].x && e[0].y === edge[1].y)) {
                return true;
            }
        }
        return false;
    }

    get circumcenter() {
        if (this._circumcenter) {
            return this._circumcenter;
        }
        let d = 2 * (this.a.x * (this.b.y - this.c.y) +
            this.b.x * (this.c.y - this.a.y) +
            this.c.x * (this.a.y - this.b.y));
        let x = 1 / d * ((this.a.x * this.a.x + this.a.y * this.a.y) * (this.b.y - this.c.y) +
            (this.b.x * this.b.x + this.b.y * this.b.y) * (this.c.y - this.a.y) +
            (this.c.x * this.c.x + this.c.y * this.c.y) * (this.a.y - this.b.y));
        let y = 1 / d * ((this.a.x * this.a.x + this.a.y * this.a.y) * (this.c.x - this.b.x) +
            (this.b.x * this.b.x + this.b.y * this.b.y) * (this.a.x - this.c.x) +
            (this.c.x * this.c.x + this.c.y * this.c.y) * (this.b.x - this.a.x));
        this._circumcenter = new Point(x, y);
        return this._circumcenter;
    }

    pointIsInsideCircumcircle(point) {
        let circumcenter = this.circumcenter;
        let circumradius = this.a.getDist(circumcenter);
        let dist = point.getDist(circumcenter)
        return dist < circumradius;
    }

}

function bowyerWatson(pointList) {
    let superTriangle = new Triangle(
        new Point(-width * 10, height * 10),
        new Point(width * 10, height * 10),
        new Point(width / 2, -height * 10)
    );
    let triangulation = [];
    triangulation.push(superTriangle);
    pointList.forEach(point => {
        let badTriangles = [];
        triangulation.forEach(triangle => {
            if(triangle.pointIsInsideCircumcircle(point)) {
                badTriangles.push(triangle);
            }
        });
        let polygon = [];
        badTriangles.forEach(triangle => {
            triangle.edges().forEach(edge => {
                let edgeIsShared = false;
                badTriangles.forEach(otherTriangle => {
                    if(triangle !== otherTriangle && otherTriangle.hasEdge(edge)) {
                        edgeIsShared = true;
                    }
                });
                if(!edgeIsShared) {
                    polygon.push(edge);
                }
            });
        });
        badTriangles.forEach(triangle => {
            let index = triangulation.indexOf(triangle);
            if (index > -1) {
                triangulation.splice(index, 1);
            }
        });
        polygon.forEach(edge => {
            let newTri = new Triangle(edge[0], edge[1], point);
            triangulation.push(newTri);
        });
    })

    let i = triangulation.length;
    while(i--) {
        let triangle = triangulation[i];
        if(triangle.sharesAVertexWith(superTriangle)) {
            let index = triangulation.indexOf(triangle);
            if (index > -1) {
                triangulation.splice(index, 1);
            }
        }
    }
    return triangulation;
}

function getVoronoiLines(triangles) {
    let lines = [];
    for(let i = 0; i < triangles.length; i++) {
        let currentTriangle = triangles[i];
        for(let j = i+1; j < triangles.length; j++) {
            let otherTriangle = triangles[j];
            if(currentTriangle.sharesAnEdgeWith(otherTriangle)) {
                let line = [new Point(currentTriangle.circumcenter.x, currentTriangle.circumcenter.y),
                    new Point(otherTriangle.circumcenter.x, otherTriangle.circumcenter.y)]
                lines.push(line);
            }
        }
    }
    return lines;
}

function getRandomPoints() {
    let pointList = [];
    for(let i = 0; i < nOfPoints; i++) {
        pointList.push(new Point(
            Math.floor(Math.random() * width),
            Math.floor(Math.random() * height)
        ));
    }
    return pointList;
}

function getMean(arr) {
    return arr.reduce((p,c) => p+c, 0 ) / arr.length
}

function getPolygonCenter(vertices) {
    let xCoords = [];
    let yCoords = [];
    for(let i = 0; i < vertices.length; i++) {
        xCoords.push(vertices[i].x);
        yCoords.push(vertices[i].y);
    }
    return new Point(getMean(xCoords), getMean(yCoords))
}

class Polygon {
    // vertices must be supplied as Point class instances in an ordered fashion (either CCW or CW)
    constructor(vertices) {
        this.vertices = vertices;
        this.center = getPolygonCenter(vertices)
    }

    edges() {
        let edges = [];
        for(let i = 0; i < this.vertices.length; i++) {
            if (i !== this.vertices.length-1) {
                edges.push([this.vertices[i], this.vertices[i+1]])
            } else {
                edges.push([this.vertices[i], this.vertices[0]])
            }
        }
        return edges
    }

    scale(mu) {
        // mu + lambda == 1, mu must be less than 1, larger mu results in a smaller resulting polygon
        let newVertices = []
        for(let i = 0; i < this.vertices.length; i++) {
            newVertices.push(this.center.scale(this.vertices[i], mu))
        }
        return new Polygon(newVertices)
    }
}

function getDirection(edge1, edge2) {
    // Defines the CW/CCW direction of vector direction change, returns true for positive area formed by edge1
    // and edge2 vectors with edge2 originating from the end of edge1
    let vector1x = edge1[1].x - edge1[0].x;
    let vector1y = edge1[1].y - edge1[0].y;
    let vector2x = edge2[1].x - edge2[0].x;
    let vector2y = edge2[1].y - edge2[0].y;
    return vector1x * vector2y - vector1y * vector2x > 0
}

function getPolygonsFromAllEdges(edges) {
    // duplicate each edge with its reverse oriented copy for further same-directional rotational polygon mapping,
    // add an attribute defining whether an edge was mapped or not
    let polygons = [];
    edgesReverseAndForward = [];
    for(let i = 0; i < edges.length; i++) {
        edgesReverseAndForward.push([edges[i][0], edges[i][1], 'false']);
        edgesReverseAndForward.push([edges[i][1], edges[i][0], 'false']);
    }
    for(let i = 0; i < edgesReverseAndForward.length; i++) {
        console.log('### INFO: Iteration', i+1, '/', edgesReverseAndForward.length)
        if (edgesReverseAndForward[i][2] === 'false') {
            localPolygonEdgesArray = [];
            localPolygonEdgesArray.push(edgesReverseAndForward[i].slice(0, 2));
            edgesReverseAndForward[i][2] = 'true';
            while (!localPolygonEdgesArray[0][0].equals(localPolygonEdgesArray.at(-1)[1])) {
                let externalEdgeNoRotationTrigger = false;
                for(let k = 0; k < edgesReverseAndForward.length; k++) {
                    let lastPoint = localPolygonEdgesArray.at(-1)[1];
                    if (edgesReverseAndForward[k][2]  === 'false') {
                        if (edgesReverseAndForward[k][0].equals(lastPoint)) {
                            if (getDirection(localPolygonEdgesArray.at(-1), edgesReverseAndForward[k])) {
                                localPolygonEdgesArray.push(edgesReverseAndForward[k].slice(0, 2));
                                edgesReverseAndForward[k][2] = 'true';
                                externalEdgeNoRotationTrigger = true;
                            }
                        }
                    }
                }
                if (!externalEdgeNoRotationTrigger) {
                    break
                }
            }
            if (localPolygonEdgesArray[0][0].equals(localPolygonEdgesArray.at(-1)[1])) {
                // here localPolygonEdgesArray contains a closed chain of one polygon edges
                polygons.push(localPolygonEdgesArray)
            }
        }
    }
    return polygons
}

function createPolygonClassInstances(polygonsAsEdgesArrays) {
    let polygonInstances = [];
    polygonsAsEdgesArrays.forEach(edgeArray => {
        let vertices = [];
        for(let i = 0; i < edgeArray.length; i++) {
            vertices.push(edgeArray[i][1])
        }
        polygonInstances.push(new Polygon(vertices))
    })
    return polygonInstances
}

function plotSmoothedPolygon(polygon, p) {
    p.noFill();
    let polygonEdges = polygon.edges();
    for(let i = 0; i < polygonEdges.length; i++) {
        let edge1, edge2;
        if (i !== polygonEdges.length-1) {
            edge1 = polygonEdges[i];
            edge2 = polygonEdges[i+1];
        } else {
            edge1 = polygonEdges[i];
            edge2 = polygonEdges[0];
        }
        let edge1New = [edge1[1].scaleByDist(edge1[0], bezierRound), edge1[0].scaleByDist(edge1[1], bezierRound)];
        let edge2New = [edge2[1].scaleByDist(edge2[0], bezierRound), edge2[0].scaleByDist(edge2[1], bezierRound)];
        p.line(edge1New[0].x, edge1New[0].y, edge1New[1].x, edge1New[1].y);
        p.bezier(edge1New[0].x, edge1New[0].y, edge1[1].x, edge1[1].y, edge2[0].x, edge2[0].y, edge2New[1].x, edge2New[1].y);
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

let branchProbability = 0.1;
let maxLife = 30;
let step = 10;
let nOfAngles = 4;
let depthThreshold = 10;
let initialWalkersN = 5;

function getAllWalkers(center, boundaries) {
    let startX = center.x;
    let startY = center.y;
    let paths = boundaries;
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
        let pointList = getRandomPoints();
        let triangles = bowyerWatson(pointList);
        let lines = getVoronoiLines(triangles)
        let polygonsAsEdgesArrays = getPolygonsFromAllEdges(lines);
        let polygonsAsClassInstances= createPolygonClassInstances(polygonsAsEdgesArrays);

        // // draws basic voronoy diagram
        // p.stroke("black");
        // p.strokeWeight(1);
        // lines.forEach(object => {
        //     p.line(object[0].x, object[0].y, object[1].x, object[1].y)
        // })

        // // draws scaled cells from voronoy diagram
        // p.stroke("grey");
        // p.strokeWeight(1);
        // polygonsAsClassInstances.forEach(polygon => {
        //     let newPolygon = polygon.scale(muScale)
        //     let newPolygonEdges = newPolygon.edges()
        //     newPolygonEdges.forEach(edge => {
        //         p.line(edge[0].x, edge[0].y, edge[1].x, edge[1].y)
        //     })
        // })

        // draws smoothed scaled cells from voronoy diagram
        p.stroke("black");
        p.strokeWeight(1);

        polygonsAsClassInstances.forEach(polygon => {
            let newPolygon = polygon.scale(muScale);
            let newPolygonCenter = newPolygon.center;
            let newPolygonEdges = newPolygon.edges()
            plotSmoothedPolygon(newPolygon, p)
            let insideWalkers = getAllWalkers(newPolygonCenter, newPolygonEdges)
            insideWalkers.forEach(object => {
                p.line(object[0].x, object[0].y, object[1].x, object[1].y);
            });
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