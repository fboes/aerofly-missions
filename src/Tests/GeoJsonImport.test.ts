import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

import { GeoJsonImport } from "../Import/GeoJson.js";
import * as fs from "node:fs";

describe("GeoJsonImportTest test", () => {
  it("should import GeoJSON correctly", () => {
    const gpl = new GeoJsonImport(fs.readFileSync("./src/Tests/fixtures/reno-airrace.geojson", "utf8"));

    assert.equal(gpl.waypoints.length, 15);
    assert.equal(gpl.waypoints[0].identifier, "KRTS");
    assert.equal(gpl.waypoints[0].type, "AIRPORT");
    assert.equal(gpl.waypoints[1].type, "USER WAYPOINT");
    assert.equal(gpl.waypoints[14].type, "AIRPORT");
    assert.equal(gpl.waypoints[1].lat, 39.665246531929995);
    assert.equal(gpl.waypoints[4].lon, -119.8601888582547);
    assert.equal(gpl.cruisingAltFt, undefined);
  });

  it("should import GeoJSON with altitudes correctly", () => {
    const gpl = new GeoJsonImport(fs.readFileSync("./src/Tests/fixtures/EGOV-EGOV.geojson", "utf8"));

    assert.equal(gpl.waypoints.length, 16);
    assert.equal(gpl.waypoints[0].identifier, "EGOV");
    assert.equal(gpl.waypoints[15].identifier, "EGOV");
    assert.equal(gpl.waypoints[0].type, "AIRPORT");
    assert.equal(gpl.waypoints[1].type, "USER WAYPOINT");
    assert.equal(gpl.waypoints[15].type, "AIRPORT");
    assert.equal(gpl.waypoints[1].lat, 52.717475);
    assert.equal(gpl.waypoints[4].lon, -3.8810166666666666);
    assert.equal(gpl.cruisingAltFt, 2500);
  });
});
