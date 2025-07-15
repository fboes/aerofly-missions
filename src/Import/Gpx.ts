import { Units } from "../World/Units.js";
import { GaminFplWaypoint, GarminFpl, GarminFplWaypointType } from "./GarminFpl.js";

export class Gpx extends GarminFpl {
  read(configFileContent: string): void {
    this.cruisingAltFt = undefined;
    const rteXml = this.getXmlNode(configFileContent, "rte");

    const rteptXmls = this.getXmlNodes(rteXml, "rtept");
    this.waypoints = rteptXmls.map((xml, index): GaminFplWaypoint => {
      const altString = this.getXmlNode(xml, "ele");
      const alt = altString ? Number(altString) * Units.feetPerMeter : undefined;
      if (alt !== undefined && index !== 0 && index !== rteptXmls.length - 1) {
        this.cruisingAltFt =
          this.cruisingAltFt !== undefined
            ? Math.max(this.cruisingAltFt, alt * Units.feetPerMeter)
            : alt * Units.feetPerMeter;
      }

      const type = this.getXmlNode(xml, "sym") || (index === 0 || index === rteptXmls.length - 1 ? "Airport" : "");

      return {
        identifier: this.getXmlNode(xml, "name") || "WP" + index.toFixed().padStart(2, "0"),
        type: this.convertWaypointType(type),
        lat: Number(this.getXmlAttribute(xml, "lat")),
        lon: Number(this.getXmlAttribute(xml, "lon")),
        elevationMeter: alt,
      };
    });
  }

  /**
   * @see https://www.gpsbabel.org/htmldoc-development/GarminIcons.html
   */
  convertWaypointType(type: string): GarminFplWaypointType {
    switch (type) {
      case "Airport":
      case "Heliport":
        return "AIRPORT";
      case "Intersection":
        return "INT";
      case "Non-directional beacon":
        return "NDB";
      case "TACAN":
      case "VHF Omni-range":
      case "VOR-DME":
      case "VOR/TACAN":
        return "VOR";
      // case "Waypoint":
      default:
        return "USER WAYPOINT";
    }
  }
}
