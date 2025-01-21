import { Test } from "../Cli/Test.js";
import { GarminFpl } from "../Import/GarminFpl.js";
import * as fs from "node:fs";
export class GarminFplTest extends Test {
    constructor(process, dieOnError = false) {
        super(process, dieOnError);
        this.process = process;
        this.dieOnError = dieOnError;
        this.group(GarminFpl.name);
        {
            const gpl = new GarminFpl(fs.readFileSync("./src/Tests/fixtures/KBLI.fpl", "utf8"));
            this.assertEquals(gpl.waypoints.length, 5);
            this.assertEquals(gpl.waypoints[0].identifier, "KCLM");
            this.assertEquals(gpl.waypoints[0].type, "AIRPORT");
            this.assertEquals(gpl.waypoints[1].type, "USER WAYPOINT");
            this.assertEquals(gpl.waypoints[2].type, "VOR");
            this.assertEquals(gpl.waypoints[3].type, "NDB");
            this.assertEquals(gpl.waypoints[1].lat, 48.26409);
            this.assertEquals(gpl.waypoints[4].lon, -122.537528);
            this.assertEquals(gpl.waypoints[4].alt, undefined);
            this.assertEquals(gpl.cruisingAlt, undefined);
            this.assertEquals(gpl.departureRunway, undefined);
            this.assertEquals(gpl.destinationRunway, undefined);
        }
    }
}
