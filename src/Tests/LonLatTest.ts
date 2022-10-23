import { LonLat } from "../Aerofly/LonLat.js";
import { Test } from "../Cli/Test.js";

export class LonLatTest extends Test {
  constructor(process: NodeJS.Process) {
    super(process);

    this.group(LonLat.name);
    {
      const lonLat = new LonLat(50, 100);

      this.assertEquals(lonLat.lon, 50, 'Longitude matching')
      this.assertEquals(lonLat.lat, 100, 'Latitude matching')
    }

    this.group(LonLat.name + ': Bearing');
    {
      const lonLat = new LonLat(0, 0);

      this.assertEquals(lonLat.getBearingTo(new LonLat(0, 90)), 0)
      this.assertEquals(lonLat.getBearingTo(new LonLat(90, 0)), 90)
      this.assertEquals(lonLat.getBearingTo(new LonLat(0, -90)), 180)
      this.assertEquals(lonLat.getBearingTo(new LonLat(-90, 0)), 270)
    }

    this.group(LonLat.name + ': Baghdad to Osaka');
    {
      const lonLat = new LonLat(45, 35);

      this.assertEquals(Math.floor(lonLat.getBearingTo(new LonLat(135, 35))), 60)
    }

    this.group(LonLat.name + ': HST to 07FA');
    {
      const lonLat = new LonLat(-80.379414, 25.489981);

      this.assertEquals(Math.floor(lonLat.getBearingTo(new LonLat(-80.279153, 25.320653))), 151)
    }
  }
}
