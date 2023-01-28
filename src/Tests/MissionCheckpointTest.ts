import { LonLat } from "../World/LonLat.js";
import { MissionCheckpoint } from "../Aerofly/MissionCheckpoint.js";
import { Test } from "../Cli/Test.js";

export class MissionCheckpointTest extends Test {
  constructor(protected process: NodeJS.Process, protected dieOnError = false) {
    super(process, dieOnError);

    this.group(MissionCheckpoint.name);

    const missionCheckpoint = new MissionCheckpoint();
    this.assertEquals(missionCheckpoint.lon_lat.altitude_m, 0, "Altitude present");
    this.assertEquals(missionCheckpoint.direction, -1, "Direction present");
    this.assertEquals(missionCheckpoint.frequency, 0, "Frequency present");
    this.assert(missionCheckpoint.lon_lat instanceof LonLat, "lon_lat has correct type");
    this.assertEquals(missionCheckpoint.slope, 0, "Slope present");

    missionCheckpoint.frequency_mhz = 108.2;
    this.assertEquals(missionCheckpoint.frequency_unit, 'M');
    this.assertEquals(missionCheckpoint.frequency_mhz, 108.2);
    this.assertEquals(missionCheckpoint.frequency, 108200000);

    missionCheckpoint.frequency_khz = 260;
    this.assertEquals(missionCheckpoint.frequency_unit, 'k');
    this.assertEquals(missionCheckpoint.frequency_khz, 260);
    this.assertEquals(missionCheckpoint.frequency, 260000);

    missionCheckpoint.frequency_khz = 1260;
    this.assertEquals(missionCheckpoint.frequency_unit, 'k');
    this.assertEquals(missionCheckpoint.frequency_khz, 1260);
    this.assertEquals(missionCheckpoint.frequency, 1260000);
  }
}
