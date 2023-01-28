import { LonLat, LonLatArea } from "../World/LonLat.js";
import { Test } from "../Cli/Test.js";

export class LonLatTest extends Test {
  constructor(protected process: NodeJS.Process, protected dieOnError = false) {
    super(process, dieOnError);

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

      this.assertEqualsRounded(lonLat.getDistanceTo(new LonLat(0, 1)), 60.1, 1);
      this.assertEqualsRounded(lonLat.getDistanceTo(new LonLat(1, 0)), 60.1, 1);
      this.assertEqualsRounded(lonLat.getDistanceTo(new LonLat(0, -1)), 60.1, 1);
      this.assertEqualsRounded(lonLat.getDistanceTo(new LonLat(-1, 0)), 60.1, 1);
    }

    this.group(LonLat.name + ": Baghdad to Osaka");
    {
      const lonLat = new LonLat(45, 35);
      const lonLat2 = new LonLat(135, 35);

      this.assertEqualsRounded(lonLat.getBearingTo(lonLat2), 60, 0, 'Bearing matches');
      this.assertEqualsRounded(lonLat.getDistanceTo(lonLat2), 4252, 0, 'Distance matches');
    }

    this.group(LonLat.name + ": HST to 07FA");
    {
      const lonLat = new LonLat(-80.379414, 25.489981);
      const lonLat2 = new LonLat(-80.279153, 25.320653);

      this.assertEqualsRounded(lonLat.getBearingTo(lonLat2), 152, 0, 'Bearing matches');
      this.assertEqualsRounded(lonLat.getDistanceTo(lonLat2), 12, 0, 'Distance matches');
    }

    this.group(LonLat.name + ": getRelativeCoordinates");
    {
      const lonLat = new LonLat(-80.379414, 25.489981);
      const lonLat2 = new LonLat(80.279153, -25.320653);
      const lonLat3 = lonLat.getRelativeCoordinates(lonLat.getDistanceTo(lonLat2), lonLat.getBearingTo(lonLat2));

      this.assertEqualsRounded(lonLat2.lat, lonLat3.lat, 5)
      this.assertEqualsRounded(lonLat2.lon, lonLat3.lon, 5)
    }

    this.group(LonLat.name + ": Degree, Minutes, Seconds");
    {
      const lonLat = new LonLat(-115.1159, 36.0351);
      const lat = lonLat.latMinute;
      const lon = lonLat.lonMinute;

      this.assertEquals(lat.degree, 36)
      this.assertEquals(lat.minutes, 2)
      this.assertEqualsRounded(lat.seconds, 6.36, 2)
      this.assertEquals(lonLat.latHemisphere, 'N')
      this.assertEquals(lon.degree, -115)
      this.assertEquals(lon.minutes, 6)
      this.assertEqualsRounded(lon.seconds, 57.24, 2)
      this.assertEquals(lonLat.lonHemisphere, 'W')
      this.assertEquals(lonLat.toNavString(), '360206N1150657W')
    }
  }
}

export class LonLatAreaTest extends Test {
  constructor(protected process: NodeJS.Process, protected dieOnError = false) {
    super(process, dieOnError);

    this.group(LonLatArea.name + ': The World');
    {
      const lla = new LonLatArea(new LonLat(0,0));
      lla.push(new LonLat(-180,-90));
      lla.push(new LonLat(180,90));
      lla.push(new LonLat(10,10));

      const center = lla.center;

      this.assertEquals(center.lon, 0)
      this.assertEquals(center.lat, 0)
      this.assertEquals(lla.lonRange, 360);
      this.assertEquals(lla.latRange, 180);
      this.assertEqualsRounded(lla.getMaxRange(1 / 2), 720, 2);
      this.assertEqualsRounded(lla.getMaxRange(1 / 1), 360, 2);
      this.assertEqualsRounded(lla.getMaxRange(2 / 1), 360, 2);
      this.assertEquals(lla.getZoomLevel(), 4)
    }

    this.group(LonLatArea.name + ': EGOV');
    {
      const lla = new LonLatArea(new LonLat(-4.53,53.25));
      lla.push(new LonLat(-3.68, 52.7));
      lla.push(new LonLat(-3.85, 52.6));
      lla.push(new LonLat(-4.16, 53.22));

      const center = lla.center;

      this.assertEquals(center.lon, -4.105)
      this.assertEquals(center.lat, 52.925)
      this.assertEqualsRounded(lla.lonRange, 0.85, 2);
      this.assertEqualsRounded(lla.latRange, 0.65, 2);
      this.assertEqualsRounded(lla.getMaxRange(1 / 2), 1.7, 2);
      this.assertEqualsRounded(lla.getMaxRange(1 / 1), 0.85, 2);
      this.assertEqualsRounded(lla.getMaxRange(2 / 1), 1.3, 2);
      this.assertEquals(lla.getZoomLevel(), 9) // 9

      lla.push(new LonLat(-4.6, 53.32));
      this.assertEqualsRounded(lla.lonRange, 0.92, 2);
      this.assertEqualsRounded(lla.latRange, 0.72, 2);
      this.assertEqualsRounded(lla.getMaxRange(1 / 2), 1.84, 2);
      this.assertEqualsRounded(lla.getMaxRange(1 / 1), 0.92, 2);
      this.assertEqualsRounded(lla.getMaxRange(2 / 1), 1.44, 2);
      this.assertEquals(lla.getZoomLevel(), 9) // 9
    }

    this.group(LonLatArea.name + ': Reno');
    {
      const lla = new LonLatArea(new LonLat(-119.86,39.66));
      lla.push(new LonLat(-119.86,39.68));
      lla.push(new LonLat(-119.88,39.71));
      lla.push(new LonLat(-119.90,39.67));

      const center = lla.center;

      this.assertEquals(center.lon, -119.88)
      this.assertEquals(center.lat, 39.685)
      this.assertEqualsRounded(lla.lonRange, 0.04, 2);
      this.assertEqualsRounded(lla.latRange, 0.05, 2);
      this.assertEqualsRounded(lla.getMaxRange(1 / 2), 0.08, 2);
      this.assertEqualsRounded(lla.getMaxRange(1 / 1), 0.05, 2);
      this.assertEqualsRounded(lla.getMaxRange(2 / 1), 0.1, 2);
      this.assertEquals(lla.getZoomLevel(), 15) // 14
    }

    this.group(LonLatArea.name + ': Santa Barbara');
    {
      const lla = new LonLatArea(new LonLat(-119.84,34.42));
      lla.push(new LonLat(-119.77,34.51));
      lla.push(new LonLat(-120.09,34.53));

      const center = lla.center;

      this.assertEquals(center.lon, -119.93)
      this.assertEquals(center.lat, 34.475)
      this.assertEqualsRounded(lla.lonRange, 0.32, 2);
      this.assertEqualsRounded(lla.latRange, 0.11, 2);
      this.assertEqualsRounded(lla.getMaxRange(1 / 2), 0.64, 2);
      this.assertEqualsRounded(lla.getMaxRange(1 / 1), 0.32, 2);
      this.assertEqualsRounded(lla.getMaxRange(2 / 1), 0.32, 2);
      this.assertEquals(lla.getZoomLevel(), 12) // 12-11
    }

    this.group(LonLatArea.name + ': Manchester');
    {
      const lla = new LonLatArea(new LonLat(-2.28,53.35));
      lla.push(new LonLat(8.54, 50.03));

      const center = lla.center;

      this.assertEquals(center.lon, 3.13)
      this.assertEquals(center.lat, 51.69)
      this.assertEqualsRounded(lla.lonRange, 10.82, 2);
      this.assertEqualsRounded(lla.latRange, 3.32, 2);
      this.assertEqualsRounded(lla.getMaxRange(1 / 2), 21.64, 2);
      this.assertEqualsRounded(lla.getMaxRange(1 / 1), 10.82, 2);
      this.assertEqualsRounded(lla.getMaxRange(2 / 1), 10.82, 2);
      this.assertEquals(lla.getZoomLevel(), 6) // 6
    }
  }
}
