import * as fs from "node:fs";
export class GarminFpl {
    constructor(filename) {
        this.filename = filename;
        this.waypoins = [];
        /**
         * In feet MSL
         */
        this.cruisingAlt = 0;
    }
    read() {
        if (!fs.existsSync(this.filename)) {
            throw new Error("File does not exist: " + this.filename);
        }
        const configFileContent = fs.readFileSync(this.filename, "utf8");
        if (!configFileContent) {
            throw new Error("File is empty: " + this.filename);
        }
        const waypointTableXml = this.getXmlNode(configFileContent, 'waypoint-table');
        this.waypoins = this.getXmlNodes(waypointTableXml, 'waypoint').map((xml) => {
            return {
                identifier: this.getXmlNode(xml, 'identifier'),
                type: this.getXmlNode(xml, 'type'),
                lat: Number(this.getXmlNode(xml, 'lat')),
                lon: Number(this.getXmlNode(xml, 'lon'))
            };
        });
    }
    getXmlNode(xml, tag) {
        const match = xml.match(new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, 'ms'));
        return match ? match[1] : "";
    }
    getXmlNodes(xml, tag) {
        const nodes = xml.match(new RegExp(`<${tag}.*?</${tag}>`, 'gms'));
        return nodes ? nodes : [];
    }
    getXmlAttribute(xml, attribute) {
        const regex = new RegExp(` ${attribute}="(.*?)"`, 'ms');
        const match = xml.match(regex);
        return match ? match[1] : "";
    }
}
