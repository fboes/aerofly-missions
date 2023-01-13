import { Test } from "../Cli/Test.js";
import { MsfsPlnExport, MsfsPln } from "../Import/MsfsPln.js";
import * as fs from "node:fs";
import { Mission } from "../Aerofly/Mission.js";
export class MsfsPlnTest extends Test {
    constructor(process) {
        super(process);
        // Parse PLN
        const pln = new MsfsPln(fs.readFileSync('./src/Tests/EGOV.pln', 'utf8'));
        this.group(MsfsPln.name);
        {
            this.assertEquals(pln.waypoints.length, 16);
            this.assertEquals(pln.waypoints[0].identifier, 'EGOV');
            this.assertEquals(pln.waypoints[0].type, 'AIRPORT');
            this.assertEquals(pln.waypoints[1].type, 'USER WAYPOINT');
            this.assertEquals(pln.waypoints[1].lat, 52.717475);
            this.assertEquals(pln.waypoints[1].alt, 2500);
            this.assertEquals(pln.waypoints[1].lon.toFixed(8), '-4.05834167');
            this.assertEquals(pln.cruisingAlt, 2500);
        }
        // Convert PLN to Mission
        const mission = new Mission('', '').fromGarminFpl(pln);
        this.group(MsfsPln.name + ': Mission conversion');
        {
            this.assertEquals(mission.checkpoints.length, 16);
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
}
