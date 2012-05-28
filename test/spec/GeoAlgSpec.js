describe("test data objects", function() {

	beforeEach(function() {
		this.addMatchers({
			isZeroVector: function(v) {
				for(var i=0, l=v.length; i<v; i++) {
					if (v[i] != 0) {
						return false;
					}
				}
				return true;
			}
		});
	});

	it("allows point access", function() {
		var p = new geoalg.Point(1, 2);
		expect(p.x).toEqual(1);
		expect(p.y).toEqual(2);
	});

	it("allows point setting", function() {
		var p = new geoalg.Point(1, 1);
		p.x = 2;
		p.y = 3;
		expect(p.x).toEqual(2);
		expect(p.y).toEqual(3);
	});

	it("creates points nicely", function () {
		var p1 = new geoalg.Point(1, 2),
			p2 = new geoalg.Point(3, 4);
		l = new geoalg.Line(p1, p2);
		expect(l.p1.x).toEqual(1);
		expect(l.p1.y).toEqual(2);
		expect(l.p2.x).toEqual(3);
		expect(l.p2.y).toEqual(4);

		l = new geoalg.Line(1, 2, 3, 4);
		expect(l.p1.x).toEqual(1);
		expect(l.p1.y).toEqual(2);
		expect(l.p2.x).toEqual(3);
		expect(l.p2.y).toEqual(4);
	});


	it("returns the origin if the input is bad", function() {
		var l = new geoalg.Line(1, 2, 3);		
		expect(l.p1.x).toEqual(0);
		expect(l.p1.y).toEqual(0);
		expect(l.p2.x).toEqual(0);
		expect(l.p2.y).toEqual(0);

		l = new geoalg.Line();
		expect(l.p1.x).toEqual(0);
		expect(l.p1.y).toEqual(0);
		expect(l.p2.x).toEqual(0);
		expect(l.p2.y).toEqual(0);
	});

	it("performs the signed area of triangles", function() {
		var a = new geoalg.Point(0, 0),
		    b = new geoalg.Point(3, 0),
		    c = new geoalg.Point(0, 4);
		expect(geoalg.Area(a, b, c)).toEqual(6);
		expect(geoalg.Area(c, b, a)).toEqual(-6);

		// test degeracy
		var d = new geoalg.Point(0.5*a.x+0.5*b.x, 0.5*a.y+0.5*b.y);
		expect(geoalg.Area(a, b, d)).toEqual(0);

		// collinearity with a proper line
		var l = new geoalg.Line(a, b);
		expect(geoalg.Area(l.p1, l.p2, d)).toEqual(0);
	});

	it("creates polygons", function() {
		var a = new geoalg.Point(0, 0),
		    b = new geoalg.Point(3, 0),
		    c = new geoalg.Point(0, 4);
		var poly = new geoalg.Polygon(a, b, c);
		expect(poly.points[0].x).toEqual(0);
		expect(poly.points[0].y).toEqual(0);
		expect(poly.points[1].x).toEqual(3);
		expect(poly.points[1].y).toEqual(0);
		expect(poly.points[2].x).toEqual(0);
		expect(poly.points[2].y).toEqual(4);

		// check it cloned
		a.x = 1;
		expect(poly.points[0].x).toEqual(0);
		
		// check it doesn't
		var poly2 = new geoalg.Polygon(a, b, c, false);
		expect(poly2.points[0].x).toEqual(1);
		a.x = 0;
		expect(poly2.points[0].x).toEqual(0);

		// check explicit clone
		var poly3 = new geoalg.Polygon(a, b, c, true);
		a.x = 1;
		expect(poly3.points[0].x).toEqual(0);
	});

	it("supports polygonal containment", function() {
		var a = new geoalg.Point(0, 0),
		    b = new geoalg.Point(1, 0),
		    c = new geoalg.Point(0.25, 0.5),
		    d = new geoalg.Point(1, 1),
		    e = new geoalg.Point(0, 1),
		    testpt = new geoalg.Point(0, 0),
		    poly = new geoalg.Polygon(a, b, c, d, e);
		expect(poly.contains(testpt)).toEqual(1);
		testpt.x = 0.5;
		expect(poly.contains(testpt)).toEqual(2);
		testpt.y = 0.5;
		expect(poly.contains(testpt)).toEqual(0);
		testpt.y = 0.25;
		expect(poly.contains(testpt)).toEqual(3);
			
	});

}); // data objects test suite