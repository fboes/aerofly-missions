var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _GarminExport_instances, _GarminExport_geWaypointXml, _GarminExport_getRouteXml;
import { MissionCheckpoint } from "../Aerofly/MissionCheckpoint.js";
import { asciify } from "../Cli/Arguments.js";
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
        this.cruisingAltFt = undefined;
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
                elevationMeter: elevation ? Number(elevation) : undefined,
                countryCode: this.getXmlNode(xml, "country-code") || undefined,
            });
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
/**
 * @see https://www8.garmin.com/xmlschemas/FlightPlanv1.xsd
 */
export class GarminExport {
    constructor(mission) {
        this.mission = mission;
        _GarminExport_instances.add(this);
    }
    toString() {
        const routePoints = this.mission.checkpoints.map((cp) => {
            var _a;
            return {
                identifier: cp.name,
                type: this.convertWaypointType(cp.type_extended),
                lat: cp.lon_lat.lat,
                lon: cp.lon_lat.lon,
                elevationMeter: cp.lon_lat.altitude_m,
                countryCode: (_a = cp.icao_region) !== null && _a !== void 0 ? _a : undefined,
            };
        });
        const routeName = asciify(this.mission.title)
            .toUpperCase()
            .replace(/_/g, " ")
            .replace(/[^A-Z0-9 ]+/g, "")
            .substring(0, 25);
        let pln = `\
<?xml version="1.0" encoding="utf-8"?>
<flight-plan xmlns="http://www8.garmin.com/xmlschemas/FlightPlan/v1"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www8.garmin.com/xmlschemas/FlightPlan/v1 https://www8.garmin.com/xmlschemas/FlightPlanv1.xsd">
  <waypoint-table>
${__classPrivateFieldGet(this, _GarminExport_instances, "m", _GarminExport_geWaypointXml).call(this, routePoints)}
  </waypoint-table>
  <route>
    <route-name>${Quote.xml(routeName)}</route-name>
    <route-description>${Quote.xml(this.mission.description)}</route-description>
    <flight-plan-index>1</flight-plan-index>
${__classPrivateFieldGet(this, _GarminExport_instances, "m", _GarminExport_getRouteXml).call(this, routePoints)}
  </route>
</flight-plan>
`;
        return pln;
    }
    convertWaypointType(type) {
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
_GarminExport_instances = new WeakSet(), _GarminExport_geWaypointXml = function _GarminExport_geWaypointXml(routePoints) {
    const waypoints = routePoints.map((rp) => {
        const elevation = rp.elevationMeter
            ? `      <elevation>${Quote.xml(rp.elevationMeter.toString())}</elevation>
`
            : ``;
        return `\
    <waypoint>
      <identifier>${Quote.xml(rp.identifier)}</identifier>
      <type>${Quote.xml(rp.type)}</type>
      <country-code>${Quote.xml(rp.countryCode || "")}</country-code>
      <lat>${Quote.xml(rp.lat.toString())}</lat>
      <lon>${Quote.xml(rp.lon.toString())}</lon>
      <comment />
${elevation}\
    </waypoint>`;
    });
    return [...new Set(waypoints)].join("\n");
}, _GarminExport_getRouteXml = function _GarminExport_getRouteXml(routePoints) {
    return routePoints
        .map((rp) => {
        var _a;
        return `\
    <route-point>
      <waypoint-identifier>${Quote.xml(rp.identifier)}</waypoint-identifier>
      <waypoint-type>${Quote.xml(rp.type)}</waypoint-type>
      <waypoint-country-code>${Quote.xml((_a = rp.countryCode) !== null && _a !== void 0 ? _a : "")}</waypoint-country-code>
    </route-point>`;
    })
        .join("\n");
};
