import { Units } from "../World/Units.js";
import { GaminFplWaypoint, GarminFpl, GarminFplWaypointType } from "./GarminFpl.js";

type SeeYouCupWaypointType = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17;

/**
 * @see http://download.naviter.com/docs/CUP-file-format-description.pdf
 */
export class SeeYouCup extends GarminFpl {
  read(configFileContent: string): void {
    this.waypoints = configFileContent
      .replace(/-----Related Tasks-----[\s\S]+$/m, "")
      .replace(/(^|,)"(.+?)"(,|$)/g, (match: string, start: string, center: string, end: string): string => {
        return start + center.replace(",", ";") + end;
      })
      .split(/\s*\n\s*/)
      .map((line): string[] => {
        return line.split(",");
      })
      .filter((parts: string[]): boolean => {
        return parts.length > 5 && parts[0] !== "name";
      })
      .map((parts: string[]): GaminFplWaypoint => {
        return {
          identifier: this.convertIdentifier(parts[1]),
          type: this.convertWaypointType(Number(parts[2]) as SeeYouCupWaypointType),
          lat: this.convertCoordinate(parts[3]),
          lon: this.convertCoordinate(parts[4]),
          elevationMeter: this.convertAltitude(parts[5]),
        };
      });
  }

  convertIdentifier(identifier: string): string {
    return identifier.replace(/[^a-zA-Z0-9_-]/g, "_").toUpperCase();
  }

  convertAltitude(altitude: string): number | undefined {
    const parts = altitude.match(/^([0-9.]+)(ft|m)$/);
    if (!parts) {
      return undefined;
    }

    return parts[2] === "ft" ? Number(parts[1]) / Units.feetPerMeter : Number(parts[1]);
  }

  /**
   * Waypoint style describes the type of the waypoint. If a value other than the ones listed below is found in the file the parser should default it to 0.
   */
  convertWaypointType(type: SeeYouCupWaypointType): GarminFplWaypointType {
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
   * Longitude It is a field of length 10, where 1-2 characters are degrees, 3-4 characters are minutes, 5 decimal point, 6-8 characters are decimal minutes and 9th character is either E or W. The ellipsoid used is WGS-1984
   * Latitude It is a field of length 9, where 1-2 characters are degrees, 3-4 characters are minutes, 5 decimal point, 6-8 characters are decimal minutes and 9th character is either N or S. The ellipsoid used is WGS-1984
   */
  convertCoordinate(coordinate: string): number {
    const parts = coordinate.match(/^(\d{1,3})(\d\d\.\d\d\d)([NSEW])$/);
    if (parts === null || parts.length < 4) {
      throw new Error(`Wrong coordinates format "${coordinate}"`);
    }

    let b = Number(parts[1]); // degree
    b += Number(parts[2]) / 60; // minutes
    return parts[3] === "S" || parts[3] === "W" ? -b : b;
  }
}
