import { MissionConditions } from "../Aerofly/MissionConditions.js";
import { Test } from "../Cli/Test.js";
export class MissionConditionsTest extends Test {
    constructor(process) {
        super(process);
        this.group(MissionConditions.name);
        const missionConditions = new MissionConditions();
        this.assertEquals(missionConditions.cloud_base, 0);
        this.assertEquals(missionConditions.cloud_cover, 0);
        this.assertEquals(missionConditions.wind_speed, 0);
        this.assertEquals(missionConditions.visibility, 20000);
        missionConditions.visibility_percent = 1;
        this.assertEquals(missionConditions.visibility, 10000, 'Visbility percentage test');
        missionConditions.visibility_percent = 0.5;
        this.assertEquals(missionConditions.visibility, 10000 / 2, 'Visbility percentage test');
        missionConditions.visibility_percent = 0;
        this.assertEquals(missionConditions.visibility, 0, 'Visbility percentage test');
        missionConditions.cloud_base_percent = 1;
        this.assertEquals(missionConditions.cloud_base, 3000, 'Cloud base percentage test');
        missionConditions.cloud_base_percent = 0.5;
        this.assertEquals(missionConditions.cloud_base, 3000 / 2, 'Cloud base percentage test');
        missionConditions.cloud_base_percent = 0;
        this.assertEquals(missionConditions.cloud_base, 0, 'Cloud base percentage test');
        missionConditions.wind_speed_percent = 1;
        this.assertEquals(missionConditions.wind_speed, 16, 'Wind speed percentage test');
        missionConditions.wind_speed_percent = 0.5;
        this.assertEquals(missionConditions.wind_speed, 6, 'Wind speed percentage test');
        missionConditions.wind_speed_percent = 0;
        this.assertEquals(missionConditions.wind_speed, 0, 'Wind speed percentage test');
    }
}
