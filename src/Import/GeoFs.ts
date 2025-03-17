import { Mission } from "../Aerofly/Mission.js";
import { MissionCheckpoint } from "../Aerofly/MissionCheckpoint.js";
import { GaminFplWaypoint, GarminFpl, GarminFplWaypointType } from "./GarminFpl.js";

/**
 * - `DPT` for departure airport. Only valid as first entry in the route array. Used to set aircraft in initial takeoff position. (The waypoint must also provide a "heading" value in order to set takeoff position correctly.)
 * - `DST` for destination airport. Only valid as last entry in the route array. Used to instruct autopilot to use ILS localizer and glide slope for automatic approach. (The waypoint must also provide a "heading" value in order to set generic ISL approach path)
 */
export type GeoFsNodeType =
  | "DPT"
  | "DST"
  | "RNW"
  | "WPT"
  | "FIX"
  | "ILS"
  | "DME"
  | "NDB"
  | "NDB-DME"
  | "VOR"
  | "VOR-DME"
  | "TACAN"
  | "VORTAC";

/**
 * @see https://www.geo-fs.com/pages/documentation.php
 */
export type GeoFsNode = {
  /**
   * the ICAO identification of the waypoint when it is a known navaid. FIX way point will bear the "FIX" ident code.
   */
  ident: string;
  type?: GeoFsNodeType;
  lat: number;
  lon: number;

  /**
   * used to set autopilot altitude at each waypoint and specify a basic altitude profile. Can be given in feet as int or in flight level as string (ie. "FL350"). Must be set to 0 for DPT and DST waypoints.
   */
  alt?: number | string | null;

  /**
   * used to set autopilot speed hold at each waypoint. Can be given in knots as int or as Mach when prefixed with M (is. "M0.85")
   */
  spd?: number | string | null;

  /**
   * vertical speed in m/s used to set autopilot vertical speed at each waypoint
   */
  vspeed?: number;

  /**
   * Used with DPT and DST waypoint types to set aircraft orientation and approach configuration
   */
  heading?: number | null;
};

export class GeoFs extends GarminFpl {
  read(configFileContent: string): void {
    const geoFsJson = JSON.parse(configFileContent) as GeoFsNode[];

    if (!Array.isArray(geoFsJson)) {
      throw Error("Missing array structure in GeoFS JSON file");
    }

    const departureRunwayNode = geoFsJson.at(1);
    this.departureRunway =
      departureRunwayNode && this.isRunway(departureRunwayNode.type) ? departureRunwayNode.ident : undefined;

    const destinationRunwayNode = geoFsJson.at(-2);
    this.destinationRunway =
      destinationRunwayNode && this.isRunway(destinationRunwayNode.type) ? destinationRunwayNode.ident : undefined;

    this.waypoints = geoFsJson
      .filter((geoFsNode: GeoFsNode): boolean => {
        return !this.isRunway(geoFsNode.type);
      })
      .map((geoFsNode: GeoFsNode): GaminFplWaypoint => {
        return {
          identifier: geoFsNode.ident,
          type: this.convertType(geoFsNode.type),
          lat: geoFsNode.lat,
          lon: geoFsNode.lon,
          alt: this.convertAltitude(geoFsNode.alt),
        };
      });

    this.cruisingAlt =
      this.waypoints.reduce((accumulator: number, waypoint: GaminFplWaypoint): number => {
        return Math.max(accumulator, waypoint.alt ?? 0);
      }, 0) || undefined;
  }

  /**
   *
   * @param alt Can be given in feet as int or in flight level as string (ie. "FL350").
   * @returns altitude in feet, converting FL to 100 ft
   */
  convertAltitude(alt: number | string | null | undefined): number | undefined {
    if (alt === undefined) {
      return undefined;
    }
    if (typeof alt === "string") {
      alt = Number(alt.replace(/^FL(\d+)$/, "$100"));
    }

    return alt ?? undefined;
  }

  convertType(type: GeoFsNodeType | undefined): GarminFplWaypointType {
    switch (type) {
      case "DPT":
      case "DST":
        return "AIRPORT";
      case "NDB":
      case "NDB-DME":
        return "NDB";
      case "VOR":
      case "VOR-DME":
      case "VORTAC":
        return "VOR";
      default:
        return "USER WAYPOINT";
    }
  }

  isRunway(type: GeoFsNodeType | undefined): boolean {
    return ["RNW", "ILS"].includes(type ?? "");
  }
}

export class GeoFsExport {
  constructor(protected mission: Mission) {}

  toJSON(): GeoFsNode[] {
    const m = this.mission;
    const lastIndex = m.checkpoints.length - 1;

    return m.checkpoints.map((cp: MissionCheckpoint, index: number): GeoFsNode => {
      const lonLat = index === 0 ? m.origin_lon_lat : cp.lon_lat;

      let heading = undefined;
      if (index === 0 && m.origin_dir >= 0) {
        heading = m.origin_dir;
      } else if (index === lastIndex && m.destination_dir >= 0) {
        heading = m.destination_dir;
      }

      const alt = [MissionCheckpoint.TYPE_ORIGIN, MissionCheckpoint.TYPE_DESTINATION].includes(cp.type)
        ? 0
        : Math.round(lonLat.altitude_ft) || null;

      return {
        ident: cp.name,
        type: this.convertType(cp),
        lat: lonLat.lat,
        lon: lonLat.lon,
        alt,
        spd: cp.speed > 0 ? cp.speed : null,
        heading,
      };
    });
  }

  toString(): string {
    return JSON.stringify(this);
  }

  convertType(cp: MissionCheckpoint): GeoFsNodeType {
    switch (cp.type_extended) {
      case MissionCheckpoint.TYPE_ORIGIN:
        return "DPT";
      case MissionCheckpoint.TYPE_DESTINATION:
        return "DST";
      case MissionCheckpoint.TYPE_DEPARTURE_RUNWAY:
      case MissionCheckpoint.TYPE_DESTINATION_RUNWAY:
        return cp.frequency ? "ILS" : "RNW";
      case MissionCheckpoint.TYPE_FIX:
        return "FIX";
      case MissionCheckpoint.TYPE_NDB:
        return "NDB";
      case MissionCheckpoint.TYPE_VOR:
        return "VOR";
      default:
        return "WPT";
    }
  }
}
