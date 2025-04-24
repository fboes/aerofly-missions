import { MissionCheckpoint, MissionCheckpointTypeExtended } from "../Aerofly/MissionCheckpoint.js";
import { Quote } from "../Export/Quote.js";
import { LonLat } from "../World/LonLat.js";
import { Units } from "../World/Units.js";
import { GaminFplWaypoint, GarminExportAbstract, GarminFpl, GarminFplWaypointType } from "./GarminFpl.js";

type MsfsPlnWaypointType = "none" | "Airport" | "Intersection" | "VOR" | "NDB" | "User" | "ATC";
type MsfsPlnRunwayDesignator = "NONE" | "CENTER" | "LEFT" | "RIGHT" | "WATER" | "A" | "B";

/**
 * @see https://docs.flightsimulator.com/html/Content_Configuration/Flights_And_Missions/Flight_Plan_Definitions.htm
 * @see https://docs.flightsimulator.com/msfs2024/html/5_Content_Configuration/Mission_XML_Files/EFB_Flight_Plan_XML_Properties.htm
 */
export class MsfsPln extends GarminFpl {
  read(configFileContent: string): void {
    const waypointTableXml = this.getXmlNode(configFileContent, "FlightPlan.FlightPlan");

    const versionId = Number(this.getXmlNode(waypointTableXml, "AppVersionMajor"));
    if (versionId <= 0 || versionId > 12) {
      throw Error("Unknown flight plan version ID");
    }

    this.cruisingAltFt = Number(this.getXmlNode(waypointTableXml, "CruisingAlt"));
    const waypointsXml = this.getXmlNodes(waypointTableXml, "ATCWaypoint");
    this.waypoints = waypointsXml.map((xml, index): GaminFplWaypoint => {
      // N52° 45' 7.51",W3° 53' 2.16",+002500.00
      const worldPosition = this.getXmlNode(xml, "WorldPosition");
      const coords = this.convertCoordinate(worldPosition);

      if (index === 0 || index === waypointsXml.length - 1) {
        const runwayNumberFP = this.getXmlNode(xml, "RunwayNumberFP");
        const runwayDesignatorFP = this.getXmlNode(xml, "RunwayDesignatorFP") as MsfsPlnRunwayDesignator | "";
        const rw = runwayNumberFP + (runwayDesignatorFP === "NONE" ? "" : runwayDesignatorFP.substring(0, 1));
        if (runwayNumberFP) {
          if (index === 0) {
            this.departureRunway = rw;
          } else {
            this.destinationRunway = rw;
          }
        }
      }

      return {
        identifier: this.getXmlNode(xml, "ICAOIdent") || this.getXmlAttribute(xml, "id"),
        type: this.convertWaypointType(this.getXmlNode(xml, "ATCWaypointType") as MsfsPlnWaypointType),
        lat: coords.lat,
        lon: coords.lon,
        elevationMeter: coords.altitude_ft / Units.feetPerMeter,
        countryCode: this.getXmlNode(xml, "ICAORegion") || undefined,
      };
    });
  }

  convertWaypointType(type: MsfsPlnWaypointType): GarminFplWaypointType {
    switch (type) {
      case "Airport":
        return "AIRPORT";
      case "Intersection":
        return "INT";
      case "NDB":
        return "NDB";
      case "VOR":
        return "VOR";
      default:
        return "USER WAYPOINT";
    }
  }

  convertCoordinate(coordinate: string): LonLat {
    const parts = coordinate.split(/,\s*/);
    if (parts.length < 2) {
      throw new Error(
        `Wrong coordinates format "${coordinate}", expexted something like N52° 45' 7.51",W3° 53' 2.16",+002500.00`
      );
    }
    const numbers = parts.map((p): number => {
      const m = p.match(/([NSEW])(\d+)\D+(\d+)\D+([0-9.]+)/);
      if (m) {
        let b = Number(m[2]); // degree
        b += Number(m[3]) / 60; // minutes
        b += Number(m[4]) / 3600; // seconds
        return m[1] === "S" || m[1] === "W" ? -b : b;
      }
      return 0;
    });
    return new LonLat(numbers[1], numbers[0], Number(parts[2] || 0) / Units.feetPerMeter);
  }
}

/**
 * @see https://docs.flightsimulator.com/html/Content_Configuration/Flights_And_Missions/Flight_Plan_Definitions.htm
 * @see https://docs.flightsimulator.com/msfs2024/html/5_Content_Configuration/Mission_XML_Files/Flight_Plan_XML_Properties.htm
 */
export class MsfsPlnExport extends GarminExportAbstract {
  getLla(lon_lat: LonLat): string {
    // N53° 14' 48.24",W4° 32' 7.71",+000025.00
    // N53° 14' 48.24",W4° 32' 7.71",+000025.00
    const lat = lon_lat.latMinute;
    const lon = lon_lat.lonMinute;
    return (
      lon_lat.latHemisphere +
      Math.abs(lat.degree).toFixed() +
      "° " +
      lat.minutes.toFixed() +
      "' " +
      lat.secondsDecimal.toFixed(2) +
      '"' +
      "," +
      lon_lat.lonHemisphere +
      Math.abs(lon.degree).toFixed() +
      "° " +
      lon.minutes.toFixed() +
      "' " +
      lon.secondsDecimal.toFixed(2) +
      '"' +
      "," +
      (lon_lat.altitude_m >= 0 ? "+" : "-") +
      Math.abs(lon_lat.altitude_ft).toFixed(2).padStart(9, "0")
    );
  }

  toString(): string {
    const m = this.mission;

    const departureRunwayCp = m.findCheckPointByType(MissionCheckpoint.TYPE_DEPARTURE_RUNWAY);
    const departureRunway = departureRunwayCp ? departureRunwayCp.name : "";

    const destinationRunwayCp = m.findCheckPointByType(MissionCheckpoint.TYPE_DESTINATION_RUNWAY);
    const destinationRunway = destinationRunwayCp ? destinationRunwayCp.name : "";

    let pln = `\
<?xml version="1.0" encoding="UTF-8"?>
<SimBase.Document Type="AceXML" version="1,0">
    <!-- Exported by Aerofly Missionsgerät -->
    <Descr>AceXML Document</Descr>
    <FlightPlan.FlightPlan>
        <Title>${Quote.xml(m.origin_icao + " to " + m.destination_icao)}</Title>
        <Descr>${Quote.xml(m.title)}</Descr>
        <FPType>${Quote.xml(m.conditions.getFlightCategory(true))}</FPType>
        <RouteType>Direct</RouteType>
        <CruisingAlt>${Quote.xml(m.cruise_altitude_ft.toFixed())}</CruisingAlt>
        <DepartureID>${Quote.xml(m.origin_icao)}</DepartureID>
        <DepartureName>${Quote.xml(m.origin_icao)}</DepartureName>
        <DepartureLLA>${this.getLla(m.origin_lon_lat)}</DepartureLLA>
        <!--DeparturePosition></DeparturePosition-->
        <DestinationID>${Quote.xml(m.destination_icao)}</DestinationID>
        <DestinationName>${Quote.xml(m.destination_icao)}</DestinationName>
        <DestinationLLA>${this.getLla(m.destination_lon_lat)}</DestinationLLA>
        <AppVersion>
            <AppVersionMajor>10</AppVersionMajor>
            <AppVersionBuild>61472</AppVersionBuild>
        </AppVersion>
`;

    m.checkpoints.forEach((cp) => {
      const type = this.convertWaypointType(cp.type_extended);
      let name = cp.name;
      if (
        (cp.type === MissionCheckpoint.TYPE_DEPARTURE_RUNWAY ||
          cp.type === MissionCheckpoint.TYPE_DESTINATION_RUNWAY) &&
        !name.match(/^RW/)
      ) {
        name = "RW" + name;
      }

      pln += `\
        <ATCWaypoint id="${Quote.xml(name)}">
            <ATCWaypointType>${Quote.xml(type)}</ATCWaypointType>
            <WorldPosition>${this.getLla(cp.lon_lat)}</WorldPosition>
            <!--SpeedMaxFP>${Quote.xml((cp.speed ? cp.speed : -1).toFixed())}</SpeedMaxFP-->
`;
      if (cp.type === MissionCheckpoint.TYPE_ORIGIN && departureRunway) {
        pln += this.runwayXml(departureRunway);
      } else if (cp.type === MissionCheckpoint.TYPE_DESTINATION && destinationRunway) {
        pln += this.runwayXml(destinationRunway);
      }
      if (type !== "User") {
        pln += `\
            <ICAO>
                <ICAOIdent>${Quote.xml(cp.name)}</ICAOIdent>
                <ICAORegion>${Quote.xml(cp.icao_region || "")}</ICAORegion>
            </ICAO>
`;
      }
      pln += `\
        </ATCWaypoint>
`;
    });

    pln += `\
    </FlightPlan.FlightPlan>
</SimBase.Document>
`;
    return pln;
  }

  convertWaypointType(type: MissionCheckpointTypeExtended): MsfsPlnWaypointType {
    switch (type) {
      case MissionCheckpoint.TYPE_AIRPORT:
        return "Airport";
      case MissionCheckpoint.TYPE_DESTINATION:
        return "Airport";
      case MissionCheckpoint.TYPE_INTERSECTION:
        return "Intersection";
      case MissionCheckpoint.TYPE_NDB:
        return "NDB";
      case MissionCheckpoint.TYPE_ORIGIN:
        return "Airport";
      case MissionCheckpoint.TYPE_VOR:
        return "VOR";
      default:
        return "User";
    }
  }

  runwayXml(runway: string, hideNoneDesignator = false): string {
    const runwayParts = runway.match(/(\d+)([LRCSGHUW])?/);
    if (runwayParts) {
      let RunwayDesignatorFP: MsfsPlnRunwayDesignator = "NONE";
      switch (runwayParts[2]) {
        case "L":
          RunwayDesignatorFP = "LEFT";
          break;
        case "R":
          RunwayDesignatorFP = "RIGHT";
          break;
        case "C":
          RunwayDesignatorFP = "CENTER";
          break;
        case "W":
          RunwayDesignatorFP = "WATER";
          break;
      }
      let rw = `\
            <RunwayNumberFP>${Number(runwayParts[1])}</RunwayNumberFP>
`;
      if (!hideNoneDesignator || RunwayDesignatorFP !== "NONE") {
        rw += `
            <RunwayDesignatorFP>${Quote.xml(RunwayDesignatorFP)}</RunwayDesignatorFP>
`;
      }
      return rw;
    }
    return "";
  }
}

/**
 * @see https://docs.flightsimulator.com/msfs2024/html/5_Content_Configuration/Mission_XML_Files/EFB_Flight_Plan_XML_Properties.htm
 */
export class Msfs2024Export extends MsfsPlnExport {
  toString(): string {
    const m = this.mission;

    const departureRunwayCp = m.findCheckPointByType(MissionCheckpoint.TYPE_DEPARTURE_RUNWAY);
    const departureRunway = departureRunwayCp ? departureRunwayCp.name : "";

    const destinationRunwayCp = m.findCheckPointByType(MissionCheckpoint.TYPE_DESTINATION_RUNWAY);
    const destinationRunway = destinationRunwayCp ? destinationRunwayCp.name : "";

    let pln = `\
<?xml version="1.0" encoding="UTF-8"?>
<SimBase.Document>
    <!-- Exported by Aerofly Missionsgerät -->
    <FlightPlan.FlightPlan>
        <Title>${Quote.xml(m.origin_icao + " to " + m.destination_icao)}</Title>
        <Descr>${Quote.xml(m.title)}</Descr>
        <FPType>${Quote.xml(m.conditions.getFlightCategory(true))}</FPType>
        <DepartureID>${Quote.xml(m.origin_icao)}</DepartureID>
        <DestinationID>${Quote.xml(m.destination_icao)}</DestinationID>
        <CruisingAlt>${Quote.xml(m.cruise_altitude_ft.toFixed())}</CruisingAlt>
        <AppVersion>
            <AppVersionMajor>12</AppVersionMajor>
        </AppVersion>
`;

    if (departureRunway) {
      pln += `\
        <DepartureDetails>
${this.runwayXml(departureRunway, true)}\
        </DepartureDetails>
`;
    }

    m.checkpoints
      .filter((cp) => {
        return ![
          MissionCheckpoint.TYPE_ORIGIN,
          MissionCheckpoint.TYPE_DEPARTURE_RUNWAY,
          MissionCheckpoint.TYPE_DESTINATION_RUNWAY,
          MissionCheckpoint.TYPE_DESTINATION,
        ].includes(cp.type);
      })
      .forEach((cp) => {
        // ARINC-424 ICAO region code
        const type = this.convertWaypointType(cp.type_extended);
        pln += `\
        <ATCWaypoint id="${Quote.xml(cp.name)}">
            <ATCWaypointType>${Quote.xml(type)}</ATCWaypointType>
            <ICAO>
`;
        if (type !== "User") {
          pln += `\
                <ICAORegion>${Quote.xml(cp.icao_region || "")}</ICAORegion>
                <ICAOIdent>${Quote.xml(cp.name)}</ICAOIdent>
`;
        }
        pln += `\
                <WorldLocation>${this.getLla(cp.lon_lat)}</WorldLocation>
            </ICAO>
        </ATCWaypoint>
`;
      });

    if (destinationRunway) {
      pln += `\
        <ArrivalDetails>
${this.runwayXml(destinationRunway, true)}\
        </ArrivalDetails>
  `;
    }

    pln += `\
    </FlightPlan.FlightPlan>
</SimBase.Document>
`;

    return pln;
  }
}
