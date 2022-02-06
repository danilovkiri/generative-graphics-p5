/*
  Copyright Johan Karlsson, Kirill Danilov, 2022
  MIT License
*/

const width = 800;
const height = 800;
const nOfPoints = 50;

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

function getDist(point1, point2) {
    return Math.hypot(point1.x - point2.x, point1.y - point2.y);
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
        let circumradius = getDist(this.a, circumcenter);
        let dist = getDist(point, circumcenter)
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
            Math.random() * width,
            Math.random() * height
        ));
    }
    return pointList;
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
        let pointList = getRandomPoints();
        let triangles = bowyerWatson(pointList);
        let lines = getVoronoiLines(triangles)
        lines.forEach(object => {
            p.line(object[0].x, object[0].y, object[1].x, object[1].y)
        })

        p.stroke("red")
        p.strokeWeight(5);
        pointList.forEach(object => {
            p.point(object.x, object.y)
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