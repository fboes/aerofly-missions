import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

import { LonLat } from "../World/LonLat.js";
import { MissionCheckpoint } from "../Aerofly/MissionCheckpoint.js";

describe("MissionCheckpointTest test", () => {
  it("should handle properties correctly", () => {
    const missionCheckpoint = new MissionCheckpoint();
    assert.equal(missionCheckpoint.lon_lat.altitude_m, 0, "Altitude present");
    assert.equal(missionCheckpoint.direction, -1, "Direction present");
    assert.equal(missionCheckpoint.frequency, 0, "Frequency present");
    assert.ok(missionCheckpoint.lon_lat instanceof LonLat, "lon_lat has correct type");
    assert.equal(missionCheckpoint.slope, 0, "Slope present");

    missionCheckpoint.frequency_mhz = 108.2;
    assert.equal(missionCheckpoint.frequency_unit, "M");
    assert.equal(missionCheckpoint.frequency_mhz, 108.2);
    assert.equal(missionCheckpoint.frequency, 108200000);

    missionCheckpoint.frequency_khz = 260;
    assert.equal(missionCheckpoint.frequency_unit, "k");
    assert.equal(missionCheckpoint.frequency_khz, 260);
    assert.equal(missionCheckpoint.frequency, 260000);

    missionCheckpoint.frequency_khz = 1260;
    assert.equal(missionCheckpoint.frequency_unit, "k");
    assert.equal(missionCheckpoint.frequency_khz, 1260);
    assert.equal(missionCheckpoint.frequency, 1260000);
  });
});
