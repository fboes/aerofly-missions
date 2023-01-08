import { Test } from "../Cli/Test.js";
import { MfsfPlnExport, MsfsPln } from "../Import/MsfsPln.js";
import * as fs from "node:fs";
import { Mission } from "../Aerofly/Mission.js";
export class MsfsPlnTest extends Test {
    constructor(process) {
        super(process);
        // Parse PLN
        const pln = new MsfsPln(fs.readFileSync('./src/Tests/EGOV.pln', 'utf8'));
        this.group(MsfsPln.name);
        {
            this.assertEquals(pln.waypoins.length, 16);
            this.assertEquals(pln.waypoins[0].identifier, 'EGOV');
            this.assertEquals(pln.waypoins[0].type, 'AIRPORT');
            this.assertEquals(pln.waypoins[1].type, 'USER WAYPOINT');
            this.assertEquals(pln.waypoins[1].lat, 52.717475);
            this.assertEquals(pln.waypoins[1].alt, 2500);
            this.assertEquals(pln.waypoins[1].lon.toFixed(8), '-4.05834167');
            this.assertEquals(pln.cruisingAlt, 2500);
        }
        // Convert PLN to Mission
        const mission = new Mission('', '').fromGarminFpl(pln);
        this.group(MsfsPln.name + ': Mission conversion');
        {
            this.assertEquals(mission.checkpoints.length, 16);
        }
        // Export Mission to XML
        const exportPln = new MfsfPlnExport(mission);
        // Reimport XML to PLN
        const secondPln = new MsfsPln(exportPln.toString());
        this.group(MfsfPlnExport.name);
        {
            this.assertEquals(secondPln.waypoins.length, pln.waypoins.length);
            secondPln.waypoins.forEach((wp, index) => {
                this.assertEquals(wp.identifier, pln.waypoins[index].identifier);
                this.assertEquals(wp.type, pln.waypoins[index].type);
                this.assertEquals(wp.lat, pln.waypoins[index].lat);
                this.assertEquals(wp.lon, pln.waypoins[index].lon);
            });
            this.assertEquals(secondPln.cruisingAlt, pln.cruisingAlt);
        }
    }
}
