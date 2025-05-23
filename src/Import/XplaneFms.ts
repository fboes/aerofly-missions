import { MissionCheckpoint, MissionCheckpointTypeExtended } from "../Aerofly/MissionCheckpoint.js";
import { Units } from "../World/Units.js";
import { GaminFplWaypoint, GarminExportAbstract, GarminFpl, GarminFplWaypointType } from "./GarminFpl.js";

// It is 1 for airport, 2 for NDB, 3 for VOR, 11 for named fix and 28 for unnamed lat/lon waypoints.
type XplaneFmsWaypointType = 1 | 2 | 3 | 11 | 28;

/**
 * @see https://developer.x-plane.com/article/flightplan-files-v11-fms-file-format/
 * @see https://xp-soaring.github.io/tasks/x-plane_fms_format.html
 */
export class XplaneFms extends GarminFpl {
  static TYPE_AIRPORT: XplaneFmsWaypointType = 1;
  static TYPE_NDB: XplaneFmsWaypointType = 2;
  static TYPE_VOR: XplaneFmsWaypointType = 3;
  static TYPE_FIX: XplaneFmsWaypointType = 11;
  static TYPE_USER: XplaneFmsWaypointType = 28;

  read(configFileContent: string): void {
    const waypointLines = configFileContent.matchAll(
      /(?:^|\n)(\d+) (\S+).*? ([0-9.+-]+) ([0-9.+-]+) ([0-9.+-]+)(?:\n|$)/gm
    );
    if (!waypointLines) {
      throw new Error("No nav lines found");
    }

    const depRwy = configFileContent.match(/\sDEPRWY RW(\S+)/);
    if (depRwy) {
      this.departureRunway = depRwy[1];
    }
    const desRwy = configFileContent.match(/\sDESRWY RW(\S+)/);
    if (desRwy) {
      this.destinationRunway = desRwy[1];
    }

    const wLines = Array.from(waypointLines);
    this.waypoints = wLines.map((m, index): GaminFplWaypoint => {
      if (index !== 0 && index !== wLines.length - 1) {
        this.cruisingAltFt =
          this.cruisingAltFt !== undefined ? Math.max(this.cruisingAltFt, Number(m[3])) : Number(m[3]);
      }

      return {
        identifier: m[2],
        type: this.convertWaypointType(Number(m[1]) as XplaneFmsWaypointType),
        lat: Number(m[4]),
        lon: Number(m[5]),
        elevationMeter: Number(m[3]) / Units.feetPerMeter,
      };
    });
  }

  convertWaypointType(type: XplaneFmsWaypointType): GarminFplWaypointType {
    switch (type) {
      case XplaneFms.TYPE_AIRPORT:
        return "AIRPORT";
      case XplaneFms.TYPE_NDB:
        return "NDB";
      case XplaneFms.TYPE_VOR:
        return "VOR";
      default:
        return "USER WAYPOINT";
    }
  }
}

/**
 * @see https://developer.x-plane.com/article/flightplan-files-v11-fms-file-format/
 * @see https://xp-soaring.github.io/tasks/x-plane_fms_format.html
 */
export class XplaneFmsExport extends GarminExportAbstract {
  toString(): string {
    const m = this.mission;

    const departureRunwayCp = m.findCheckPointByType(MissionCheckpoint.TYPE_DEPARTURE_RUNWAY);
    const departureRunway = departureRunwayCp ? "\nDEPRWY RW" + departureRunwayCp.name : "";

    const destinationRunwayCp = m.findCheckPointByType(MissionCheckpoint.TYPE_DESTINATION_RUNWAY);
    const destinationRunway = destinationRunwayCp ? "\nDESRWY RW" + destinationRunwayCp.name : "";

    let pln = `I
1100 Version
CYCLE 1710
ADEP ${m.origin_icao}${departureRunway}
ADES ${m.destination_icao}${destinationRunway}
NUMENR ${m.checkpoints.length}
`;
    m.checkpoints.forEach((cp, index) => {
      const type = this.convertWaypointType(cp.type_extended);

      // ADEP/ADES for departure or destination airport of the flightplan,
      // DRCT for a direct or random route leg to the waypoint,
      //  or the name of an airway or ATS route to the waypoint.
      let via: "ADEP" | "ADES" | "DRCT" = "DRCT";
      if (type === XplaneFms.TYPE_AIRPORT && (index === 0 || index === m.checkpoints.length - 1)) {
        via = index === 0 ? "ADEP" : "ADES";
      }

      let name = cp.name;
      if (
        (cp.type === MissionCheckpoint.TYPE_DEPARTURE_RUNWAY ||
          cp.type === MissionCheckpoint.TYPE_DESTINATION_RUNWAY) &&
        !name.match(/^RW/)
      ) {
        name = "RW" + name;
      }

      pln += `${type} ${name} ${via} ${cp.lon_lat.altitude_ft.toFixed(6)} ${cp.lon_lat.lat.toFixed(
        6
      )} ${cp.lon_lat.lon.toFixed(6)}
`;
    });

    return pln;
  }

  convertWaypointType(type: MissionCheckpointTypeExtended): XplaneFmsWaypointType {
    switch (type) {
      case MissionCheckpoint.TYPE_AIRPORT:
        return XplaneFms.TYPE_AIRPORT;
      case MissionCheckpoint.TYPE_DESTINATION:
        return XplaneFms.TYPE_AIRPORT;
      case MissionCheckpoint.TYPE_WAYPOINT:
        return XplaneFms.TYPE_FIX;
      case MissionCheckpoint.TYPE_NDB:
        return XplaneFms.TYPE_NDB;
      case MissionCheckpoint.TYPE_ORIGIN:
        return XplaneFms.TYPE_AIRPORT;
      case MissionCheckpoint.TYPE_VOR:
        return XplaneFms.TYPE_VOR;
      default:
        return 28;
    }
  }
}
