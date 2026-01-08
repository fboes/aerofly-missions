import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

import { Gpx } from "../Import/Gpx.js";
import * as fs from "node:fs";

describe("GpxTest test", () => {
  it("should import GPX correctly", () => {
    const gpl = new Gpx(fs.readFileSync("./src/Tests/fixtures/EGOV.gpx", "utf8"));

    assert.equal(gpl.waypoints.length, 13);
    assert.equal(gpl.waypoints[0].identifier, "EGOV");
    assert.equal(gpl.waypoints[0].type, "AIRPORT");
    assert.equal(gpl.waypoints[1].type, "USER WAYPOINT");
    assert.equal(gpl.waypoints[12].type, "AIRPORT");
    assert.equal(gpl.waypoints[1].lat, 52.716667);
    assert.equal(gpl.waypoints[4].lon, -3.883333);
    assert.equal(gpl.cruisingAltFt, undefined);
  });
});
