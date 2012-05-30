var geoalg = (function() {
	
	function Point(x, y) {
		this.x = x;
		this.y = y;

		this.isValid = function() {
			return !(isNaN(this.x) || isNaN(this.y));
		};

		this.clone = function() {
			return new geoalg.Point(this.x, this.y);
		};
	}; // point definition

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
			return geoalg.Area(this.p1, this.p2, p);
		};

		this.isDegenerate = function() {
			return (this.p1.x === this.p2.x && this.p1.y === this.p2.y);
		};

	}; // line dev

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

			if ( (rcross % 2) !== (lcross % 2) ) return 2;

			if ( (rcross % 2) === 1) return 3;

			return 0;
		};
	}; // polygon def

	// Utility public
	function Area(a, b, c) {
		var area2 = (b.x-a.x)*(c.y-a.y) - (c.x-a.x)*(b.y-a.y);
		return area2/2.0;
	};

	// Utility private


	// public
	return {
		Point: Point,
		Line: Line,
		Polygon: Polygon,
		Area: Area
	}
}());

