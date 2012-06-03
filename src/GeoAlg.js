var geoalg = (function() {
	"use strict";
	function Point(x, y) {
		if (!(this instanceof Point)) {
			return new Point(x, y);
		}
		this.x = x;
		this.y = y;
	}

	Point.prototype.distSq = function(p) {
		return Math.pow((p.y-this.y), 2) + Math.pow((p.x-this.x), 2);
	};

	Point.prototype.isValid = function() {
			return !(isNaN(this.x) || isNaN(this.y));
	};

	Point.prototype.clone = function() {
			return new geoalg.Point(this.x, this.y);
	};

	function Edge() {
		if (!(this instanceof Edge)) {
			return new Edge(arguments);
		}
		this.p1 = new Point(0, 0);
		this.p2 = new Point(0, 0);
		switch (arguments.length) {
		case 2:
			this.p1.x = arguments[0].x;
			this.p1.y = arguments[0].y;
			this.p2.x = arguments[1].x;
			this.p2.y = arguments[1].y;
			break;
		case 4:
			this.p1.x = arguments[0];
			this.p1.y = arguments[1];
			this.p2.x = arguments[2];
			this.p2.y = arguments[3];
			break;
		default:
			this.p1.x = this.p1.y = this.p2.x = this.p2.y = 0;
			break;
		}
	}

	Edge.prototype.orientation = function(p) {
		return geoalg.signedArea(this.p1, this.p2, p);
	};

	Edge.prototype.isDegenerate = function() {
		return (this.p1.x === this.p2.x && this.p1.y === this.p2.y);
	};

	/**
		takes optional boolean to allow intersection of the lines and not
		just the segments

		if two segments overlap, this will return a sample point from the 
		overlap edge but not the entire thing

		TODO: (?) implement richer intersection that return the edge - this
			is more edge cases
	**/
	Edge.prototype.intersect = function(inEdge) {
		var s, t,
		num, denom,
		a = this.p1, b = this.p2,
		c = inEdge.p1, d = inEdge.p2;

		denom = a.x * (d.y - c.y) + 
				b.x * (c.y - d.y) + 
				d.x * (b.y - a.y) + 
				c.x * (a.y - b.y);

		if (denom === 0) {
			return parallelIntersection(a, b, c, d); 
		}

		num = a.x * (d.y - c.y) + 
				c.x * (a.y - d.y) + 
				d.x * (c.y - a.y);
		s = num / denom;

		num = - (a.x * (c.y - b.y) + 
				b.x * (a.y - c.y) + 
				c.x * (b.y - a.y));
		t = num / denom;

		if ( 0 <= s && s <= 1.0 && 0 <= t && t <= 1.0 ) {
			return new geoalg.Point(a.x + s * (b.x - a.x), a.y + s * (b.y - a.y));
		}
		return undefined;
	};

	// ASSUMES POINTS IN CCW ORDER
	function Polygon() {
		if (!(this instanceof Polygon)) {
			return new Polygon(arguments);
		}
		this.points = [];
		var argLen = arguments.length,
			shouldClone = true,
			lastarg = arguments[argLen-1];
		if ((typeof lastarg)==='boolean') {
			shouldClone = lastarg;
			argLen--;
		}
		for (var i=0; i<argLen; i++) {
			this.points.push(shouldClone? arguments[i].clone() : arguments[i]);
		}
	}

	// from o'rourke p244
	// return 0, 1, 2, 3 for dimension of intersection
	// e.g. none, point, edge, interior
	Polygon.prototype.contains = function(q) {
		var intersections = 0,
			pts = this.points,
			nPoints = pts.length,
			p1 = pts[nPoints-1],
			p2 = pts[0],
			count = 0,
			lcross = 0,
			rcross = 0,
			lstraddle = 0,
			rstraddle = 0,
			testX, testY;

		switch (arguments.length) {
		case 1:
			testX = arguments[0].x;
			testY = arguments[0].y;
			break;
		case 2: 
			testX = arguments[0];
			testY = arguments[1];
			break;
		default:
			return undefined;
		}

		do {
			if(testX === p1.x && testY === p1.y) {
				return 1;
			}
			lstraddle = (p1.y > testY) !== (p2.y > testY);
			rstraddle = (p1.y < testY) !== (p2.y < testY);

			if (lstraddle === true || rstraddle === true) {
				// calculate x value
				var x = (p2.x * testY - p1.x * testY - p2.x * p1.y + p1.x * p2.y)/(p2.y - p1.y);
				if (rstraddle === true && x > testX) { rcross += 1; }
				if (lstraddle === true && x < testX) { lcross += 1; }
			}
			count += 1;
			p1 = p2;
			p2 = pts[count];
		} while (count < nPoints);

		if ( (rcross % 2) !== (lcross % 2) ) { return 2; }

		if ( (rcross % 2) === 1) { return 3; }

		return 0;
	};

	Polygon.prototype.intersectLine = function(l) {
		var nPts = this.points.length,
			curEdge = new geoalg.Edge(this.points[nPts-1], this.points[0]),
			i = 1;

		if (intersects(curEdge, l) === true) {
			return true;
		}

		for (i = 1; i < nPts; i++) {
			curEdge.p1 = curEdge.p2;
			curEdge.p2 = this.points[i];
			if (intersects(curEdge, l) === true) {
				return true;
			}
		}
		return false;
	};

	// Utility public
	function signedArea(a, b, c) {
		var area2 = (b.x-a.x)*(c.y-a.y) - (c.x-a.x)*(b.y-a.y);
		return area2/2.0;
	}

	function intersects() {
		var a, 
			b, 
			c, 
			d,
			abc,
			abd,
			cda,
			cdb;
		switch (arguments.length) {
		case 2:
			a = arguments[0].p1;
			b = arguments[0].p2;
			c = arguments[1].p1;
			d = arguments[1].p2;
			break;
		case 4:
			a = arguments[0];
			b = arguments[1];
			c = arguments[2];
			d = arguments[3];
			break;
		default:
			return undefined;
		}
		abc = signedArea(a, b, c);
		abd = signedArea(a, b, d);
		cda = signedArea(c, d, a);
		cdb = signedArea(c, d, b);
		if (abc === 0 || abd === 0 || cda === 0 || cdb === 0) {
			return false;
		}
		return xor(abc > 0, abd > 0) && xor(cda > 0, cdb > 0);
	}

	/**
		inPoint is altered
	**/
	function convexHull(inPoints) {
		var nPoints = inPoints.length,
			anchor = inPoints[0],
			anchorInd = 0,
			curPt,
			sortedPoints,
			sigArea,
			i, 
			hullPoints=[],
			hullSize = 0;
		// find lexmin point & swap to front
		for (i = 1; i < nPoints; i++) {
			curPt = inPoints[i];
			if (curPt.y < anchor.y || (curPt.y === anchor.y && curPt.x < anchor.x)) {
				anchor = curPt;
				anchorInd = i;
			}
		}
		inPoints[anchorInd] = inPoints[0];
		inPoints[0] = anchor;

		// enhance points to be objects for metainfo purposes
		sortedPoints = inPoints.slice(1).map(function(p) {
			return {'point': p};
		});

		// sort in decreasing order (to use pop()) and mark collinear points for deletion
		sortedPoints.sort(function(p, q) {
			sigArea = signedArea(anchor, p.point, q.point);
			if (sigArea !== 0) {
				return sigArea;
			}
			var closer = (anchor.distSq(p.point) < anchor.distSq(q.point)) ? p : q;
			closer.interior = true;
			return 0;
		});
		// remove the interiors
		sortedPoints.filter(function(p) {
			return (p.interior === undefined);
		});
		// collapse on the points
		sortedPoints = sortedPoints.map(function(p) {
			return p.point;
		});
		hullPoints.push(anchor);
		hullPoints.push(sortedPoints.pop());
		curPt = sortedPoints.pop();
		hullSize = 2;
		// implement turning
		do {
			// test for a left turn
			sigArea = signedArea(hullPoints[hullSize-2], hullPoints[hullSize-1], curPt);
			if (sigArea > 0) {
				hullPoints.push(curPt);
				hullSize++;
				curPt = sortedPoints.pop();
			} else {
				hullPoints.pop();
				hullSize--;
			}
		} while (curPt !== undefined);
		return hullPoints;
	}

	/**
		Bentley-
	**/
	function intersectEdgeSet() {
		var nEdge = arguments.length,
			i;

	}

	// Utility private
	function xor(a, b) {
		return (a || b) && !(a && b);
	}

	/**
		assuming c is on L_{ab}, is it on the segment between a & b
	**/
	function between(a, b, c) {
		if (a.x !== b.x) {
			return ((a.x <= c.x) && (c.x <= b.x)) || ((a.x >= c.x) && (c.x >= b.x));
		} else {
			return ((a.y <= c.y) && (c.y <= b.y)) || ((a.y >= c.y) && (c.y >= b.y));
		}
	}

	/**
		if L_ab and L_cd are parallel, return a sample point from their intersection, if possible
	**/
	function parallelIntersection(a, b, c, d) {
		var out;
		if (signedArea(a, b, c) !== 0) {
			return out;
		}
		if ( between(a, b, c) ) {
			out = c;
		}
		if ( between(a, b, d) ) {
			out = d;
		}
		if ( between(c, d, a) ) {
			out = a;
		}
		if ( between(c, d, b) ) {
			out = b;
		}
		return out.clone();
	}

	// public
	return {
		Point: Point,
		Edge: Edge,
		Polygon: Polygon,
		signedArea: signedArea,
		convexHull: convexHull,
		intersects: intersects,
		intersectEdgeSet: intersectEdgeSet
	};
}());

