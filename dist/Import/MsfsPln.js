import { MissionCheckpoint } from "../Aerofly/MissionCheckpoint.js";
import { Quote } from "../Export/Quote.js";
import { LonLat } from "../World/LonLat.js";
import { Units } from "../World/Units.js";
import { GarminFpl } from "./GarminFpl.js";
/**
 * @see https://docs.flightsimulator.com/html/Content_Configuration/Flights_And_Missions/Flight_Plan_Definitions.htm
 */
export class MsfsPln extends GarminFpl {
    read(configFileContent) {
        const waypointTableXml = this.getXmlNode(configFileContent, "FlightPlan.FlightPlan");
        this.cruisingAlt = Number(this.getXmlNode(waypointTableXml, "CruisingAlt"));
        this.waypoints = this.getXmlNodes(waypointTableXml, "ATCWaypoint").map((xml) => {
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
                alt: coords.altitude_ft
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
        return new LonLat(numbers[1], numbers[0], Number(parts[2] || 0) / Units.feetPerMeter);
    }
}
/**
 * @see https://docs.flightsimulator.com/html/Content_Configuration/Flights_And_Missions/Flight_Plan_Definitions.htm
 */
export class MsfsPlnExport {
    constructor(mission) {
        this.mission = mission;
    }
    getLla(lon_lat) {
        // N53° 14' 48.24",W4° 32' 7.71",+000025.00
        // N53° 14' 48.24",W4° 32' 7.71",+000025.00
        const lat = lon_lat.latMinute;
        const lon = lon_lat.lonMinute;
        return lon_lat.latHemisphere + Math.abs(lat.degree).toFixed() + "° " + lat.minutes.toFixed() + "' " + lat.seconds.toFixed(2) + '"'
            + ','
            + lon_lat.lonHemisphere + Math.abs(lon.degree).toFixed() + "° " + lon.minutes.toFixed() + "' " + lon.seconds.toFixed(2) + '"'
            + ','
            + (lon_lat.altitude_m >= 0 ? '+' : '-')
            + Math.abs(lon_lat.altitude_ft).toFixed(2).padStart(9, '0');
    }
    toString() {
        const m = this.mission;
        let pln = `<?xml version="1.0" encoding="UTF-8"?>
    <SimBase.Document Type="AceXML" version="1,0">
        <!-- Exported by Aerofly Missionsgerät -->
        <Descr>AceXML Document</Descr>
        <FlightPlan.FlightPlan>
            <Title>${Quote.xml(m.title)}</Title>
            <FPType>${Quote.xml(m.conditions.getFlightCategory(true))}</FPType>
            <RouteType>Direct</RouteType>
            <CruisingAlt>${Quote.xml(m.cruise_altitude_ft.toFixed())}</CruisingAlt>
            <DepartureID>${Quote.xml(m.origin_icao)}</DepartureID>
            <DepartureLLA>${(this.getLla(m.origin_lon_lat))}</DepartureLLA>
            <DestinationID>${Quote.xml(m.destination_icao)}</DestinationID>
            <DestinationLLA>${(this.getLla(m.destination_lon_lat))}</DestinationLLA>
            <Descr>${Quote.xml(m.description)}</Descr>
            <!--DeparturePosition></DeparturePosition-->
            <DepartureName>${Quote.xml(m.origin_icao)}</DepartureName>
            <DestinationName>${Quote.xml(m.destination_icao)}</DestinationName>
            <AppVersion>
                <AppVersionMajor>10</AppVersionMajor>
                <AppVersionBuild>61472</AppVersionBuild>
            </AppVersion>
`;
        // @see https://en.wikipedia.org/wiki/ICAO_airport_code#/media/File:ICAO_FirstLetter.svg
        let icaoRegion = m.origin_icao.substring(0, 1);
        m.checkpoints.forEach(cp => {
            let type;
            type = (cp.type === MissionCheckpoint.TYPE_ORIGIN || cp.type === MissionCheckpoint.TYPE_DESTINATION)
                ? 'Airport'
                : 'User';
            if (type === 'User' && cp.frequency) {
                type = cp.frequency_unit === 'M' ? 'VOR' : 'NDB';
            }
            let name = cp.name;
            if ((cp.type === MissionCheckpoint.TYPE_DEPARTURE_RUNWAY || cp.type === MissionCheckpoint.TYPE_DESTINATION_RUNWAY) && !name.match(/^RW/)) {
                name = 'RW' + name;
            }
            pln += `            <ATCWaypoint id="${Quote.xml(name)}">
                <ATCWaypointType>${Quote.xml(type)}</ATCWaypointType>
                <WorldPosition>${(this.getLla(cp.lon_lat))}</WorldPosition>
`;
            if (type !== 'User') {
                pln += `                <ICAO>
                    <ICAOIdent>${Quote.xml(cp.name)}</ICAOIdent>
                    <ICAORegion>${Quote.xml(icaoRegion)}</ICAORegion>
                </ICAO>
`;
            }
            pln += `            </ATCWaypoint>
`;
        });
        pln += `        </FlightPlan.FlightPlan>
    </SimBase.Document>
`;
        return pln;
    }
}
