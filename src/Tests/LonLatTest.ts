import { LonLat } from "../Aerofly/LonLat.js";
import { Test } from "../Cli/Test.js";

export class LonLatTest extends Test {
  constructor(process: NodeJS.Process) {
    super(process);

    this.group(LonLat.name);

    const lonLat = new LonLat(50, 100);
    
    this.assertEquals(lonLat.lon, 50, 'Longitude matching')
    this.assertEquals(lonLat.lat, 100, 'Latitude matching')
  }
}
