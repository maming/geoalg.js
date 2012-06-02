var geoalg = (function() {
	"use strict";
	function Point(x, y) {
		this.x = x;
		this.y = y;

		this.distSq = function(p) {
			return Math.pow((p.y-this.y), 2) + Math.pow((p.x-this.x), 2);
		};

		this.isValid = function() {
			return !(isNaN(this.x) || isNaN(this.y));
		};

		this.clone = function() {
			return new geoalg.Point(this.x, this.y);
		};
	} // point definition

	function Edge() {
		this.p1 = {};
		this.p2 = {};
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
		
		this.orientation = function(p) {
			return geoalg.signedArea(this.p1, this.p2, p);
		};

		this.isDegenerate = function() {
			return (this.p1.x === this.p2.x && this.p1.y === this.p2.y);
		};

		/**
			takes optional boolean to allow intersection of the lines and not
			just the segments
		**/
		this.calcIntersection = function(inEdge) {
			var allowExtendedIntersection = false,
			s, t,
			num, denom,
			a = this.p1, b = this.p2,
			c = inEdge.p1, d = inEdge.p2;
			if (arguments.length > 1 && (typeof arguments[1]) === 'boolean') {
				allowExtendedIntersection = arguments[1];
			}
			denom = a.x * (d.y - c.y) + 
					b.x * (c.y - d.y) + 
					d.x * (b.y - a.y) + 
					c.x * (a.y - b.y);

			if (denom === 0) {
				return undefined;
			}

			num = a.x * (d.y - c.y) + 
					c.x * (a.y - d.y) + 
					d.x * (c.y - a.y);
			s = num / denom;

			num = - (a.x * (c.y - b.y) + 
					b.x * (a.y - c.y) + 
					c.x * (b.y - a.y));
			t = num / denom;

			if ( (0 <= s && s <= 1.0 && 0 <= t && t <= 1.0) || allowExtendedIntersection ) {
				return new geoalg.Point(a.x + s * (b.x - a.x), a.y + s * (b.y - a.y));
			}
			return undefined;
		};

	} // line dev

	// ASSUMES POINTS IN CCW ORDER
	function Polygon() {
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

		// from o'rourke p244
		// return 0, 1, 2, 3 for dimension of intersection
		// e.g. none, point, edge, interior
		this.contains = function(q) {
			var intersections = 0,
				pts = this.points,
				nPoints = pts.length,
				p1 = pts[nPoints-1],
				p2 = pts[0],
				count = 0,
				lcross = 0,
				rcross = 0,
				lstraddle = 0,
				rstraddle = 0;
			do {
				if(q.x === p1.x && q.y === p1.y) {
					return 1;
				}
				lstraddle = (p1.y > q.y) !== (p2.y > q.y);
				rstraddle = (p1.y < q.y) !== (p2.y < q.y);

				if (lstraddle === true || rstraddle === true) {
					// calculate x value
					var x = (p2.x * q.y - p1.x * q.y - p2.x * p1.y + p1.x * p2.y)/(p2.y - p1.y);
					if (rstraddle === true && x > q.x) { rcross += 1; }
					if (lstraddle === true && x < q.x) { lcross += 1; }
				}
				count += 1;
				p1 = p2;
				p2 = pts[count];
			} while (count < nPoints);

			if ( (rcross % 2) !== (lcross % 2) ) { return 2; }

			if ( (rcross % 2) === 1) { return 3; }

			return 0;
		};


	} // polygon def

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
		return XOR(abc > 0, abd > 0) && XOR(cda > 0, cdb > 0);
	}

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

	// Utility private
	function XOR(a, b) {
		return (a || b) && !(a && b);
	}

	// public
	return {
		Point: Point,
		Edge: Edge,
		Polygon: Polygon,
		signedArea: signedArea,
		convexHull: convexHull,
		intersects: intersects
	};
}());

