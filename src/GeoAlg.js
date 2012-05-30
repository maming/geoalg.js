var geoalg = (function() {
	
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

	function Line() {
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
			return geoalg.SignedArea(this.p1, this.p2, p);
		};

		this.isDegenerate = function() {
			return (this.p1.x === this.p2.x && this.p1.y === this.p2.y);
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
	function SignedArea(a, b, c) {
		var area2 = (b.x-a.x)*(c.y-a.y) - (c.x-a.x)*(b.y-a.y);
		return area2/2.0;
	}

	function ConvexHull(inPoints) {
		var nPoints = inPoints.length,
			anchor = inPoints[0],
			anchorInd = 0,
			curPt,
			sortedPoints,
			signedArea,
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
			signedArea = SignedArea(anchor, p.point, q.point);
			if (signedArea !== 0) {
				return signedArea;
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
			signedArea = SignedArea(hullPoints[hullSize-2], hullPoints[hullSize-1], curPt);
			if (signedArea > 0) {
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

	// public
	return {
		Point: Point,
		Line: Line,
		Polygon: Polygon,
		SignedArea: SignedArea,
		ConvexHull: ConvexHull
	};
}());

