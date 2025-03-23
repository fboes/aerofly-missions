import { Mission } from "../Aerofly/Mission.js";
import { Test } from "../Cli/Test.js";
import { GarminExport, GarminFpl } from "../Import/GarminFpl.js";
import * as fs from "node:fs";
export class GarminFplTest extends Test {
    constructor(process, dieOnError = false) {
        super(process, dieOnError);
        this.process = process;
        this.dieOnError = dieOnError;
        this.testKbli();
        this.testKlas();
    }
    testKbli() {
        const gpl = new GarminFpl(fs.readFileSync("./src/Tests/fixtures/KBLI.fpl", "utf8"));
        this.group(GarminFpl.name);
        {
            this.assertEquals(gpl.waypoints.length, 5);
            this.assertEquals(gpl.waypoints[0].identifier, "KCLM");
            this.assertEquals(gpl.waypoints[0].type, "AIRPORT");
            this.assertEquals(gpl.waypoints[0].countryCode, "K1");
            this.assertEquals(gpl.waypoints[1].type, "USER WAYPOINT");
            this.assertEquals(gpl.waypoints[2].type, "VOR");
            this.assertEquals(gpl.waypoints[2].countryCode, "K1");
            this.assertEquals(gpl.waypoints[3].type, "NDB");
            this.assertEquals(gpl.waypoints[1].lat, 48.26409);
            this.assertEquals(gpl.waypoints[4].lon, -122.537528);
            this.assertEquals(gpl.waypoints[4].alt, undefined);
            this.assertEquals(gpl.cruisingAlt, undefined);
            this.assertEquals(gpl.departureRunway, undefined);
            this.assertEquals(gpl.destinationRunway, undefined);
        }
        // Convert FPL to Mission
        const mission = new Mission("", "").fromGarminFpl(gpl);
        this.group(GarminFpl.name + ": Mission conversion");
        {
            this.assertEquals(mission.checkpoints.length, 5);
            this.assertEquals(mission.flight_setting, Mission.FLIGHT_SETTING_TAXI);
        }
        // Export Mission to XMl
        const exportPln = new GarminExport(mission);
        this.group(GarminExport.name + ": Re-export");
        {
            const string = exportPln.toString();
            this.assert(string !== "", "XML not empty");
        }
    }
    testKlas() {
        const gpl = new GarminFpl(fs.readFileSync("./src/Tests/fixtures/KLAS.fpl", "utf8"));
        this.group(GarminFpl.name);
        {
            this.assertEquals(gpl.waypoints.length, 6);
            this.assertEquals(gpl.waypoints[0].identifier, "KLAS");
            this.assertEquals(gpl.waypoints[0].type, "AIRPORT");
            this.assertEquals(gpl.waypoints[0].countryCode, "K2");
            this.assertEquals(gpl.waypoints[1].identifier, "BLD");
            this.assertEquals(gpl.waypoints[1].type, "VOR");
            this.assertEquals(gpl.waypoints[1].countryCode, "K2");
            this.assertEquals(gpl.waypoints[2].identifier, "MEADS");
            this.assertEquals(gpl.waypoints[2].type, "INT");
            this.assertEquals(gpl.waypoints[2].countryCode, "K2");
            this.assertEquals(gpl.waypoints[3].identifier, "0L9");
            this.assertEquals(gpl.waypoints[3].type, "AIRPORT");
            this.assertEquals(gpl.waypoints[3].countryCode, "K2");
            this.assertEquals(gpl.waypoints[4].identifier, "SV001");
            this.assertEquals(gpl.waypoints[4].type, "USER WAYPOINT");
            this.assertEquals(gpl.waypoints[4].countryCode, undefined);
            this.assertEquals(gpl.waypoints[5].identifier, "KLAS");
            this.assertEquals(gpl.waypoints[5].type, "AIRPORT");
            this.assertEquals(gpl.waypoints[5].countryCode, "K2");
        }
        // Convert FPL to Mission
        const mission = new Mission("", "").fromGarminFpl(gpl);
        this.group(GarminFpl.name + ": Mission conversion");
        {
            this.assertEquals(mission.checkpoints.length, 6);
            this.assertEquals(mission.checkpoints[0].name, "KLAS");
            this.assertEquals(mission.checkpoints[0].type, "origin");
            this.assertEquals(mission.checkpoints[0].icao_region, "K2");
            this.assertEquals(mission.checkpoints[1].name, "BLD");
            this.assertEquals(mission.checkpoints[1].type, "waypoint");
            this.assertEquals(mission.checkpoints[1].icao_region, "K2");
            this.assertEquals(mission.checkpoints[2].name, "MEADS");
            this.assertEquals(mission.checkpoints[2].type, "waypoint");
            this.assertEquals(mission.checkpoints[2].icao_region, "K2");
            this.assertEquals(mission.checkpoints[3].name, "0L9");
            this.assertEquals(mission.checkpoints[3].type, "waypoint");
            this.assertEquals(mission.checkpoints[3].icao_region, "K2");
            this.assertEquals(mission.checkpoints[4].name, "SV001");
            this.assertEquals(mission.checkpoints[4].type, "waypoint");
            this.assertEquals(mission.checkpoints[4].icao_region, null);
            this.assertEquals(mission.checkpoints[5].name, "KLAS");
            this.assertEquals(mission.checkpoints[5].type, "destination");
            this.assertEquals(mission.checkpoints[5].icao_region, "K2");
            this.assertEquals(mission.origin_icao, "KLAS");
            this.assertEquals(mission.destination_icao, "KLAS");
            this.assertEquals(mission.flight_setting, Mission.FLIGHT_SETTING_TAXI);
        }
        // Export Mission to XMl
        const exportPln = new GarminExport(mission);
        this.group(GarminExport.name + ": Re-export");
        {
            const string = exportPln.toString();
            //console.log(string);
            this.assert(string !== "", "XML not empty");
            this.assertEquals((string.match(/<identifier>/g) || []).length, 5);
            this.assertEquals((string.match(/<country-code>K2<\/country-code>/g) || []).length, 4);
            this.assertEquals((string.match(/<waypoint-identifier>/g) || []).length, 6);
            this.assertEquals((string.match(/<waypoint-country-code>K2<\/waypoint-country-code>/g) || []).length, 5);
        }
    }
}
