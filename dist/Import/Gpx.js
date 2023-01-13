import { Units } from "../World/Units.js";
import { GarminFpl } from "./GarminFpl.js";
export class Gpx extends GarminFpl {
    read(configFileContent) {
        this.cruisingAlt = 0;
        const rteXml = this.getXmlNode(configFileContent, 'rte');
        const rteptXmls = this.getXmlNodes(rteXml, 'rtept');
        this.waypoints = rteptXmls.map((xml, index) => {
            const alt = Number(this.getXmlNode(xml, 'ele')) * Units.feetPerMeter;
            if (index !== 0 && index !== rteptXmls.length - 1) {
                this.cruisingAlt = Math.max(this.cruisingAlt, alt);
            }
            return {
                identifier: this.getXmlNode(xml, 'name') || 'WP' + index.toFixed().padStart(2, '0'),
                type: (index === 0 || index === rteptXmls.length - 1) ? 'AIRPORT' : 'USER WAYPOINT',
                lat: Number(this.getXmlAttribute(xml, 'lat')),
                lon: Number(this.getXmlAttribute(xml, 'lon')),
                alt: alt
            };
        });
    }
}
