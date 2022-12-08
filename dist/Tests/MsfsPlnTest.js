import { Test } from "../Cli/Test.js";
import { MsfsPln } from "../Import/MsfsPln.js";
export class MsfsPlnTest extends Test {
    constructor(process) {
        super(process);
        this.group(MsfsPln.name);
        {
            const pln = new MsfsPln('./src/Tests/EGOV.pln');
            pln.read();
            this.assertEquals(pln.waypoins.length, 16);
            this.assertEquals(pln.waypoins[0].identifier, 'EGOV');
            this.assertEquals(pln.waypoins[0].type, 'AIRPORT');
            this.assertEquals(pln.waypoins[1].type, 'USER WAYPOINT');
            this.assertEquals(pln.waypoins[1].lat, 52.717475);
            this.assertEquals(pln.waypoins[1].lon.toFixed(8), '-4.05834167');
            this.assertEquals(pln.cruisingAlt, 2500);
        }
    }
}
