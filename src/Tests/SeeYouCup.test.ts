import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { assertEqualsRounded } from "../Cli/Test.js";

import { Mission } from "../Aerofly/Mission.js";
import { SeeYouCup } from "../Import/SeeYouCup.js";
import * as fs from "node:fs";

describe("SeeYouCupTest test", () => {
  it("should parse SeeYouCup file correctly", () => {
    const pln = new SeeYouCup(fs.readFileSync("./src/Tests/fixtures/seeyou-tasks.cup", "utf8"));
    assert.equal(pln.waypoints.length, 5);
    assert.equal(pln.waypoints[0].identifier, "MARCELMA");
    assert.equal(pln.waypoints[0].type, "USER WAYPOINT");
    assertEqualsRounded(pln.waypoints[0].lat, -41.4577, 4);
    assertEqualsRounded(pln.waypoints[0].lon, -72.9186, 4);
    assert.equal(pln.waypoints[0].elevationMeter, 115);
    assert.equal(pln.waypoints[1].identifier, "VOLC_NCA");
    assert.equal(pln.waypoints[1].type, "USER WAYPOINT");
    assert.equal(pln.cruisingAltFt, undefined);
    assert.equal(pln.departureRunway, undefined);
    assert.equal(pln.destinationRunway, undefined);

    // Convert PLN to Mission
    const mission = new Mission("", "").fromGarminFpl(pln);
    assert.equal(mission.checkpoints.length, 5);
    assert.equal(
      mission.flight_setting,
      Mission.FLIGHT_SETTING_CRUISE,
      "Missions without airport start in cruise mode"
    );
    assertEqualsRounded(mission.origin_dir, 61.2, 1);
  });
});
