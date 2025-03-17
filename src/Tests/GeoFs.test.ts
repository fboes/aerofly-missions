import { Test } from "../Cli/Test.js";
import { GeoFsExport, GeoFs } from "../Import/GeoFs.js";
import * as fs from "node:fs";
import { Mission } from "../Aerofly/Mission.js";
import { MainMcfFactory } from "../Aerofly/MainMcf.js";

export class GeoFsTest extends Test {
  constructor(protected process: NodeJS.Process, protected dieOnError = false) {
    super(process, dieOnError);
    this.testImportNative();
    this.testImportSimBrief();
    this.testImportMcf();
  }

  testImportNative() {
    const geoFs = new GeoFs(fs.readFileSync("./src/Tests/fixtures/geofs-KSFO-KLAX.json", "utf8"));
    this.group(GeoFs.name + ": KSFO-KLAX");

    {
      this.assertEquals(geoFs.waypoints.length, 5);
      this.assertEquals(geoFs.waypoints[0].identifier, "KSFO");
      this.assertEquals(geoFs.waypoints[0].type, "AIRPORT");
      this.assertEquals(geoFs.waypoints[1].type, "VOR");
      this.assertEquals(geoFs.departureRunway, undefined);
      this.assertEquals(geoFs.destinationRunway, undefined);
    }

    // Convert PLN to Mission
    const mission = new Mission("", "").fromGarminFpl(geoFs);
    this.group(GeoFs.name + ": KSFO-KLAX Mission conversion");
    {
      this.assertEquals(mission.checkpoints.length, 5);
      this.assertEquals(mission.flight_setting, Mission.FLIGHT_SETTING_TAXI);
    }

    // Export Mission to JSON
    const exportPln = new GeoFsExport(mission);
    this.group(GeoFs.name + ": KSFO-KLAX Re-export");
    {
      const json = exportPln.toJSON();
      this.assertEquals(json.length, 5);
      this.assertEquals(json[0].ident, "KSFO");
      this.assertEquals(json[0].type, "DPT");
      this.assertEquals(json[1].type, "VOR");
      this.assertEquals(json[4].type, "DST");
    }
  }

  testImportSimBrief() {
    const geoFs = new GeoFs(fs.readFileSync("./src/Tests/fixtures/geofs-simbrief.json", "utf8"));
    this.group(GeoFs.name + ": SimBrief");
    {
      this.assertEquals(geoFs.waypoints.length, 20);
      this.assertEquals(geoFs.waypoints[0].identifier, "EDDH");
      this.assertEquals(geoFs.waypoints[0].type, "AIRPORT");
      this.assertEquals(geoFs.waypoints[1].type, "USER WAYPOINT");
      this.assertEquals(geoFs.departureRunway, undefined);
      this.assertEquals(geoFs.destinationRunway, undefined);
    }

    // Convert PLN to Mission
    const mission = new Mission("", "").fromGarminFpl(geoFs);
    this.group(GeoFs.name + ": SimBrief Mission conversion");
    {
      this.assertEquals(mission.checkpoints.length, 20);
      this.assertEquals(mission.flight_setting, Mission.FLIGHT_SETTING_TAXI);
    }

    // Export Mission to JSON
    const exportPln = new GeoFsExport(mission);
    this.group(GeoFs.name + ": SimBrief Re-export");
    {
      const json = exportPln.toJSON();
      //console.log(json);
      this.assertEquals(json.length, 20);
      this.assertEquals(json[0].ident, "EDDH");
      this.assertEquals(json[0].type, "DPT");

      this.assertEquals(json[1].ident, "DH100");
      this.assertEquals(json[1].type, "FIX");

      this.assertEquals(json[3].ident, "WSN");
      this.assertEquals(json[3].type, "VOR");

      this.assertEquals(json[4].ident, "SIMAF");
      this.assertEquals(json[4].type, "WPT");

      this.assertEquals(json[19].ident, "EGLC");
      this.assertEquals(json[19].type, "DST");
    }
  }

  testImportMcf() {
    this.group(GeoFs.name + ": main.mcf");
    {
      const mainMcf = new MainMcfFactory().create(fs.readFileSync("./src/Tests/fixtures/main.mcf", "utf8"));
      const mission = new Mission("", "");
      mission.fromMainMcf(mainMcf);
      mission.origin_dir = 270;
      mission.destination_dir = 180;

      // Export Mission to JSON
      const exportPln = new GeoFsExport(mission);

      const json = exportPln.toJSON();
      //console.log(JSON.stringify(json));
      this.assertEquals(json.length, 5);
      this.assertEquals(json[0].ident, "EGGP");
      this.assertEquals(json[0].type, "DPT");
      this.assertEquals(json[0].heading, 270);
      this.assertEquals(json[1].type, "RNW");
      this.assertEquals(json[4].type, "DST");
      this.assertEquals(json[4].heading, 180);
    }
  }
}
