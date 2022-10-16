import { LonLat } from "../Aerofly/LonLat.js";
import { MissionCheckpoint } from "../Aerofly/MissionCheckpoint.js";
import { Test } from "../Cli/Test.js";
export class MissionCheckpointTest extends Test {
    constructor(process) {
        super(process);
        this.group(MissionCheckpoint.name);
        const missionCheckpoint = new MissionCheckpoint();
        this.assertEquals(missionCheckpoint.altitude, 0, 'Altitude present');
        this.assertEquals(missionCheckpoint.direction, -1, 'Direction present');
        this.assertEquals(missionCheckpoint.frequency, 0, 'Frequency present');
        this.assert(missionCheckpoint.lon_lat instanceof LonLat, 'lon_lat has correct type');
        this.assertEquals(missionCheckpoint.slope, 0, 'Slope present');
        missionCheckpoint.rawFrequency = 108.2;
        this.assertEquals(missionCheckpoint.rawFrequency, 108.2);
        this.assertEquals(missionCheckpoint.frequency, 108200000);
        missionCheckpoint.rawFrequency = 260;
        this.assertEquals(missionCheckpoint.rawFrequency, 260);
        this.assertEquals(missionCheckpoint.frequency, 260000);
    }
}
