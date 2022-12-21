import { Test } from "../Cli/Test.js";
import { GeoJson } from "../Import/GeoJson.js";
import * as fs from "node:fs";

export class GeoJsonTest extends Test {
  constructor(process: NodeJS.Process) {
    super(process);

    this.group(GeoJson.name);
    {
      const gpl = new GeoJson(fs.readFileSync('./src/Tests/reno-airrace.geojson', 'utf8'));

      this.assertEquals(gpl.waypoins.length, 15)
      this.assertEquals(gpl.waypoins[0].identifier, 'KRTS')
      this.assertEquals(gpl.waypoins[0].type, 'AIRPORT')
      this.assertEquals(gpl.waypoins[1].type, 'USER WAYPOINT')
      this.assertEquals(gpl.waypoins[14].type, 'AIRPORT')
      this.assertEquals(gpl.waypoins[1].lat, 39.665246531929995)
      this.assertEquals(gpl.waypoins[4].lon, -119.8601888582547)
      this.assertEquals(gpl.cruisingAlt, 0)
    }
  }
}
