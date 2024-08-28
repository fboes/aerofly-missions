import { Quote } from "../Export/Quote.js";
export class GarminFpl {
    constructor(configFileContent) {
        this.waypoints = [];
        this.read(configFileContent);
    }
    /**
     * @see https://www8.garmin.com/xmlschemas/FlightPlanv1.xsd
     * @param configFileContent
     */
    read(configFileContent) {
        this.cruisingAlt = undefined;
        // Get waypoint definitions
        const waypointDefinitions = new Map();
        const waypointTableXml = this.getXmlNode(configFileContent, "waypoint-table") || this.getXmlNode(configFileContent, "waypoints");
        this.getXmlNodes(waypointTableXml, "waypoint").forEach((xml) => {
            const elevation = this.getXmlNode(xml, "elevation");
            waypointDefinitions.set(this.getXmlNode(xml, "identifier"), {
                identifier: this.getXmlNode(xml, "identifier"),
                type: this.getXmlNode(xml, "type"),
                lat: Number(this.getXmlNode(xml, "lat")),
                lon: Number(this.getXmlNode(xml, "lon")),
                alt: elevation ? Number(elevation) : undefined,
            });
            // country-code
        });
        //  Always fetch first route
        const routeTableXml = this.getXmlNode(configFileContent, "route");
        this.waypoints = this.getXmlNodes(routeTableXml, "route-point").map((xml) => {
            const waypointDefinition = waypointDefinitions.get(this.getXmlNode(xml, "waypoint-identifier"));
            if (waypointDefinition === undefined) {
                throw new Error("Missing waypoint definition for route point");
            }
            return waypointDefinition;
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
