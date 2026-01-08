import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { assertEqualsRounded } from "../Cli/Test.js";
import { XplaneFms, XplaneFmsExport } from "../Import/XplaneFms.js";
import * as fs from "node:fs";
import { Mission } from "../Aerofly/Mission.js";
import { MissionCheckpoint } from "../Aerofly/MissionCheckpoint.js";
import { Units } from "../World/Units.js";
describe(XplaneFms.name, () => {
    it("should parse EGCC-EDDF.fms", () => {
        const fms = new XplaneFms(fs.readFileSync("./src/Tests/fixtures/EGCC-EDDF.fms", "utf8"));
        {
            assert.equal(fms.waypoints.length, 17);
            assert.equal(fms.waypoints[0].identifier, "EGCC");
            assert.equal(fms.waypoints[0].type, "AIRPORT");
            assert.equal(fms.waypoints[1].type, "USER WAYPOINT");
            assert.equal(fms.waypoints[1].lat, 53.2064);
            assert.equal(fms.waypoints[1].lon, -0.861111);
            assert.equal(fms.waypoints[1].elevationMeter, 18400 / Units.feetPerMeter);
            assert.equal(fms.waypoints[2].elevationMeter, 35000 / Units.feetPerMeter);
            assert.equal(fms.cruisingAltFt, 35000);
            assert.equal(fms.departureRunway, undefined);
            assert.equal(fms.destinationRunway, undefined);
        }
        // Convert FMS to Mission
        const mission = new Mission("", "").fromGarminFpl(fms);
        {
            assert.equal(mission.checkpoints.length, 17);
            assert.equal(mission.flight_setting, Mission.FLIGHT_SETTING_TAXI);
        }
        // Export Mission to FMS
        const exportFms = new XplaneFmsExport(mission);
        //console.log(exportFms.toString());
        // Reimport XML to PLN
        const secondFms = new XplaneFms(exportFms.toString());
        {
            assert.equal(secondFms.waypoints.length, fms.waypoints.length);
            assert.equal(secondFms.waypoints[0].identifier, fms.waypoints[0].identifier);
            assert.equal(secondFms.waypoints[16].identifier, fms.waypoints[16].identifier);
            secondFms.waypoints.forEach((wp, index) => {
                if (fms.waypoints[index].type !== "NDB") {
                    assert.equal(wp.type, fms.waypoints[index].type);
                }
                assert.equal(wp.lat, fms.waypoints[index].lat);
                assert.equal(wp.lon, fms.waypoints[index].lon);
            });
            assert.equal(secondFms.cruisingAltFt, fms.cruisingAltFt);
        }
    });
    it("should parse egov-lnavmap.fms", () => {
        var _a, _b;
        {
            const fms = new XplaneFms(fs.readFileSync("./src/Tests/fixtures/egov-lnavmap.fms", "utf8"));
            assert.equal(fms.waypoints.length, 16);
            assert.equal(fms.waypoints[0].identifier, "EGOV");
            assert.equal(fms.waypoints[0].type, "AIRPORT");
            assert.equal(fms.waypoints[1].type, "USER WAYPOINT");
            assertEqualsRounded((_a = fms.waypoints[1].elevationMeter) !== null && _a !== void 0 ? _a : 0, 762, 0);
            assertEqualsRounded((_b = fms.waypoints[2].elevationMeter) !== null && _b !== void 0 ? _b : 0, 762, 0);
            assert.equal(fms.cruisingAltFt, 2500);
        }
    });
    it("should parse EFMA-lnavmap.fms", () => {
        var _a;
        const fms = new XplaneFms(fs.readFileSync("./src/Tests/fixtures/EFMA-lnavmap.fms", "utf8"));
        {
            assert.equal(fms.waypoints.length, 11);
            assert.equal(fms.waypoints[0].identifier, "EFMA");
            assert.equal(fms.waypoints[0].type, "AIRPORT");
            assert.equal(fms.waypoints[1].type, "USER WAYPOINT");
            assert.equal(fms.waypoints[4].type, "VOR");
            assert.equal(fms.waypoints[5].type, "NDB");
            assertEqualsRounded((_a = fms.waypoints[1].elevationMeter) !== null && _a !== void 0 ? _a : 0, 68.22, 2);
            assert.equal(fms.cruisingAltFt, 2500);
        }
        // Convert FMS to Mission
        const mission = new Mission("", "").fromGarminFpl(fms);
        {
            assert.equal(mission.checkpoints.length, 11);
            assert.equal(mission.flight_setting, Mission.FLIGHT_SETTING_TAXI);
            assert.equal(mission.checkpoints[0].type, MissionCheckpoint.TYPE_ORIGIN);
            assert.equal(mission.checkpoints[1].type, MissionCheckpoint.TYPE_DEPARTURE_RUNWAY);
            assert.equal(mission.checkpoints[9].type, MissionCheckpoint.TYPE_DESTINATION_RUNWAY);
            assert.equal(mission.checkpoints[10].type, MissionCheckpoint.TYPE_DESTINATION);
        }
    });
    it("should parse ENHD_local_flight.fms and check runways", () => {
        const pln = new XplaneFms(fs.readFileSync("./src/Tests/fixtures/ENHD_local_flight.fms", "utf8"));
        {
            assert.equal(pln.departureRunway, "13");
            assert.equal(pln.destinationRunway, "31");
            const mission = new Mission("", "").fromGarminFpl(pln);
            assert.equal(mission.checkpoints.length, 9);
        }
    });
});
