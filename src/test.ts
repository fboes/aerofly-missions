import { LonLat } from "./Aerofly/LonLat.js";
import { MissionCheckpoint } from "./Aerofly/MissionCheckpoint.js";
import { Test } from "./Cli/Test.js";

const test = new Test(process);

test.group(LonLat.name)
{
  const lonLat = new LonLat(50, 100);
  test.assertEquals(lonLat.lon, 50, 'Longitude matching')
  test.assertEquals(lonLat.lat, 100, 'Latitude matching')
}

test.group(MissionCheckpoint.name);
{
  const missionCheckpoint = new MissionCheckpoint();
  test.assertEquals(missionCheckpoint.altitude, 0, 'Altitude present')
  test.assertEquals(missionCheckpoint.direction, -1, 'Direction present')
  test.assertEquals(missionCheckpoint.frequency, 0, 'Frequency present')
  test.assert(missionCheckpoint.lon_lat instanceof LonLat, 'lon_lat has correct type')
  test.assertEquals(missionCheckpoint.slope, 0, 'Slope present')
}

test.exit();
