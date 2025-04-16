import { Mission } from "../Aerofly/Mission.js";
import { Test } from "../Cli/Test.js";
import { SeeYouCup } from "../Import/SeeYouCup.js";
import * as fs from "node:fs";

export class SeeYouCupTest extends Test {
  constructor(protected process: NodeJS.Process, protected dieOnError = false) {
    super(process, dieOnError);
    this.testSeeYou1();
  }

  testSeeYou1() {
    const pln = new SeeYouCup(fs.readFileSync("./src/Tests/fixtures/seeyou-tasks.cup", "utf8"));

    this.group(SeeYouCup.name + ": Mission conversion");
    {
      this.assertEquals(pln.waypoints.length, 5);
      this.assertEquals(pln.waypoints[0].identifier, "MARCELMA");
      this.assertEquals(pln.waypoints[0].type, "USER WAYPOINT");
      this.assertEqualsRounded(pln.waypoints[0].lat, -41.4577, 4);
      this.assertEqualsRounded(pln.waypoints[0].lon, -72.9186, 4);
      this.assertEquals(pln.waypoints[0].elevationMeter, 115);
      this.assertEquals(pln.waypoints[1].identifier, "VOLC_NCA");
      this.assertEquals(pln.waypoints[1].type, "USER WAYPOINT");
      this.assertEquals(pln.cruisingAltFt, undefined);
      this.assertEquals(pln.departureRunway, undefined);
      this.assertEquals(pln.destinationRunway, undefined);
    }

    // Convert PLN to Mission
    const mission = new Mission("", "").fromGarminFpl(pln);
    this.group(SeeYouCup.name + ": Mission conversion");
    {
      this.assertEquals(mission.checkpoints.length, 5);
      this.assertEquals(
        mission.flight_setting,
        Mission.FLIGHT_SETTING_CRUISE,
        "Missions without airport start in cruise mode"
      );
      this.assertEqualsRounded(mission.origin_dir, 61.2, 1);
    }
  }
}
