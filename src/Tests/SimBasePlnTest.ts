import { Test } from "../Cli/Test.js";
import { SimBasePln } from "../Import/SimBasePln.js";

export class SimBasePlnTest extends Test {
  constructor(process: NodeJS.Process) {
    super(process);

    this.group(SimBasePln.name);
    {
      const pln = new SimBasePln('./src/Tests/EGOV.pln');
      pln.read();
      this.assertEquals(pln.waypoins.length, 16)
      this.assertEquals(pln.waypoins[0].identifier, 'EGOV')
      this.assertEquals(pln.waypoins[0].type, 'AIRPORT')
      this.assertEquals(pln.waypoins[1].type, 'USER WAYPOINT')
      this.assertEquals(pln.waypoins[1].lat, 52.717475)
      this.assertEquals(pln.waypoins[1].lon.toFixed(8), '-4.05834167')
      this.assertEquals(pln.cruisingAlt, 2500)
    }
  }
}
