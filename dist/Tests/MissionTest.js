import { LonLat } from "../Aerofly/LonLat.js";
import { Mission } from "../Aerofly/Mission.js";
import { Test } from "../Cli/Test.js";
export class MissionTest extends Test {
    constructor(process) {
        super(process);
        this.group(Mission.name);
        {
            const mission = new Mission('a', 'b');
            this.assertEquals(mission.title, 'a');
            this.assertEquals(mission.description, 'b');
            mission.aircraft_name = 'PITTS';
            this.assertEquals(mission.aircraft_name, 'pitts');
            this.assertEquals(mission.aircraft_icao, 'PTS2');
            this.assert(mission.origin_lon_lat instanceof LonLat, 'origin_lon_lat has correct type');
            this.assert(mission.destination_lon_lat instanceof LonLat, 'destination_lon_lat has correct type');
            mission.aircraft_icao = 'ab12';
            this.assertEquals(mission.aircraft_icao, 'AB12');
        }
        this.group(Mission.name + ': Warnings');
        {
            const mission = new Mission('a'.repeat(64), 'b'.repeat(500));
            this.assertEquals(mission.title, 'a'.repeat(Mission.MAX_LENGTH_TITLE), 'Truncating title');
            this.assertEquals(mission.warnings.length, 2, 'Throwing warnings');
        }
    }
}
