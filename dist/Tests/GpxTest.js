import { Test } from "../Cli/Test.js";
import { Gpx } from "../Import/Gpx.js";
import * as fs from "node:fs";
export class GpxTest extends Test {
    constructor(process, dieOnError = false) {
        super(process, dieOnError);
        this.process = process;
        this.dieOnError = dieOnError;
        this.group(Gpx.name);
        {
            const gpl = new Gpx(fs.readFileSync("./src/Tests/cases/EGOV.gpx", "utf8"));
            this.assertEquals(gpl.waypoints.length, 13);
            this.assertEquals(gpl.waypoints[0].identifier, "EGOV");
            this.assertEquals(gpl.waypoints[0].type, "AIRPORT");
            this.assertEquals(gpl.waypoints[1].type, "USER WAYPOINT");
            this.assertEquals(gpl.waypoints[12].type, "AIRPORT");
            this.assertEquals(gpl.waypoints[1].lat, 52.716667);
            this.assertEquals(gpl.waypoints[4].lon, -3.883333);
            this.assertEquals(gpl.cruisingAlt, undefined);
        }
    }
}
