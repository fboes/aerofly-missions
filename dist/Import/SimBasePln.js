import * as fs from "node:fs";
import { LonLat } from "../World/LonLat.js";
import { GarminFpl } from "./GarminFpl.js";
/**
 * @see https://docs.flightsimulator.com/html/Content_Configuration/Flights_And_Missions/Flight_Plan_Definitions.htm
 */
export class SimBasePln extends GarminFpl {
    read() {
        if (!fs.existsSync(this.filename)) {
            throw new Error("File does not exist: " + this.filename);
        }
        const configFileContent = fs.readFileSync(this.filename, "utf8");
        if (!configFileContent) {
            throw new Error("File is empty: " + this.filename);
        }
        const waypointTableXml = this.getXmlNode(configFileContent, "FlightPlan.FlightPlan");
        this.cruisingAlt = Number(this.getXmlNode(waypointTableXml, "CruisingAlt"));
        this.waypoins = this.getXmlNodes(waypointTableXml, "ATCWaypoint").map((xml) => {
            // N52° 45' 7.51",W3° 53' 2.16",+002500.00
            const worldPosition = this.getXmlNode(xml, "WorldPosition");
            const coords = this.convertCoordinate(worldPosition);
            let type = this.getXmlNode(xml, "ATCWaypointType").toUpperCase();
            if (type === "USER") {
                type += " WAYPOINT";
            }
            return {
                identifier: this.getXmlNode(xml, 'ICAOIdent') || this.getXmlAttribute(xml, "id"),
                type: type,
                lat: coords.lat,
                lon: coords.lon,
            };
        });
    }
    convertCoordinate(coordinate) {
        const parts = coordinate.split(/,\s*/);
        if (parts.length < 2) {
            throw new Error(`Wrong coordinates format "${coordinate}", expexted something like N52° 45' 7.51",W3° 53' 2.16",+002500.00`);
        }
        const numbers = parts.map((p) => {
            const m = p.match(/([NSEW])(\d+)\D+(\d+)\D+([0-9.]+)/);
            if (m) {
                let b = Number(m[2]); // degree
                b += Number(m[3]) / 60; // minutes
                b += Number(m[4]) / 3600; // seconds
                return (m[1] === 'S' || m[1] === 'W') ? -b : b;
            }
            return 0;
        });
        return new LonLat(numbers[1], numbers[0]);
    }
}
