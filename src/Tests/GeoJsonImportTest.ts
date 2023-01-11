import { Test } from "../Cli/Test.js";
import { GeoJsonImport } from "../Import/GeoJson.js";
import * as fs from "node:fs";

export class GeoJsonImportTest extends Test {
  constructor(process: NodeJS.Process) {
    super(process);

    this.group(GeoJsonImport.name);
    {
      const gpl = new GeoJsonImport(fs.readFileSync('./src/Tests/reno-airrace.geojson', 'utf8'));

      this.assertEquals(gpl.waypoins.length, 15)
      this.assertEquals(gpl.waypoins[0].identifier, 'KRTS')
      this.assertEquals(gpl.waypoins[0].type, 'AIRPORT')
      this.assertEquals(gpl.waypoins[1].type, 'USER WAYPOINT')
      this.assertEquals(gpl.waypoins[14].type, 'AIRPORT')
      this.assertEquals(gpl.waypoins[1].lat, 39.665246531929995)
      this.assertEquals(gpl.waypoins[4].lon, -119.8601888582547)
      this.assertEquals(gpl.cruisingAlt, 0)
    }

    this.group(GeoJsonImport.name + ': More complex');
    {
      const gpl = new GeoJsonImport(fs.readFileSync('./src/Tests/EGOV-EGOV.geojson', 'utf8'));

      this.assertEquals(gpl.waypoins.length, 16)
      this.assertEquals(gpl.waypoins[0].identifier, 'EGOV')
      this.assertEquals(gpl.waypoins[15].identifier, 'EGOV')
      this.assertEquals(gpl.waypoins[0].type, 'AIRPORT')
      this.assertEquals(gpl.waypoins[1].type, 'USER WAYPOINT')
      this.assertEquals(gpl.waypoins[15].type, 'AIRPORT')
      this.assertEquals(gpl.waypoins[1].lat, 52.717475)
      this.assertEquals(gpl.waypoins[4].lon, -3.8810166666666666)
      this.assertEquals(gpl.cruisingAlt, 761.9999756160008)
    }
  }
}
