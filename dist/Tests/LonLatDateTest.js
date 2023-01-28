import { LonLat } from "../World/LonLat.js";
import { LonLatDate } from "../World/LonLatDate.js";
import { Test } from "../Cli/Test.js";
export class LonLatDateTest extends Test {
    constructor(process, dieOnError = false) {
        super(process, dieOnError);
        this.process = process;
        this.dieOnError = dieOnError;
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
            const date = new Date(Date.UTC(2022, 0, 12, 12 - 11, 0));
            const lonLatDate = new LonLatDate(lonLat, date);
            this.assertEquals(lonLatDate.dayOfYear, 12);
            this.assertEquals(lonLatDate.solarTimeZoneOffset, 11);
            this.assertEqualsRounded(lonLatDate.localTime, 12, 2);
            this.assertEqualsRounded(lonLatDate.localSolarTimeMeridian, 165, 2);
            this.assertEqualsRounded(lonLatDate.sunDeclination * 180 / Math.PI, -21.75, 2);
            this.assertEqualsRounded(lonLatDate.equationOfTime, -8.27, 2);
            this.assertEqualsRounded(lonLatDate.timeCorrectionFactor, -8.27, 2);
            this.assertEqualsRounded(lonLatDate.localSolarTime, 11.86, 2);
            this.assertEqualsRounded(lonLatDate.hourAngle * 180 / Math.PI, -2.07, 2);
            this.assertEqualsRounded(lonLatDate.solarElevationAngle * 180 / Math.PI, 38.21, 2);
            this.assertEquals(lonLatDate.sunState.sunState, 'Day');
        }
        this.group(LonLatDate.name + ': New York');
        {
            const lonLat = new LonLat(-75, 40);
            const date = new Date(Date.UTC(2022, 6, 4, 12 + 5, 0));
            const lonLatDate = new LonLatDate(lonLat, date);
            this.assertEquals(lonLatDate.dayOfYear, 185);
            this.assertEquals(lonLatDate.solarTimeZoneOffset, -5);
            this.assertEqualsRounded((lonLatDate.localTime), 12, 2);
            this.assertEqualsRounded((lonLatDate.localSolarTimeMeridian), -75, 2);
            this.assertEqualsRounded((lonLatDate.sunDeclination * 180 / Math.PI), 22.89, 2);
            this.assertEqualsRounded((lonLatDate.equationOfTime), -4.02, 2);
            this.assertEqualsRounded((lonLatDate.timeCorrectionFactor), -4.02, 2);
            this.assertEqualsRounded((lonLatDate.localSolarTime), 11.93, 2); // ?
            this.assertEqualsRounded((lonLatDate.hourAngle * 180 / Math.PI), -1, 2);
            this.assertEqualsRounded((lonLatDate.solarElevationAngle * 180 / Math.PI), 72.87, 2);
            this.assertEquals(lonLatDate.sunState.sunState, 'Day');
        }
        this.group(LonLatDate.name + ': Dusk till Dawn');
        {
            const lonLat = new LonLat(-75, 40);
            let date = new Date(Date.UTC(2022, 6, 4, 2 + 5, 0));
            let lonLatDate = new LonLatDate(lonLat, date);
            this.assertEquals(lonLatDate.sunState.sunState, 'Night');
            this.assertEquals(lonLatDate.sunState.localSolarTime, '01:55');
            this.assertEquals(lonLatDate.sunState.localTime, '02:00');
            lonLatDate.date = new Date(Date.UTC(2022, 6, 4, 3 + 5, 0));
            this.assertEquals(lonLatDate.sunState.sunState, 'Night');
            lonLatDate.date = new Date(Date.UTC(2022, 6, 4, 4 + 5, 0));
            this.assertEquals(lonLatDate.sunState.sunState, 'Night');
            lonLatDate.date = new Date(Date.UTC(2022, 6, 4, 4 + 5, 30));
            this.assertEquals(lonLatDate.sunState.sunState, 'Dusk');
            lonLatDate.date = new Date(Date.UTC(2022, 6, 4, 5 + 5, 0));
            this.assertEquals(lonLatDate.sunState.sunState, 'Day');
            lonLatDate.date = new Date(Date.UTC(2022, 6, 4, 19 + 5, 0));
            this.assertEquals(lonLatDate.sunState.sunState, 'Day');
            lonLatDate.date = new Date(Date.UTC(2022, 6, 4, 19 + 5, 40));
            this.assertEquals(lonLatDate.sunState.sunState, 'Dawn');
            lonLatDate.date = new Date(Date.UTC(2022, 6, 4, 20 + 5, 15));
            this.assertEquals(lonLatDate.sunState.sunState, 'Night');
        }
    }
}
