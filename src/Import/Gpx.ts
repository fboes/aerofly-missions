import { GaminFplWaypoint, GarminFpl } from "./GarminFpl.js";

export class Gpx extends GarminFpl {
  read(configFileContent: string): void {
    this.cruisingAlt = 0;
    const rteXml = this.getXmlNode(configFileContent, 'rte')

    const rteptXmls = this.getXmlNodes(rteXml, 'rtept');
    this.waypoins = rteptXmls.map((xml, index): GaminFplWaypoint => {
      return {
        identifier: this.getXmlNode(xml, 'name') || 'WP' + index.toFixed().padStart(2, '0'),
        type: (index === 0 || index === rteptXmls.length -1) ? 'AIRPORT' : 'USER WAYPOINT',
        lat: Number(this.getXmlAttribute(xml, 'lat')),
        lon: Number(this.getXmlAttribute(xml, 'lon')),
        alt: 0
      }
    })
  }
}
