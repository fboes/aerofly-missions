import { Quote } from "../Export/Quote.js";

export type GarminFplWaypointType = "AIRPORT" | "USER WAYPOINT" | "NDB" | "VOR" | "INT" | "INT-VRP";

export type GaminFplWaypoint = {
  identifier: string;
  type: GarminFplWaypointType;
  lat: number;
  lon: number;
  alt?: number;
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
    const waypointTableXml = this.getXmlNode(configFileContent, "waypoint-table") || this.getXmlNode(configFileContent, "waypoints");
    this.getXmlNodes(waypointTableXml, "waypoint").forEach((xml) => {
      const elevation = this.getXmlNode(xml, "elevation");
      waypointDefinitions.set(this.getXmlNode(xml, "identifier"), {
        identifier: this.getXmlNode(xml, "identifier"),
        type: <GarminFplWaypointType>this.getXmlNode(xml, "type"),
        lat: Number(this.getXmlNode(xml, "lat")),
        lon: Number(this.getXmlNode(xml, "lon")),
        alt: elevation ? Number(elevation) : undefined,
      });

      // country-code
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
