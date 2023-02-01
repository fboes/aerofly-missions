import { Mission } from "../Aerofly/Mission.js";
import { MissionCheckpoint } from "../Aerofly/MissionCheckpoint.js";
import { Quote } from "../Export/Quote.js";
import { LonLat } from "../World/LonLat.js";
import { Units } from "../World/Units.js";
import { GaminFplWaypoint, GarminFpl, GarminFplWaypointType } from "./GarminFpl.js";

/**
 * @see https://docs.flightsimulator.com/html/Content_Configuration/Flights_And_Missions/Flight_Plan_Definitions.htm
 */
export class MsfsPln extends GarminFpl {
  read(configFileContent: string): void {
    const waypointTableXml = this.getXmlNode(configFileContent, "FlightPlan.FlightPlan");

    this.cruisingAlt = Number(this.getXmlNode(waypointTableXml, "CruisingAlt"))
    this.waypoints = this.getXmlNodes(waypointTableXml, "ATCWaypoint").map((xml): GaminFplWaypoint => {
      // N52° 45' 7.51",W3° 53' 2.16",+002500.00
      const worldPosition = this.getXmlNode(xml, "WorldPosition");
      const coords = this.convertCoordinate(worldPosition);
      let type = this.getXmlNode(xml, "ATCWaypointType").toUpperCase();
      if (type === "USER") {
        type += " WAYPOINT";
      }

      return {
        identifier: this.getXmlNode(xml, 'ICAOIdent') || this.getXmlAttribute(xml, "id"),
        type: <GarminFplWaypointType>type,
        lat: coords.lat,
        lon: coords.lon,
        alt: coords.altitude_ft
      };
    });
  }

  convertCoordinate(coordinate: string): LonLat {
    const parts = coordinate.split(/,\s*/);
    if (parts.length < 2) {
      throw new Error(`Wrong coordinates format "${coordinate}", expexted something like N52° 45' 7.51",W3° 53' 2.16",+002500.00`);

    }
    const numbers = parts.map((p): number => {
      const m = p.match(/([NSEW])(\d+)\D+(\d+)\D+([0-9.]+)/);
      if (m) {
        let b = Number(m[2]); // degree
        b += Number(m[3]) / 60; // minutes
        b += Number(m[4]) / 3600; // seconds
        return (m[1] === 'S' || m[1] === 'W') ? -b : b;
      }
      return 0;
    })
    return new LonLat(numbers[1], numbers[0], Number(parts[2] || 0) / Units.feetPerMeter);
  }
}

/**
 * @see https://docs.flightsimulator.com/html/Content_Configuration/Flights_And_Missions/Flight_Plan_Definitions.htm
 */
export class MsfsPlnExport {
  constructor(protected mission: Mission) { }

  getLla(lon_lat: LonLat): string {
    // N53° 14' 48.24",W4° 32' 7.71",+000025.00
    // N53° 14' 48.24",W4° 32' 7.71",+000025.00
    const lat = lon_lat.latMinute;
    const lon = lon_lat.lonMinute;
    return lon_lat.latHemisphere + Math.abs(lat.degree).toFixed() + "° " + lat.minutes.toFixed() + "' " + lat.seconds.toFixed(2) + '"'
      + ','
      + lon_lat.lonHemisphere + Math.abs(lon.degree).toFixed() + "° " + lon.minutes.toFixed() + "' " + lon.seconds.toFixed(2) + '"'
      + ','
      + (lon_lat.altitude_m >= 0 ? '+' : '-')
      + Math.abs(lon_lat.altitude_ft).toFixed(2).padStart(9, '0')
  }

  toString(): string {
    const m = this.mission;
    // @see https://en.wikipedia.org/wiki/ICAO_airport_code#/media/File:ICAO_FirstLetter.svg
    const icaoRegion = m.origin_icao.substring(0, 1)
    const departureRunway = m.checkpoints[1] && m.checkpoints[1].type === MissionCheckpoint.TYPE_DEPARTURE_RUNWAY
      ? m.checkpoints[1].name : '';
    const runwayIndex = m.checkpoints.length - 2;
    const destinationRunway = m.checkpoints[runwayIndex] && m.checkpoints[runwayIndex].type === MissionCheckpoint.TYPE_DESTINATION_RUNWAY
      ? m.checkpoints[runwayIndex].name : '';

    let pln = `<?xml version="1.0" encoding="UTF-8"?>
    <SimBase.Document Type="AceXML" version="1,0">
        <!-- Exported by Aerofly Missionsgerät -->
        <Descr>AceXML Document</Descr>
        <FlightPlan.FlightPlan>
            <Title>${Quote.xml(m.title)}</Title>
            <Descr>${Quote.xml(m.description)}</Descr>
            <FPType>${Quote.xml(m.conditions.getFlightCategory(true))}</FPType>
            <RouteType>Direct</RouteType>
            <CruisingAlt>${Quote.xml(m.cruise_altitude_ft.toFixed())}</CruisingAlt>
            <DepartureID>${Quote.xml(m.origin_icao)}</DepartureID>
            <DepartureName>${Quote.xml(m.origin_icao)}</DepartureName>
            <DepartureLLA>${(this.getLla(m.origin_lon_lat))}</DepartureLLA>
            <!--DeparturePosition></DeparturePosition-->
            <DestinationID>${Quote.xml(m.destination_icao)}</DestinationID>
            <DestinationName>${Quote.xml(m.destination_icao)}</DestinationName>
            <DestinationLLA>${(this.getLla(m.destination_lon_lat))}</DestinationLLA>
            <AppVersion>
                <AppVersionMajor>10</AppVersionMajor>
                <AppVersionBuild>61472</AppVersionBuild>
            </AppVersion>
`;

    m.checkpoints.forEach(cp => {
      let type: 'none' | 'Airport' | 'Intersection' | 'VOR' | 'NDB' | 'User' | 'ATC';
      type = (cp.type === MissionCheckpoint.TYPE_ORIGIN || cp.type === MissionCheckpoint.TYPE_DESTINATION)
        ? 'Airport'
        : 'User';
      if (type === 'User') {
        switch (cp.type_extended) {
          case MissionCheckpoint.TYPE_VOR: type = 'VOR'; break;
          case MissionCheckpoint.TYPE_NDB: type = 'NDB'; break;
          case MissionCheckpoint.TYPE_INTERSECTION: type = 'Intersection'; break;
        }
      }
      let name = cp.name;
      if ((cp.type === MissionCheckpoint.TYPE_DEPARTURE_RUNWAY || cp.type === MissionCheckpoint.TYPE_DESTINATION_RUNWAY) && !name.match(/^RW/)) {
        name = 'RW' + name;
      }

      pln += `            <ATCWaypoint id="${Quote.xml(name)}">
                <ATCWaypointType>${Quote.xml(type)}</ATCWaypointType>
                <WorldPosition>${(this.getLla(cp.lon_lat))}</WorldPosition>
                <!--SpeedMaxFP>${Quote.xml((cp.speed ? cp.speed : -1).toFixed())}</SpeedMaxFP-->
`;
      if (cp.type === MissionCheckpoint.TYPE_ORIGIN && departureRunway) {
        pln += this.runwayXml(departureRunway)
      }
      else if (cp.type === MissionCheckpoint.TYPE_DESTINATION && destinationRunway) {
        pln += this.runwayXml(destinationRunway)
      }
      if (type !== 'User') {
        pln += `                <ICAO>
                    <ICAOIdent>${Quote.xml(cp.name)}</ICAOIdent>
                    <ICAORegion>${Quote.xml(icaoRegion)}</ICAORegion>
                </ICAO>
`;
      }
      pln += `            </ATCWaypoint>
`;
    })

    pln += `        </FlightPlan.FlightPlan>
    </SimBase.Document>
`;
    return pln;
  }

  runwayXml(runway: string): string {
    const runwayParts = runway.match(/(\d+)(\D+)?/);
    if (runwayParts) {
      let RunwayDesignatorFP: 'NONE' | 'CENTER' | 'LEFT' | 'RIGHT' | 'WATER' | 'A' | 'B' = 'NONE';
      switch (runwayParts[2]) {
        case 'L':
          RunwayDesignatorFP = 'LEFT';
          break;
        case 'R':
          RunwayDesignatorFP = 'RIGHT';
          break;
        case 'C':
          RunwayDesignatorFP = 'CENTER';
          break;
      }
      return `                <RunwayNumberFP>${Number(runwayParts[1])}</RunwayNumberFP>
                <RunwayDesignatorFP>${Quote.xml(RunwayDesignatorFP)}</RunwayDesignatorFP>
`;
    }
    return '';
  }
}
