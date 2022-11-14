import { LonLat } from "../Aerofly/LonLat.js";
import { LonLatDate } from "../Aerofly/LonLatDate.js";
import { Test } from "../Cli/Test.js";

export class LonLatDateTest extends Test {
  constructor(process: NodeJS.Process) {
    super(process);

    this.group(LonLatDate.name + ': Day of Year');
    {
      const lonLat = new LonLat(0, 0);

      let lonLatDate = new LonLatDate(lonLat, new Date(Date.UTC(2022, 0, 1, 0, 0)));
      this.assertEquals(lonLatDate.dayOfYear, 1);

      lonLatDate = new LonLatDate(lonLat, new Date(Date.UTC(2016, 2, 1, 0, 0)));
      this.assertEquals(lonLatDate.dayOfYear, 61);

      lonLatDate = new LonLatDate(lonLat, new Date(Date.UTC(2016, 5, 1, 0, 0)));
      this.assertEquals(lonLatDate.dayOfYear, 153);
    }

    this.group(LonLatDate.name + ': Sydney');
    {
      const lonLat = new LonLat(150 + 15, 30);
      const date = new Date(Date.UTC(2022, 0, 12, 12 - 11, 0))

      const lonLatDate = new LonLatDate(lonLat, date);

      this.assertEquals(lonLatDate.dayOfYear, 12);
      this.assertEquals(lonLatDate.solarTimeZoneOffset, 11);
      this.assertEquals(Math.round(lonLatDate.localTime), 12);
      this.assertEquals(Math.round(lonLatDate.localSolarTimeMeridian), 165);
      this.assertEquals(Math.round(lonLatDate.sunDeclination * 180 / Math.PI), -22);
      this.assertEquals(Math.round(lonLatDate.equationOfTime), -8);
      this.assertEquals(Math.round(lonLatDate.timeCorrectionFactor), -8);
      this.assertEquals(Math.round(lonLatDate.localSolarTime), 12);
      this.assertEquals(Math.round(lonLatDate.hourAngle * 180 / Math.PI), -2);
      this.assertEquals(Math.round(lonLatDate.solarElevationAngle * 180 / Math.PI), 38);
    }


    this.group(LonLatDate.name + ': New York');
    {
      const lonLat = new LonLat(-75, 40);
      const date = new Date(Date.UTC(2022, 6, 4, 12 + 5, 0))

      const lonLatDate = new LonLatDate(lonLat, date);

      this.assertEquals(lonLatDate.dayOfYear, 185);
      this.assertEquals(lonLatDate.solarTimeZoneOffset, -5);
      this.assertEquals(Math.round(lonLatDate.localTime), 12);
      this.assertEquals(Math.round(lonLatDate.localSolarTimeMeridian), -75);
      this.assertEquals(Math.round(lonLatDate.sunDeclination * 180 / Math.PI), 23);
      this.assertEquals(Math.round(lonLatDate.equationOfTime), -4);
      this.assertEquals(Math.round(lonLatDate.timeCorrectionFactor), -4);
      this.assertEquals(Math.round(lonLatDate.localSolarTime), 12); // ?
      this.assertEquals(Math.round(lonLatDate.hourAngle * 180 / Math.PI), -1);
      this.assertEquals(Math.round(lonLatDate.solarElevationAngle * 180 / Math.PI), 73);
    }
  }
}
