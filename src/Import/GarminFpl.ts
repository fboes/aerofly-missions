import { Mission } from "../Aerofly/Mission.js";
import { MissionCheckpoint, MissionCheckpointTypeExtended } from "../Aerofly/MissionCheckpoint.js";
import { Quote } from "../Export/Quote.js";

export type GarminFplWaypointType = "AIRPORT" | "USER WAYPOINT" | "NDB" | "VOR" | "INT" | "INT-VRP";

export type GaminFplWaypoint = {
  identifier: string;
  type: GarminFplWaypointType;
  lat: number;
  lon: number;

  /**
   *  Elevation (in meters) of the waypoint.
   */
  alt?: number;

  /**
   * The country code should be the empty string for user waypoints.
   */
  countryCode?: string;
};

export class GarminFpl {
  waypoints: GaminFplWaypoint[] = [];
  /**
   * In feet MSL
   */
  cruisingAlt?: number;
  departureRunway?: string;
  destinationRunway?: string;

  constructor(configFileContent: string) {
    this.read(configFileContent);
  }

  /**
   * @see https://www8.garmin.com/xmlschemas/FlightPlanv1.xsd
   * @param configFileContent
   */
  read(configFileContent: string): void {
    this.cruisingAlt = undefined;

    // Get waypoint definitions
    const waypointDefinitions: Map<string, GaminFplWaypoint> = new Map();
    const waypointTableXml =
      this.getXmlNode(configFileContent, "waypoint-table") || this.getXmlNode(configFileContent, "waypoints");
    this.getXmlNodes(waypointTableXml, "waypoint").forEach((xml) => {
      const elevation = this.getXmlNode(xml, "elevation");
      waypointDefinitions.set(this.getXmlNode(xml, "identifier"), {
        identifier: this.getXmlNode(xml, "identifier"),
        type: <GarminFplWaypointType>this.getXmlNode(xml, "type"),
        lat: Number(this.getXmlNode(xml, "lat")),
        lon: Number(this.getXmlNode(xml, "lon")),
        alt: elevation ? Number(elevation) : undefined,
        countryCode: this.getXmlNode(xml, "country-code") || undefined,
      });
    });

    //  Always fetch first route
    const routeTableXml = this.getXmlNode(configFileContent, "route");
    this.waypoints = this.getXmlNodes(routeTableXml, "route-point").map((xml): GaminFplWaypoint => {
      const waypointDefinition = waypointDefinitions.get(this.getXmlNode(xml, "waypoint-identifier"));
      if (waypointDefinition === undefined) {
        throw new Error("Missing waypoint definition for route point");
      }
      return waypointDefinition;
    });
  }

  protected getXmlNode(xml: string, tag: string): string {
    const match = xml.match(new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, "ms"));
    return match ? Quote.unXml(match[1]) : "";
  }

  protected getXmlNodes(xml: string, tag: string): string[] {
    const nodes = xml.match(new RegExp(`<${tag}.*?</${tag}>`, "gms"));

    return nodes ? nodes : [];
  }

  protected getXmlAttribute(xml: string, attribute: string): string {
    const regex = new RegExp(` ${attribute}="(.*?)"`, "ms");
    const match = xml.match(regex);
    return match ? Quote.unXml(match[1]) : "";
  }
}

export class GarminExport {
  constructor(protected mission: Mission) {}

  toString(): string {
    const routePoints = this.mission.checkpoints.map((cp): GaminFplWaypoint => {
      return {
        identifier: cp.name,
        type: this.convertWaypointType(cp.type_extended),
        lat: cp.lon_lat.lat,
        lon: cp.lon_lat.lon,
        alt: cp.lon_lat.altitude_ft,
        countryCode: cp.icao_region ?? undefined,
      };
    });

    let pln = `\
<?xml version="1.0" encoding="utf-8"?>
<flight-plan xmlns="http://www8.garmin.com/xmlschemas/FlightPlan/v1">
  <created>2022-12-06T08:04:27Z</created>
  <waypoint-table>
${this.#geWaypointXml(routePoints)}
  </waypoint-table>
  <route>
    <route-name>${Quote.xml(this.mission.title)}</route-name>
    <flight-plan-index>1</flight-plan-index>
${this.#getRouteXml(routePoints)}
  </route>
</flight-plan>
`;

    return pln;
  }

  /**
   *
   * @param routePoints
   * @returns  An unordered list of unique waypoints referenced by a flight plan. This table may also contain waypoints not referenced by the route of a flight plan.
   */
  #geWaypointXml(routePoints: GaminFplWaypoint[]): string {
    const waypoints = routePoints.map((rp): string => {
      return `\
    <waypoint>
      <identifier>${Quote.xml(rp.identifier)}</identifier>
      <type>${Quote.xml(rp.type)}</type>
      <country-code>${Quote.xml(rp.countryCode || "")}</country-code>
      <lat>${Quote.xml(rp.lat.toString())}</lat>
      <lon>${Quote.xml(rp.lon.toString())}</lon>
      <elevation>${Quote.xml((rp.alt || "").toString())}</elevation>
      <comment />
    </waypoint>`;
    });

    return [...new Set(waypoints)].join("\n");
  }

  #getRouteXml(routePoints: GaminFplWaypoint[]): string {
    return routePoints
      .map((rp): string => {
        return `\
    <route-point>
      <waypoint-identifier>${Quote.xml(rp.identifier)}</waypoint-identifier>
      <waypoint-type>${Quote.xml(rp.type)}</waypoint-type>
      <waypoint-country-code>${Quote.xml(rp.countryCode ?? "")}</waypoint-country-code>
    </route-point>`;
      })
      .join("\n");
  }

  convertWaypointType(type: MissionCheckpointTypeExtended): GarminFplWaypointType {
    switch (type) {
      case MissionCheckpoint.TYPE_AIRPORT:
      case MissionCheckpoint.TYPE_DESTINATION:
      case MissionCheckpoint.TYPE_ORIGIN:
        return "AIRPORT";
      case MissionCheckpoint.TYPE_INTERSECTION:
        return "INT";
      case MissionCheckpoint.TYPE_NDB:
        return "NDB";
      case MissionCheckpoint.TYPE_VOR:
        return "VOR";
      default:
        return "USER WAYPOINT";
    }
  }
}
