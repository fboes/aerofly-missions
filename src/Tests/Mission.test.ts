import { LonLat } from "../World/LonLat.js";
import { Mission, MissionFactory } from "../Aerofly/Mission.js";
import { Test } from "../Cli/Test.js";
import * as fs from "node:fs";

export class MissionTest extends Test {
  constructor(protected process: NodeJS.Process, protected dieOnError = false) {
    super(process, dieOnError);

    this.group(Mission.name);
    {
      const mission = new Mission("a", "b");
      this.assertEquals(mission.title, "a");
      this.assertEquals(mission.description, "b");

      mission.aircraft_name = "PITTS";
      this.assertEquals(mission.aircraft_name, "pitts");
      this.assertEquals(mission.aircraft_icao, "PTS2");

      this.assert(mission.origin_lon_lat instanceof LonLat, "origin_lon_lat has correct type");
      this.assert(mission.destination_lon_lat instanceof LonLat, "destination_lon_lat has correct type");

      mission.aircraft_icao = "A388";
      this.assertEquals(mission.aircraft_icao, "A388");
    }

    this.group(Mission.name + ": Warnings");
    {
      const mission = new Mission("a".repeat(64), "b".repeat(500));
      this.assertEquals(mission.warnings.length, 2, "Throwing warnings");

      const mission2 = new Mission("a".repeat(32), "b".repeat(200));
      this.assertEquals(mission2.warnings.length, 0, "Not throwing warnings");

      const mission3 = new Mission("a".repeat(32), "b\n".repeat(10));
      this.assertEquals(mission3.warnings.length, 1, "Not throwing warnings");
    }

    this.group(Mission.name + ": No guides");
    {
      const mission = new Mission("a", "b");
      mission.no_guides = true;
      mission.origin_dir = 100;
      this.assert(mission.no_guides, "no_guides is set to true");

      const missionsString = mission.toString();
      this.assert(missionsString.includes("finish"), "finish is included in toString output");
      this.assert(missionsString.includes("tmmission_target_plane"), "finish is included in toString output");
    }

    this.group(MissionFactory.name);
    {
      const mission = new MissionFactory().create(
        fs.readFileSync("./src/Tests/fixtures/kclm_kbli.tmc", "utf8"),
        new Mission("", "")
      );

      this.assertEquals(mission.title, "From KCLM to KBLI");
      this.assertEquals(mission.flight_setting, "taxi");
      this.assertEquals(mission.origin_lon_lat.lon, -123.499694);
      this.assertEquals(mission.origin_lon_lat.lat, 48.121194);
      this.assertEquals(mission.conditions.time.time_year, 2022);
      this.assertEquals(mission.conditions.turbulence_strength, 0.6595469187953649);
      this.assertEquals(mission.checkpoints.length, 5);
      this.assertEquals(mission.checkpoints[4].name, "KBLI");
      this.assertEquals(mission.checkpoints[1].lon_lat.altitude_m, 1676.3999463552018);

      //console.log(mission.toString());
    }
  }
}
