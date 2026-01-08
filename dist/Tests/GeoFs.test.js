import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { GeoFsExport, GeoFs } from "../Import/GeoFs.js";
import * as fs from "node:fs";
import { Mission } from "../Aerofly/Mission.js";
import { MainMcfFactory } from "../Aerofly/MainMcf.js";
describe("GeoFsTest test", () => {
    it("should import GeoFs correctly", () => {
        const geoFs = new GeoFs(fs.readFileSync("./src/Tests/fixtures/geofs-KSFO-KLAX.json", "utf8"));
        {
            assert.equal(geoFs.waypoints.length, 5);
            assert.equal(geoFs.waypoints[0].identifier, "KSFO");
            assert.equal(geoFs.waypoints[0].type, "AIRPORT");
            assert.equal(geoFs.waypoints[1].type, "VOR");
            assert.equal(geoFs.departureRunway, undefined);
            assert.equal(geoFs.destinationRunway, undefined);
        }
        // Convert PLN to Mission
        const mission = new Mission("", "").fromGarminFpl(geoFs);
        {
            assert.equal(mission.checkpoints.length, 5);
            assert.equal(mission.flight_setting, Mission.FLIGHT_SETTING_TAXI);
        }
        // Export Mission to JSON
        const exportPln = new GeoFsExport(mission);
        {
            const json = exportPln.toJSON();
            assert.equal(json.length, 5);
            assert.equal(json[0].ident, "KSFO");
            assert.equal(json[0].type, "DPT");
            assert.equal(json[1].type, "VOR");
            assert.equal(json[4].type, "DST");
        }
    });
    it("should import GeoFs from SimBrief correctly", () => {
        const geoFs = new GeoFs(fs.readFileSync("./src/Tests/fixtures/geofs-simbrief.json", "utf8"));
        {
            assert.equal(geoFs.waypoints.length, 20);
            assert.equal(geoFs.waypoints[0].identifier, "EDDH");
            assert.equal(geoFs.waypoints[0].type, "AIRPORT");
            assert.equal(geoFs.waypoints[1].type, "USER WAYPOINT");
            assert.equal(geoFs.departureRunway, undefined);
            assert.equal(geoFs.destinationRunway, undefined);
        }
        // Convert PLN to Mission
        const mission = new Mission("", "").fromGarminFpl(geoFs);
        {
            assert.equal(mission.checkpoints.length, 20);
            assert.equal(mission.flight_setting, Mission.FLIGHT_SETTING_TAXI);
        }
        // Export Mission to JSON
        const exportPln = new GeoFsExport(mission);
        {
            const json = exportPln.toJSON();
            //console.log(json);
            assert.equal(json.length, 20);
            assert.equal(json[0].ident, "EDDH");
            assert.equal(json[0].type, "DPT");
            assert.equal(json[1].ident, "DH100");
            assert.equal(json[1].type, "FIX");
            assert.equal(json[3].ident, "WSN");
            assert.equal(json[3].type, "VOR");
            assert.equal(json[4].ident, "SIMAF");
            assert.equal(json[4].type, "WPT");
            assert.equal(json[19].ident, "EGLC");
            assert.equal(json[19].type, "DST");
        }
    });
    it("should import GeoFs from MainMcf correctly", () => {
        {
            const mainMcf = new MainMcfFactory().create(fs.readFileSync("./src/Tests/fixtures/main.mcf", "utf8"));
            const mission = new Mission("", "");
            mission.fromMainMcf(mainMcf);
            mission.origin_dir = 270;
            mission.destination_dir = 180;
            // Export Mission to JSON
            const exportPln = new GeoFsExport(mission);
            const json = exportPln.toJSON();
            //console.log(JSON.stringify(json));
            assert.equal(json.length, 5);
            assert.equal(json[0].ident, "EGGP");
            assert.equal(json[0].type, "DPT");
            assert.equal(json[0].heading, 270);
            assert.equal(json[1].type, "RNW");
            assert.equal(json[4].type, "DST");
            assert.equal(json[4].heading, 180);
        }
    });
});
