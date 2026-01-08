import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { assertEqualsRounded } from "../Cli/Test.js";

import { MsfsPlnExport, MsfsPln, Msfs2024Export } from "../Import/MsfsPln.js";
import * as fs from "node:fs";
import { Mission } from "../Aerofly/Mission.js";
import { MissionCheckpoint } from "../Aerofly/MissionCheckpoint.js";
import { Units } from "../World/Units.js";

describe("MsfsPlnTest test", () => {
  it("should parse EGOV.pln correctly", () => {
    // Parse PLN
    const pln = new MsfsPln(fs.readFileSync("./src/Tests/fixtures/EGOV.pln", "utf8"));
    assert.equal(pln.waypoints.length, 16);
    assert.equal(pln.waypoints[0].identifier, "EGOV");
    assert.equal(pln.waypoints[0].type, "AIRPORT");
    assert.equal(pln.waypoints[1].type, "USER WAYPOINT");
    assert.equal(pln.waypoints[1].lat, 52.717475);
    assert.equal(pln.waypoints[1].elevationMeter, 2500 / Units.feetPerMeter);
    assertEqualsRounded(pln.waypoints[1].lon, -4.05834167, 8);
    assert.equal(pln.cruisingAltFt, 2500);
    assert.equal(pln.departureRunway, undefined);
    assert.equal(pln.destinationRunway, undefined);

    // Convert PLN to Mission
    const mission = new Mission("", "").fromGarminFpl(pln);
    assert.equal(mission.checkpoints.length, 16);
    assert.equal(mission.flight_setting, Mission.FLIGHT_SETTING_TAXI);
    assertEqualsRounded(mission.origin_dir, 151.3, 1);

    // Export Mission to XML
    const exportPln = new MsfsPlnExport(mission);
    assert.notEqual(exportPln.toString(), "", "Not empty flight plan");

    const exportPln2 = new Msfs2024Export(mission);
    assert.notEqual(exportPln2.toString(), "", "Not empty flight plan");

    // Reimport XML to PLN
    const secondPln = new MsfsPln(exportPln.toString());
    assert.equal(secondPln.waypoints.length, pln.waypoints.length);
    secondPln.waypoints.forEach((wp, index) => {
      assert.equal(wp.identifier, pln.waypoints[index].identifier);
      assert.equal(wp.type, pln.waypoints[index].type);
      assert.equal(wp.lat, pln.waypoints[index].lat);
      assert.equal(wp.lon, pln.waypoints[index].lon);
    });
    assert.equal(secondPln.cruisingAltFt, pln.cruisingAltFt);
  });

  it("should parse egov-lnavmap.pln correctly", () => {
    const pln = new MsfsPln(fs.readFileSync("./src/Tests/fixtures/egov-lnavmap.pln", "utf8"));
    assert.equal(pln.waypoints.length, 16);
    assert.equal(pln.waypoints[0].identifier, "EGOV");
    assert.equal(pln.waypoints[0].type, "AIRPORT");
    assert.equal(pln.waypoints[1].type, "USER WAYPOINT");
    assertEqualsRounded(pln.waypoints[1].elevationMeter ?? 0, 762, 0);
    assertEqualsRounded(pln.waypoints[2].elevationMeter ?? 0, 762, 0);
    assert.equal(pln.cruisingAltFt, 2500);
  });

  it("should parse EFMA-lnavmap.pln correctly", () => {
    const pln = new MsfsPln(fs.readFileSync("./src/Tests/fixtures/EFMA-lnavmap.pln", "utf8"));
    assert.equal(pln.waypoints.length, 11);
    assert.equal(pln.waypoints[0].identifier, "EFMA");
    assert.equal(pln.waypoints[0].type, "AIRPORT");
    assert.equal(pln.waypoints[1].type, "USER WAYPOINT");
    assert.equal(pln.waypoints[3].identifier, "RATSO");
    assert.equal(pln.waypoints[3].countryCode, "EF");
    assert.equal(pln.waypoints[4].type, "VOR");
    assert.equal(pln.waypoints[5].type, "NDB");
    assertEqualsRounded(pln.waypoints[1].elevationMeter ?? 0, 68.22, 2);
    assert.equal(pln.cruisingAltFt, 2500);

    // Convert FMS to Mission
    const mission = new Mission("", "").fromGarminFpl(pln);
    assert.equal(mission.checkpoints.length, 11);
    assert.equal(mission.flight_setting, Mission.FLIGHT_SETTING_TAXI);
    assert.equal(mission.checkpoints[0].type, MissionCheckpoint.TYPE_ORIGIN);
    assert.equal(mission.checkpoints[0].icao_region, "EF");
    assert.equal(mission.checkpoints[1].type, MissionCheckpoint.TYPE_DEPARTURE_RUNWAY);
    assert.equal(mission.checkpoints[9].type, MissionCheckpoint.TYPE_DESTINATION_RUNWAY);
    assert.equal(mission.checkpoints[10].type, MissionCheckpoint.TYPE_DESTINATION);
    assert.equal(mission.checkpoints[10].icao_region, "EF");

    // Export Mission to XML
    const exportPln = new MsfsPlnExport(mission);
    assert.notEqual(exportPln.toString(), "", "Not empty flight plan");

    const exportPln2 = new Msfs2024Export(mission);
    assert.notEqual(exportPln2.toString(), "", "Not empty flight plan");
  });

  it("should parse ENHD_local_flight.pln correctly", () => {
    const pln = new MsfsPln(fs.readFileSync("./src/Tests/fixtures/ENHD_local_flight.pln", "utf8"));

    assert.equal(pln.departureRunway, "13");
    assert.equal(pln.destinationRunway, "31");

    const mission = new Mission("", "").fromGarminFpl(pln);
    assert.equal(mission.checkpoints.length, 9);
  });
});
