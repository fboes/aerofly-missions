import { MissionConditions } from "../Aerofly/MissionConditions.js";
import { Test } from "../Cli/Test.js";
export class MissionConditionsTest extends Test {
    constructor(process) {
        super(process);
        this.group(MissionConditions.name);
        {
            const missionConditions = new MissionConditions();
            this.assertEquals(missionConditions.cloud_base, 0);
            this.assertEquals(missionConditions.cloud_cover, 0);
            this.assertEquals(missionConditions.wind_speed, 0);
            this.assertEquals(missionConditions.visibility, 20000);
            missionConditions.visibility_percent = 1;
            this.assertEquals(missionConditions.visibility, 15000, 'Visbility percentage test');
            missionConditions.visibility_percent = 0.5;
            this.assertEquals(missionConditions.visibility, 15000 / 2, 'Visbility percentage test');
            missionConditions.visibility_percent = 0;
            this.assertEquals(missionConditions.visibility, 0, 'Visbility percentage test');
            missionConditions.cloud_base_percent = 1;
            this.assert(missionConditions.cloud_base > 3000, 'Cloud base percentage test');
            missionConditions.cloud_base_percent = 0;
            this.assertEquals(missionConditions.cloud_base, 0, 'Cloud base percentage test');
            missionConditions.wind_speed_percent = 1;
            this.assertEquals(missionConditions.wind_speed, 16, 'Wind speed percentage test');
            missionConditions.wind_speed_percent = 0.5;
            this.assertEquals(missionConditions.wind_speed, 6, 'Wind speed percentage test');
            missionConditions.wind_speed_percent = 0;
            this.assertEquals(missionConditions.wind_speed, 0, 'Wind speed percentage test');
        }
        /**
         * @see https://e6bx.com/e6b
         */
        this.group(MissionConditions.name + ': Wind drift 1');
        {
            const missionConditions = new MissionConditions();
            missionConditions.wind_direction = 90;
            missionConditions.wind_speed = 23;
            const course = 320;
            const tas_kts = 100;
            const windCorrection = missionConditions.getWindCorrection(course / 180 * Math.PI, tas_kts);
            this.assertEquals(Math.round(windCorrection.ground_speed), 113);
            this.assertEquals(Math.round(windCorrection.heading), 330);
        }
        this.group(MissionConditions.name + ': Wind drift 2');
        {
            const missionConditions = new MissionConditions();
            missionConditions.wind_direction = 90;
            missionConditions.wind_speed = 20;
            const course = 355;
            const tas_kts = 150;
            const windCorrection = missionConditions.getWindCorrection(course / 180 * Math.PI, tas_kts);
            this.assertEquals(Math.round(windCorrection.ground_speed), 150);
            this.assertEquals(Math.round(windCorrection.heading), 3);
        }
        this.group(MissionConditions.name + ': Wind drift 3');
        {
            const missionConditions = new MissionConditions();
            missionConditions.wind_direction = 90;
            missionConditions.wind_speed = 20;
            const course = 90;
            const tas_kts = 150;
            const windCorrection = missionConditions.getWindCorrection(course / 180 * Math.PI, tas_kts);
            this.assertEquals(windCorrection.ground_speed, tas_kts - missionConditions.wind_speed);
            this.assertEquals(windCorrection.heading, course);
        }
        this.group(MissionConditions.name + ': Wind drift 4');
        {
            const missionConditions = new MissionConditions();
            missionConditions.wind_direction = 270;
            missionConditions.wind_speed = 20;
            const course = 90;
            const tas_kts = 150;
            const windCorrection = missionConditions.getWindCorrection(course / 180 * Math.PI, tas_kts);
            this.assertEquals(windCorrection.ground_speed, tas_kts + missionConditions.wind_speed);
            this.assertEquals(windCorrection.heading, course);
        }
        this.group(MissionConditions.name + ': Flight conditions 1');
        {
            const missionConditions = new MissionConditions();
            missionConditions.visibility_percent = 1;
            this.assertEquals(missionConditions.getFlightCategory(), 'VFR');
            missionConditions.visibility_percent = 0.5;
            this.assertEquals(missionConditions.getFlightCategory(), 'MVFR');
            missionConditions.visibility_percent = 0.3;
            this.assertEquals(missionConditions.getFlightCategory(), 'IFR');
            missionConditions.visibility_percent = 0.1;
            this.assertEquals(missionConditions.getFlightCategory(), 'LIFR');
        }
        this.group(MissionConditions.name + ': Flight conditions 1');
        {
            const missionConditions = new MissionConditions();
            missionConditions.cloud_base = 0;
            missionConditions.cloud_cover = 0;
            this.assertEquals(missionConditions.getFlightCategory(), 'VFR');
            missionConditions.cloud_base = 5000;
            missionConditions.cloud_cover = 0.1;
            this.assertEquals(missionConditions.getFlightCategory(), 'VFR');
            missionConditions.cloud_base = 1000;
            missionConditions.cloud_cover = 0.5;
            this.assertEquals(missionConditions.getFlightCategory(), 'VFR');
            missionConditions.cloud_base = 800;
            missionConditions.cloud_cover = 0.6;
            this.assertEquals(missionConditions.getFlightCategory(), 'MVFR');
        }
        this.group(MissionConditions.name + ': Time');
        {
            const missionConditions = new MissionConditions();
            missionConditions.time.time_year = 2022;
            missionConditions.time.time_month = 1;
            missionConditions.time.time_day = 1;
            missionConditions.time.time_hours = 0.75;
            const obj = missionConditions.time_object;
            this.assertEquals(obj.getUTCFullYear(), 2022);
            this.assertEquals(obj.getUTCMonth(), 0);
            this.assertEquals(obj.getUTCDate(), 1);
            this.assertEquals(obj.getUTCDay(), 6);
            this.assertEquals(obj.getUTCHours(), 0);
            this.assertEquals(obj.getUTCMinutes(), 45);
            this.assertEquals(obj.getUTCSeconds(), 0);
        }
    }
}
