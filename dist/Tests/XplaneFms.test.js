import { Test } from "../Cli/Test.js";
import { XplaneFms, XplaneFmsExport } from "../Import/XplaneFms.js";
import * as fs from "node:fs";
import { Mission } from "../Aerofly/Mission.js";
import { MissionCheckpoint } from "../Aerofly/MissionCheckpoint.js";
import { Units } from "../World/Units.js";
export class XplaneFmsTest extends Test {
    constructor(process, dieOnError = false) {
        super(process, dieOnError);
        this.process = process;
        this.dieOnError = dieOnError;
        this.testEGOV();
        this.testLittleNavMap();
        this.testGarminParse();
        this.testRunway();
    }
    testEGOV() {
        const fms = new XplaneFms(fs.readFileSync("./src/Tests/fixtures/EGCC-EDDF.fms", "utf8"));
        this.group(XplaneFms.name);
        {
            this.assertEquals(fms.waypoints.length, 17);
            this.assertEquals(fms.waypoints[0].identifier, "EGCC");
            this.assertEquals(fms.waypoints[0].type, "AIRPORT");
            this.assertEquals(fms.waypoints[1].type, "USER WAYPOINT");
            this.assertEquals(fms.waypoints[1].lat, 53.2064);
            this.assertEquals(fms.waypoints[1].lon, -0.861111);
            this.assertEquals(fms.waypoints[1].elevationMeter, 18400 / Units.feetPerMeter);
            this.assertEquals(fms.waypoints[2].elevationMeter, 35000 / Units.feetPerMeter);
            this.assertEquals(fms.cruisingAltFt, 35000);
            this.assertEquals(fms.departureRunway, undefined);
            this.assertEquals(fms.destinationRunway, undefined);
        }
        // Convert FMS to Mission
        const mission = new Mission("", "").fromGarminFpl(fms);
        this.group(XplaneFms.name + ": Mission conversion");
        {
            this.assertEquals(mission.checkpoints.length, 17);
            this.assertEquals(mission.flight_setting, Mission.FLIGHT_SETTING_TAXI);
        }
        // Export Mission to FMS
        const exportFms = new XplaneFmsExport(mission);
        //console.log(exportFms.toString());
        // Reimport XML to PLN
        const secondFms = new XplaneFms(exportFms.toString());
        this.group(XplaneFmsExport.name);
        {
            this.assertEquals(secondFms.waypoints.length, fms.waypoints.length);
            this.assertEquals(secondFms.waypoints[0].identifier, fms.waypoints[0].identifier);
            this.assertEquals(secondFms.waypoints[16].identifier, fms.waypoints[16].identifier);
            secondFms.waypoints.forEach((wp, index) => {
                if (fms.waypoints[index].type !== "NDB") {
                    this.assertEquals(wp.type, fms.waypoints[index].type);
                }
                this.assertEquals(wp.lat, fms.waypoints[index].lat);
                this.assertEquals(wp.lon, fms.waypoints[index].lon);
            });
            this.assertEquals(secondFms.cruisingAltFt, fms.cruisingAltFt);
        }
    }
    testLittleNavMap() {
        var _a, _b;
        this.group(XplaneFms.name + ": Little Nav Map");
        {
            const fms = new XplaneFms(fs.readFileSync("./src/Tests/fixtures/egov-lnavmap.fms", "utf8"));
            this.assertEquals(fms.waypoints.length, 16);
            this.assertEquals(fms.waypoints[0].identifier, "EGOV");
            this.assertEquals(fms.waypoints[0].type, "AIRPORT");
            this.assertEquals(fms.waypoints[1].type, "USER WAYPOINT");
            this.assertEqualsRounded((_a = fms.waypoints[1].elevationMeter) !== null && _a !== void 0 ? _a : 0, 762, 0);
            this.assertEqualsRounded((_b = fms.waypoints[2].elevationMeter) !== null && _b !== void 0 ? _b : 0, 762, 0);
            this.assertEquals(fms.cruisingAltFt, 2500);
        }
    }
    testGarminParse() {
        var _a;
        const fms = new XplaneFms(fs.readFileSync("./src/Tests/fixtures/EFMA-lnavmap.fms", "utf8"));
        this.group(XplaneFms.name + ": Little Nav Map to Mission");
        {
            this.assertEquals(fms.waypoints.length, 11);
            this.assertEquals(fms.waypoints[0].identifier, "EFMA");
            this.assertEquals(fms.waypoints[0].type, "AIRPORT");
            this.assertEquals(fms.waypoints[1].type, "USER WAYPOINT");
            this.assertEquals(fms.waypoints[4].type, "VOR");
            this.assertEquals(fms.waypoints[5].type, "NDB");
            this.assertEqualsRounded((_a = fms.waypoints[1].elevationMeter) !== null && _a !== void 0 ? _a : 0, 68.22, 2);
            this.assertEquals(fms.cruisingAltFt, 2500);
        }
        // Convert FMS to Mission
        const mission = new Mission("", "").fromGarminFpl(fms);
        this.group(XplaneFms.name + ": Mission conversion");
        {
            this.assertEquals(mission.checkpoints.length, 11);
            this.assertEquals(mission.flight_setting, Mission.FLIGHT_SETTING_TAXI);
            this.assertEquals(mission.checkpoints[0].type, MissionCheckpoint.TYPE_ORIGIN);
            this.assertEquals(mission.checkpoints[1].type, MissionCheckpoint.TYPE_DEPARTURE_RUNWAY);
            this.assertEquals(mission.checkpoints[9].type, MissionCheckpoint.TYPE_DESTINATION_RUNWAY);
            this.assertEquals(mission.checkpoints[10].type, MissionCheckpoint.TYPE_DESTINATION);
        }
    }
    testRunway() {
        const pln = new XplaneFms(fs.readFileSync("./src/Tests/fixtures/ENHD_local_flight.fms", "utf8"));
        this.group(XplaneFms.name + ": Runway check");
        {
            this.assertEquals(pln.departureRunway, "13");
            this.assertEquals(pln.destinationRunway, "31");
            const mission = new Mission("", "").fromGarminFpl(pln);
            this.assertEquals(mission.checkpoints.length, 9);
        }
    }
}
