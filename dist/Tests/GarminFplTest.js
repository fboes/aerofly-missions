import { Test } from "../Cli/Test.js";
import { GarminFpl } from "../Import/GarminFpl.js";
import * as fs from "node:fs";
export class GarminFplTest extends Test {
    constructor(process) {
        super(process);
        this.group(GarminFpl.name);
        {
            const gpl = new GarminFpl(fs.readFileSync('./src/Tests/KBLI.fpl', 'utf8'));
            this.assertEquals(gpl.waypoins.length, 5);
            this.assertEquals(gpl.waypoins[0].identifier, 'KCLM');
            this.assertEquals(gpl.waypoins[0].type, 'AIRPORT');
            this.assertEquals(gpl.waypoins[1].type, 'USER WAYPOINT');
            this.assertEquals(gpl.waypoins[2].type, 'VOR');
            this.assertEquals(gpl.waypoins[3].type, 'NDB');
            this.assertEquals(gpl.waypoins[1].lat, 48.26409);
            this.assertEquals(gpl.waypoins[4].lon, -122.537528);
            this.assertEquals(gpl.cruisingAlt, 0);
        }
    }
}
