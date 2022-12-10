import { Test } from "../Cli/Test.js";
import { XplaneFms } from "../Import/XplaneFms.js";
import * as fs from "node:fs";
export class XplaneFmsTest extends Test {
    constructor(process) {
        super(process);
        this.group(XplaneFms.name);
        {
            const fms = new XplaneFms(fs.readFileSync('./src/Tests/EGCC-EDDF.fms', 'utf8'));
            this.assertEquals(fms.waypoins.length, 17);
            this.assertEquals(fms.waypoins[0].identifier, 'EGCC');
            this.assertEquals(fms.waypoins[0].type, 'AIRPORT');
            this.assertEquals(fms.waypoins[1].type, 'USER WAYPOINT');
            this.assertEquals(fms.waypoins[1].lat, 53.206400);
            this.assertEquals(fms.waypoins[1].lon, -0.861111);
            this.assertEquals(fms.cruisingAlt, 35000);
        }
    }
}
