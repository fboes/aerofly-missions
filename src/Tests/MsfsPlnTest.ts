import { Test } from "../Cli/Test.js";
import { MsfsPln } from "../Import/MsfsPln.js";
import * as fs from "node:fs";

export class MsfsPlnTest extends Test {
  constructor(process: NodeJS.Process) {
    super(process);

    this.group(MsfsPln.name);
    {
      const pln = new MsfsPln(fs.readFileSync('./src/Tests/EGOV.pln', 'utf8'));

      this.assertEquals(pln.waypoins.length, 16)
      this.assertEquals(pln.waypoins[0].identifier, 'EGOV')
      this.assertEquals(pln.waypoins[0].type, 'AIRPORT')
      this.assertEquals(pln.waypoins[1].type, 'USER WAYPOINT')
      this.assertEquals(pln.waypoins[1].lat, 52.717475)
      this.assertEquals(pln.waypoins[1].alt, 2500)
      this.assertEquals(pln.waypoins[1].lon.toFixed(8), '-4.05834167')
      this.assertEquals(pln.cruisingAlt, 2500)
    }
  }
}
