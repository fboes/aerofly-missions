import { Units } from "../World/Units.js";
import { GarminFpl } from "./GarminFpl.js";
/**
 * @see http://download.naviter.com/docs/CUP-file-format-description.pdf
 */
export class SeeYouCup extends GarminFpl {
    read(configFileContent) {
        this.waypoints = configFileContent
            .replace(/-----Related Tasks-----[\s\S]+$/m, "")
            .split(/\s*\n\s*/)
            .map((line) => {
            return line.split(",");
        })
            .filter((parts) => {
            return parts.length > 5 && parts[0] !== "name";
        })
            .map((parts) => {
            return {
                identifier: parts[1],
                type: this.convertWaypointType(Number(parts[2])),
                lat: this.convertCoordinate(parts[3]),
                lon: this.convertCoordinate(parts[4]),
                alt: this.convertAltitude(parts[5]),
            };
        });
    }
    convertAltitude(altitude) {
        const parts = altitude.match(/^([0-9.]+)(ft|m)$/);
        if (!parts) {
            return undefined;
        }
        return parts[2] === "ft" ? Number(parts[1]) / Units.feetPerMeter : Number(parts[1]);
    }
    /**
     * Waypoint style describes the type of the waypoint. If a value other than the ones listed below is found in the file the parser should default it to 0.
     */
    convertWaypointType(type) {
        switch (type) {
            case 2:
            case 3:
            case 4:
            case 5:
                return "AIRPORT";
            case 9:
                return "NDB";
            case 10:
                return "VOR";
            default:
                return "USER WAYPOINT";
        }
    }
    /**
     * Longitude It is a field of length 10, where 1-2 characters are degrees, 3-4 characters are minutes, 5 decimal point, 6-8 characters are decimal minutes and 9th character is either N or S. The ellipsoid used is WGS-1984
     * Latitude It is a field of length 9, where 1-2 characters are degrees, 3-4 characters are minutes, 5 decimal point, 6-8 characters are decimal minutes and 9th character is either N or S. The ellipsoid used is WGS-1984
     */
    convertCoordinate(coordinate) {
        const parts = coordinate.match(/^(\d{1,3})(\d\d)\.(\d\d\d)([NSEW])$/);
        if (parts === null || parts.length < 5) {
            throw new Error(`Wrong coordinates format "${coordinate}"`);
        }
        let b = Number(parts[1]); // degree
        b += Number(parts[2]) / 60; // minutes
        b += Number(parts[3]) / 3600; // seconds
        return parts[4] === "S" || parts[4] === "W" ? -b : b;
    }
}
