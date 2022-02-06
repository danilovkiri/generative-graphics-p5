/*
  Copyright Johan Karlsson, Kirill Danilov, 2022
  MIT License
*/

const width = 2000;
const height = 2000;
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
    // let xvalues = [415, 339, 351, 433, 203, 91, 426, 496, 712, 795, 475, 425, 755, 367, 30, 229, 71, 505, 527, 286]
    // let yvalues = [491, 23, 361, 726, 228, 69, 658, 778, 491, 208, 423, 643, 26, 325, 188, 160, 297, 236, 421]
    // for(let i = 0; i < xvalues.length; i++) {
    //     pointList.push(new Point(
    //         xvalues[i],
    //         yvalues[i])
    //     )
    // }
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
            plotSmoothedPolygon(newPolygon, p)
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