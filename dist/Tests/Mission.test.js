import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { LonLat } from "../World/LonLat.js";
import { Mission, MissionFactory } from "../Aerofly/Mission.js";
import * as fs from "node:fs";
describe("MissionTest test", () => {
    it("should handle properties correctly", () => {
        const mission = new Mission("a", "b");
        assert.equal(mission.title, "a");
        assert.equal(mission.description, "b");
        mission.aircraft_name = "PITTS";
        assert.equal(mission.aircraft_name, "pitts");
        assert.equal(mission.aircraft_icao, "PTS2");
        assert.ok(mission.origin_lon_lat instanceof LonLat, "origin_lon_lat has correct type");
        assert.ok(mission.destination_lon_lat instanceof LonLat, "destination_lon_lat has correct type");
        mission.aircraft_icao = "A388";
        assert.equal(mission.aircraft_icao, "A388");
    });
    it("should handle warnings correctly", () => {
        const mission = new Mission("a".repeat(64), "b".repeat(500));
        assert.equal(mission.warnings.length, 2, "Throwing warnings");
        const mission2 = new Mission("a".repeat(32), "b".repeat(200));
        assert.equal(mission2.warnings.length, 0, "Not throwing warnings");
        const mission3 = new Mission("a".repeat(32), "b\n".repeat(10));
        assert.equal(mission3.warnings.length, 1, "Not throwing warnings");
    });
    it("should export to string correctly", () => {
        const mission = new Mission("a", "b");
        mission.no_guides = true;
        mission.origin_dir = 100;
        assert.ok(mission.no_guides, "no_guides is set to true");
        const missionsString = mission.toString();
        assert.ok(missionsString.includes("finish"), "finish is included in toString output");
        assert.ok(missionsString.includes("tmmission_target_plane"), "finish is included in toString output");
    });
    it("should load from TMC file correctly", () => {
        const mission = new MissionFactory().create(fs.readFileSync("./src/Tests/fixtures/kclm_kbli.tmc", "utf8"), new Mission("", ""));
        assert.equal(mission.title, "From KCLM to KBLI");
        assert.equal(mission.flight_setting, "taxi");
        assert.equal(mission.origin_lon_lat.lon, -123.499694);
        assert.equal(mission.origin_lon_lat.lat, 48.121194);
        assert.equal(mission.conditions.time.time_year, 2022);
        assert.equal(mission.conditions.turbulence_strength, 0.6595469187953649);
        assert.equal(mission.checkpoints.length, 5);
        assert.equal(mission.checkpoints[4].name, "KBLI");
        assert.equal(mission.checkpoints[1].lon_lat.altitude_m, 1676.3999463552018);
        //console.log(mission.toString());
    });
});
