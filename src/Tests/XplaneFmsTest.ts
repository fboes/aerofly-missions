import { Test } from "../Cli/Test.js";
import { XplaneFms, XplaneFmsExport } from "../Import/XplaneFms.js";
import * as fs from "node:fs";
import { Mission } from "../Aerofly/Mission.js";

export class XplaneFmsTest extends Test {
  constructor(process: NodeJS.Process) {
    super(process);

    const fms = new XplaneFms(fs.readFileSync('./src/Tests/EGCC-EDDF.fms', 'utf8'));
    this.group(XplaneFms.name);
    {
      this.assertEquals(fms.waypoints.length, 17)
      this.assertEquals(fms.waypoints[0].identifier, 'EGCC')
      this.assertEquals(fms.waypoints[0].type, 'AIRPORT')
      this.assertEquals(fms.waypoints[1].type, 'USER WAYPOINT')
      this.assertEquals(fms.waypoints[1].lat, 53.206400)
      this.assertEquals(fms.waypoints[1].lon, -0.861111)
      this.assertEquals(fms.waypoints[1].alt, 18400)
      this.assertEquals(fms.waypoints[2].alt, 35000)
      this.assertEquals(fms.cruisingAlt, 35000)
    }

    // Convert FMS to Mission
    const mission = new Mission('', '').fromGarminFpl(fms);
    this.group(XplaneFms.name + ': Mission conversion'); {
      this.assertEquals(mission.checkpoints.length, 17)
    }

    // Export Mission to XML
    const exportFms = new XplaneFmsExport(mission);
    //console.log(exportFms.toString());

    // Reimport XML to PLN
    const secondFms = new XplaneFms(exportFms.toString())
    this.group(XplaneFmsExport.name);
    {
      this.assertEquals(secondFms.waypoints.length, fms.waypoints.length);
      this.assertEquals(secondFms.waypoints[0].identifier, fms.waypoints[0].identifier)
      this.assertEquals(secondFms.waypoints[16].identifier, fms.waypoints[16].identifier)

      secondFms.waypoints.forEach((wp, index) => {
        if (fms.waypoints[index].type !== 'NDB') {
          this.assertEquals(wp.type, fms.waypoints[index].type)
        }
        this.assertEquals(wp.lat, fms.waypoints[index].lat)
        this.assertEquals(wp.lon, fms.waypoints[index].lon)
      })
      this.assertEquals(secondFms.cruisingAlt, fms.cruisingAlt)
    }
  }
}
