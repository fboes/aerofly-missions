import { Quote } from "../Export/Quote.js";
export class GarminFpl {
    constructor(configFileContent) {
        this.waypoints = [];
        this.read(configFileContent);
    }
    read(configFileContent) {
        this.cruisingAlt = undefined;
        const waypointTableXml = this.getXmlNode(configFileContent, "waypoint-table");
        this.waypoints = this.getXmlNodes(waypointTableXml, "waypoint").map((xml) => {
            return {
                identifier: this.getXmlNode(xml, "identifier"),
                type: this.getXmlNode(xml, "type"),
                lat: Number(this.getXmlNode(xml, "lat")),
                lon: Number(this.getXmlNode(xml, "lon")),
                alt: undefined,
            };
        });
    }
    getXmlNode(xml, tag) {
        const match = xml.match(new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, "ms"));
        return match ? Quote.unXml(match[1]) : "";
    }
    getXmlNodes(xml, tag) {
        const nodes = xml.match(new RegExp(`<${tag}.*?</${tag}>`, "gms"));
        return nodes ? nodes : [];
    }
    getXmlAttribute(xml, attribute) {
        const regex = new RegExp(` ${attribute}="(.*?)"`, "ms");
        const match = xml.match(regex);
        return match ? Quote.unXml(match[1]) : "";
    }
}
