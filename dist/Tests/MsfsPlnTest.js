import { Test } from "../Cli/Test.js";
import { MsfsPlnExport, MsfsPln } from "../Import/MsfsPln.js";
import * as fs from "node:fs";
import { Mission } from "../Aerofly/Mission.js";
import { MissionCheckpoint } from "../Aerofly/MissionCheckpoint.js";
export class MsfsPlnTest extends Test {
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
        // Parse PLN
        const pln = new MsfsPln(fs.readFileSync("./src/Tests/cases/EGOV.pln", "utf8"));
        this.group(MsfsPln.name);
        {
            this.assertEquals(pln.waypoints.length, 16);
            this.assertEquals(pln.waypoints[0].identifier, "EGOV");
            this.assertEquals(pln.waypoints[0].type, "AIRPORT");
            this.assertEquals(pln.waypoints[1].type, "USER WAYPOINT");
            this.assertEquals(pln.waypoints[1].lat, 52.717475);
            this.assertEquals(pln.waypoints[1].alt, 2500);
            this.assertEqualsRounded(pln.waypoints[1].lon, -4.05834167, 8);
            this.assertEquals(pln.cruisingAlt, 2500);
            this.assertEquals(pln.departureRunway, undefined);
            this.assertEquals(pln.destinationRunway, undefined);
        }
        // Convert PLN to Mission
        const mission = new Mission("", "").fromGarminFpl(pln);
        this.group(MsfsPln.name + ": Mission conversion");
        {
            this.assertEquals(mission.checkpoints.length, 16);
            this.assertEquals(mission.flight_setting, Mission.FLIGHT_SETTING_TAXI);
        }
        // Export Mission to XML
        const exportPln = new MsfsPlnExport(mission);
        //console.log(exportPln.toString());
        // Reimport XML to PLN
        const secondPln = new MsfsPln(exportPln.toString());
        this.group(MsfsPlnExport.name);
        {
            this.assertEquals(secondPln.waypoints.length, pln.waypoints.length);
            secondPln.waypoints.forEach((wp, index) => {
                this.assertEquals(wp.identifier, pln.waypoints[index].identifier);
                this.assertEquals(wp.type, pln.waypoints[index].type);
                this.assertEquals(wp.lat, pln.waypoints[index].lat);
                this.assertEquals(wp.lon, pln.waypoints[index].lon);
            });
            this.assertEquals(secondPln.cruisingAlt, pln.cruisingAlt);
        }
    }
    testLittleNavMap() {
        this.group(MsfsPln.name + ": Little Nav Map");
        {
            const pln = new MsfsPln(fs.readFileSync("./src/Tests/cases/egov-lnavmap.pln", "utf8"));
            this.assertEquals(pln.waypoints.length, 16);
            this.assertEquals(pln.waypoints[0].identifier, "EGOV");
            this.assertEquals(pln.waypoints[0].type, "AIRPORT");
            this.assertEquals(pln.waypoints[1].type, "USER WAYPOINT");
            this.assertEquals(pln.waypoints[1].alt, 2500);
            this.assertEquals(pln.waypoints[2].alt, 2500);
            this.assertEquals(pln.cruisingAlt, 2500);
        }
    }
    testGarminParse() {
        const pln = new MsfsPln(fs.readFileSync("./src/Tests/cases/EFMA-lnavmap.pln", "utf8"));
        this.group(MsfsPln.name + ": Little Nav Map to Mission");
        {
            this.assertEquals(pln.waypoints.length, 11);
            this.assertEquals(pln.waypoints[0].identifier, "EFMA");
            this.assertEquals(pln.waypoints[0].type, "AIRPORT");
            this.assertEquals(pln.waypoints[1].type, "USER WAYPOINT");
            this.assertEquals(pln.waypoints[4].type, "VOR");
            this.assertEquals(pln.waypoints[5].type, "NDB");
            this.assertEquals(pln.waypoints[1].alt, 17);
            this.assertEquals(pln.cruisingAlt, 2500);
        }
        // Convert FMS to Mission
        const mission = new Mission("", "").fromGarminFpl(pln);
        this.group(MsfsPln.name + ": Mission conversion");
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
        const pln = new MsfsPln(fs.readFileSync("./src/Tests/cases/ENHD_local_flight.pln", "utf8"));
        this.group(MsfsPln.name + ": Runway check");
        {
            this.assertEquals(pln.departureRunway, "13");
            this.assertEquals(pln.destinationRunway, "31");
            const mission = new Mission("", "").fromGarminFpl(pln);
            this.assertEquals(mission.checkpoints.length, 9);
        }
    }
}
