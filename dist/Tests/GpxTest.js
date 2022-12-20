import { Test } from "../Cli/Test.js";
import { Gpx } from "../Import/Gpx.js";
import * as fs from "node:fs";
export class GpxTest extends Test {
    constructor(process) {
        super(process);
        this.group(Gpx.name);
        {
            const gpl = new Gpx(fs.readFileSync('./src/Tests/EGOV.gpx', 'utf8'));
            this.assertEquals(gpl.waypoins.length, 13);
            this.assertEquals(gpl.waypoins[0].identifier, 'EGOV');
            this.assertEquals(gpl.waypoins[0].type, 'AIRPORT');
            this.assertEquals(gpl.waypoins[1].type, 'USER WAYPOINT');
            this.assertEquals(gpl.waypoins[12].type, 'AIRPORT');
            this.assertEquals(gpl.waypoins[1].lat, 52.716667);
            this.assertEquals(gpl.waypoins[4].lon, -3.883333);
            this.assertEquals(gpl.cruisingAlt, 0);
        }
    }
}
