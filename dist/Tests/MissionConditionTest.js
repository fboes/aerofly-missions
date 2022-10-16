import { MissionConditions } from "../Aerofly/MissionConditions.js";
import { Test } from "../Cli/Test.js";
export class MissionTest extends Test {
    constructor(process) {
        super(process);
        this.group(MissionConditions.name);
        const missionConditions = new MissionConditions();
        this.assertEquals(missionConditions.cloud_base, 0);
        this.assertEquals(missionConditions.cloud_cover, 0);
        this.assertEquals(missionConditions.wind_speed, 0);
        this.assertEquals(missionConditions.visibility, 20000);
    }
}
