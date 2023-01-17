import { LonLat } from "../World/LonLat.js";
import { Test } from "../Cli/Test.js";

export class LonLatTest extends Test {
  constructor(process: NodeJS.Process) {
    super(process);

    this.group(LonLat.name);
    {
      const lonLat = new LonLat(50, 100);

      this.assertEquals(lonLat.lon, 50, "Longitude matching");
      this.assertEquals(lonLat.lat, 100, "Latitude matching");
    }

    this.group(LonLat.name + ": Bearing");
    {
      const lonLat = new LonLat(0, 0);

      this.assertEquals(lonLat.getBearingTo(new LonLat(0, 90)), 0);
      this.assertEquals(lonLat.getBearingTo(new LonLat(90, 0)), 90);
      this.assertEquals(lonLat.getBearingTo(new LonLat(0, -90)), 180);
      this.assertEquals(lonLat.getBearingTo(new LonLat(-90, 0)), 270);
    }

    this.group(LonLat.name + ": Distance");
    {
      const lonLat = new LonLat(0, 0);

      this.assertEquals(Math.round(lonLat.getDistanceTo(new LonLat(0, 1))), 60);
      this.assertEquals(Math.round(lonLat.getDistanceTo(new LonLat(1, 0))), 60);
      this.assertEquals(Math.round(lonLat.getDistanceTo(new LonLat(0, -1))), 60);
      this.assertEquals(Math.round(lonLat.getDistanceTo(new LonLat(-1, 0))), 60);
    }

    this.group(LonLat.name + ": Baghdad to Osaka");
    {
      const lonLat = new LonLat(45, 35);
      const lonLat2 = new LonLat(135, 35);

      this.assertEquals(Math.round(lonLat.getBearingTo(lonLat2)), 60, 'Bearing matches');
      this.assertEquals(Math.round(lonLat.getDistanceTo(lonLat2)), 4252, 'Distance matches');
    }

    this.group(LonLat.name + ": HST to 07FA");
    {
      const lonLat = new LonLat(-80.379414, 25.489981);
      const lonLat2 = new LonLat(-80.279153, 25.320653);

      this.assertEquals(Math.round(lonLat.getBearingTo(lonLat2)), 152, 'Bearing matches');
      this.assertEquals(Math.round(lonLat.getDistanceTo(lonLat2)), 12, 'Distance matches');
    }

    this.group(LonLat.name + ": getRelativeCoordinates");
    {
      const lonLat = new LonLat(-80.379414, 25.489981);
      const lonLat2 = new LonLat(80.279153, -25.320653);
      const lonLat3 = lonLat.getRelativeCoordinates(lonLat.getDistanceTo(lonLat2), lonLat.getBearingTo(lonLat2));

      this.assertEquals(lonLat2.lat.toFixed(5), lonLat3.lat.toFixed(5))
      this.assertEquals(lonLat2.lon.toFixed(5), lonLat3.lon.toFixed(5))
    }
  }
}
