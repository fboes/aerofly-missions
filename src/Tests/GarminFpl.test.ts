import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { assertEqualsRounded } from "../Cli/Test.js";

import { Mission } from "../Aerofly/Mission.js";
import { GarminExport, GarminFpl } from "../Import/GarminFpl.js";
import * as fs from "node:fs";

describe("GarminFpl Tests", () => {
  it("should parse KBLI.fpl correctly", () => {
    const gpl = new GarminFpl(fs.readFileSync("./src/Tests/fixtures/KBLI.fpl", "utf8"));

    assert.equal(gpl.waypoints.length, 5);
    assert.equal(gpl.waypoints[0].identifier, "KCLM");
    assert.equal(gpl.waypoints[0].type, "AIRPORT");
    assert.equal(gpl.waypoints[0].countryCode, "K1");
    assert.equal(gpl.waypoints[1].type, "USER WAYPOINT");
    assert.equal(gpl.waypoints[2].type, "VOR");
    assert.equal(gpl.waypoints[2].countryCode, "K1");
    assert.equal(gpl.waypoints[3].type, "NDB");
    assert.equal(gpl.waypoints[1].lat, 48.26409);
    assert.equal(gpl.waypoints[4].lon, -122.537528);
    assert.equal(gpl.waypoints[4].elevationMeter, undefined);
    assert.equal(gpl.cruisingAltFt, undefined);
    assert.equal(gpl.departureRunway, undefined);
    assert.equal(gpl.destinationRunway, undefined);

    // Convert FPL to Mission
    const mission = new Mission("", "").fromGarminFpl(gpl);

    assert.equal(mission.checkpoints.length, 5);
    assert.equal(mission.flight_setting, Mission.FLIGHT_SETTING_TAXI);
    assertEqualsRounded(mission.origin_dir, 62.5, 1);

    // Export Mission to XMl
    const exportPln = new GarminExport(mission);

    const string = exportPln.toString();
    assert.notEqual(string, "", "XML not empty");
  });

  it("should parse KLAS.fpl correctly", () => {
    const gpl = new GarminFpl(fs.readFileSync("./src/Tests/fixtures/KLAS.fpl", "utf8"));

    {
      assert.equal(gpl.waypoints.length, 6);
      assert.equal(gpl.waypoints[0].identifier, "KLAS");
      assert.equal(gpl.waypoints[0].type, "AIRPORT");
      assert.equal(gpl.waypoints[0].countryCode, "K2");

      assert.equal(gpl.waypoints[1].identifier, "BLD");
      assert.equal(gpl.waypoints[1].type, "VOR");
      assert.equal(gpl.waypoints[1].countryCode, "K2");

      assert.equal(gpl.waypoints[2].identifier, "MEADS");
      assert.equal(gpl.waypoints[2].type, "INT");
      assert.equal(gpl.waypoints[2].countryCode, "K2");

      assert.equal(gpl.waypoints[3].identifier, "0L9");
      assert.equal(gpl.waypoints[3].type, "AIRPORT");
      assert.equal(gpl.waypoints[3].countryCode, "K2");

      assert.equal(gpl.waypoints[4].identifier, "SV001");
      assert.equal(gpl.waypoints[4].type, "USER WAYPOINT");
      assert.equal(gpl.waypoints[4].countryCode, undefined);

      assert.equal(gpl.waypoints[5].identifier, "KLAS");
      assert.equal(gpl.waypoints[5].type, "AIRPORT");
      assert.equal(gpl.waypoints[5].countryCode, "K2");
    }

    // Convert FPL to Mission
    const mission = new Mission("", "").fromGarminFpl(gpl);
    {
      assert.equal(mission.checkpoints.length, 6);

      assert.equal(mission.checkpoints[0].name, "KLAS");
      assert.equal(mission.checkpoints[0].type, "origin");
      assert.equal(mission.checkpoints[0].icao_region, "K2");

      assert.equal(mission.checkpoints[1].name, "BLD");
      assert.equal(mission.checkpoints[1].type, "waypoint");
      assert.equal(mission.checkpoints[1].icao_region, "K2");

      assert.equal(mission.checkpoints[2].name, "MEADS");
      assert.equal(mission.checkpoints[2].type, "waypoint");
      assert.equal(mission.checkpoints[2].icao_region, "K2");

      assert.equal(mission.checkpoints[3].name, "0L9");
      assert.equal(mission.checkpoints[3].type, "waypoint");
      assert.equal(mission.checkpoints[3].icao_region, "K2");

      assert.equal(mission.checkpoints[4].name, "SV001");
      assert.equal(mission.checkpoints[4].type, "waypoint");
      assert.equal(mission.checkpoints[4].icao_region, null);

      assert.equal(mission.checkpoints[5].name, "KLAS");
      assert.equal(mission.checkpoints[5].type, "destination");
      assert.equal(mission.checkpoints[5].icao_region, "K2");

      assert.equal(mission.origin_icao, "KLAS");
      assert.equal(mission.destination_icao, "KLAS");
      assert.equal(mission.flight_setting, Mission.FLIGHT_SETTING_TAXI);
    }

    // Export Mission to XMl
    const exportPln = new GarminExport(mission);
    {
      const string = exportPln.toString();
      //console.log(string);
      assert.notEqual(string, "", "XML not empty");
      assert.equal(string.match(/<identifier>/g)?.length, 5);
      assert.equal(string.match(/<country-code>K2<\/country-code>/g)?.length, 4);
      assert.equal(string.match(/<waypoint-identifier>/g)?.length, 6);
      assert.equal(string.match(/<waypoint-country-code>K2<\/waypoint-country-code>/g)?.length, 5);
    }
  });
});
