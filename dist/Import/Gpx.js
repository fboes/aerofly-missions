import { Units } from "../World/Units.js";
import { GarminFpl } from "./GarminFpl.js";
export class Gpx extends GarminFpl {
    read(configFileContent) {
        this.cruisingAltFt = undefined;
        const rteXml = this.getXmlNode(configFileContent, "rte");
        const rteptXmls = this.getXmlNodes(rteXml, "rtept");
        this.waypoints = rteptXmls.map((xml, index) => {
            const altString = this.getXmlNode(xml, "ele");
            const alt = altString ? Number(altString) * Units.feetPerMeter : undefined;
            if (alt !== undefined && index !== 0 && index !== rteptXmls.length - 1) {
                this.cruisingAltFt =
                    this.cruisingAltFt !== undefined
                        ? Math.max(this.cruisingAltFt, alt * Units.feetPerMeter)
                        : alt * Units.feetPerMeter;
            }
            return {
                identifier: this.getXmlNode(xml, "name") || "WP" + index.toFixed().padStart(2, "0"),
                type: index === 0 || index === rteptXmls.length - 1 ? "AIRPORT" : "USER WAYPOINT",
                lat: Number(this.getXmlAttribute(xml, "lat")),
                lon: Number(this.getXmlAttribute(xml, "lon")),
                elevationMeter: alt,
            };
        });
    }
}
