import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

import { Gpx } from "../Import/Gpx.js";
import { readFileFromRoot } from "./getRootDir.js";

describe("GpxTest test", () => {
  it("should import GPX correctly", () => {
    const gpl = new Gpx(readFileFromRoot("./src/Tests/fixtures/EGOV.gpx"));

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
