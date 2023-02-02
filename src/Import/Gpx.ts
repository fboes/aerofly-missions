import { Units } from "../World/Units.js";
import { GaminFplWaypoint, GarminFpl } from "./GarminFpl.js";

export class Gpx extends GarminFpl {
  read(configFileContent: string): void {
    this.cruisingAlt = undefined;
    const rteXml = this.getXmlNode(configFileContent, "rte");

    const rteptXmls = this.getXmlNodes(rteXml, "rtept");
    this.waypoints = rteptXmls.map((xml, index): GaminFplWaypoint => {
      const altString = this.getXmlNode(xml, "ele");
      const alt = altString ? Number(altString) * Units.feetPerMeter : undefined;
      if (alt !== undefined && index !== 0 && index !== rteptXmls.length - 1) {
        this.cruisingAlt = this.cruisingAlt !== undefined ? Math.max(this.cruisingAlt, alt) : alt;
      }

      return {
        identifier: this.getXmlNode(xml, "name") || "WP" + index.toFixed().padStart(2, "0"),
        type: index === 0 || index === rteptXmls.length - 1 ? "AIRPORT" : "USER WAYPOINT",
        lat: Number(this.getXmlAttribute(xml, "lat")),
        lon: Number(this.getXmlAttribute(xml, "lon")),
        alt: alt,
      };
    });
  }
}
