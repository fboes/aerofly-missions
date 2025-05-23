import { LonLat } from "../World/LonLat.js";
import { MainMcf } from "../Aerofly/MainMcf.js";
import { Mission } from "../Aerofly/Mission.js";
import { MissionCheckpoint, MissionCheckpointTypeExtended } from "../Aerofly/MissionCheckpoint.js";
import { Position } from "geojson";

export type GeoJsonFeature = GeoJSON.Feature & {
  geometry: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    coordinates: any[];
  };
  properties: {
    title: string;
    type: MissionCheckpointTypeExtended | "aircraft" | "flightplan" | "taxi";
    altitude?: number;
    direction?: number;
    frequency?: string;
    "marker-symbol": string;
  };
};

export const GeoJsonTypes: { [key: string]: string } = {
  ORIGIN_DESINTATION: "af-large_airport",
  AIRPORT: "af-medium_airport",
  VOR: "navaid-vor",
  NDB: "navaid-ndb",
  FIX: "navaid-fix",
  WAYPOINT: "navaid-waypoint",
  FINISH: "af-large_airbase",
};

export class GeoJson implements GeoJSON.FeatureCollection {
  type = "FeatureCollection" as const;
  features: GeoJsonFeature[] = [];

  fromMainMcf(mainMcf: MainMcf) {
    const origin_lon_lat = LonLat.fromMainMcf(mainMcf.flight_setting.position);

    this.features = [
      {
        type: "Feature",
        id: 0,
        geometry: {
          type: "Point",
          coordinates: [origin_lon_lat.lon, origin_lon_lat.lat],
        },
        properties: {
          title: "Departure",
          type: "aircraft",
          altitude: undefined,
          direction: undefined,
          frequency: undefined,
          "marker-symbol": "airport",
        },
      },
      ...mainMcf.navigation.Route.Ways.map((waypoint, index): GeoJsonFeature => {
        const lon_lat = LonLat.fromMainMcf(waypoint.Position);

        return {
          type: "Feature",
          id: index + 1,
          geometry: {
            type: "Point",
            coordinates: [lon_lat.lon, lon_lat.lat, waypoint.Elevation],
          },
          properties: {
            title: waypoint.Identifier,
            type: waypoint.type,
            altitude: waypoint.Elevation,
            direction: undefined,
            frequency: undefined,
            "marker-symbol":
              waypoint.type === MissionCheckpoint.TYPE_ORIGIN || waypoint.type === MissionCheckpoint.TYPE_DESTINATION
                ? "airport"
                : "dot-10",
            "marker-color":
              waypoint.type === MissionCheckpoint.TYPE_ORIGIN || waypoint.type === MissionCheckpoint.TYPE_DESTINATION
                ? "#5e6eba"
                : "#555555",
          },
        };
      }),
    ];

    this.drawLine(
      this.features
        .filter((feature) => {
          return feature.properties.type !== "aircraft";
        })
        .map((feature) => {
          return feature.geometry.coordinates;
        })
    );
    return this;
  }

  fromMission(mission: Mission, forExport = false) {
    this.features = [
      {
        type: "Feature",
        id: 0,
        geometry: {
          type: "Point",
          coordinates: [mission.origin_lon_lat.lon, mission.origin_lon_lat.lat, mission.origin_lon_lat.altitude_m],
        },
        properties: {
          title: mission.aircraft_icao + " ORIGIN",
          type: "aircraft",
          altitude: mission.origin_lon_lat.altitude_m,
          direction: mission.origin_dir,
          frequency: undefined,
          "marker-symbol": "af-large_airport",
          "symbol-sort-key": 1,
        },
      },
      ...mission.checkpoints.map((c, index): GeoJsonFeature => {
        return {
          type: "Feature",
          id: index + 1,
          geometry: {
            type: "Point",
            coordinates: [c.lon_lat.lon, c.lon_lat.lat, c.lon_lat.altitude_m],
          },
          properties: {
            title: c.name,
            type: forExport ? c.type_extended : c.type,
            altitude: c.lon_lat.altitude_m,
            direction: c.direction,
            frequency: c.frequency_string,
            "marker-symbol": this.getGeoJsonIcon(c, mission.finish),
            "marker-color":
              c.type === MissionCheckpoint.TYPE_ORIGIN || c.type === MissionCheckpoint.TYPE_DESTINATION
                ? "#5e6eba"
                : "#555555",
            "symbol-sort-key": 0,
          },
        };
      }),
      {
        type: "Feature",
        id: mission.checkpoints.length + 1,
        geometry: {
          type: "Point",
          coordinates: [
            mission.destination_lon_lat.lon,
            mission.destination_lon_lat.lat,
            mission.destination_lon_lat.altitude_m,
          ],
        },
        properties: {
          title: mission.aircraft_icao + " DESTINATION",
          type: "aircraft",
          altitude: mission.destination_lon_lat.altitude_m,
          direction: mission.destination_dir,
          frequency: undefined,
          "marker-symbol": "af-large_airport",
          "symbol-sort-key": 1,
        },
      },
    ];

    this.drawLine(this.getLineCoordinates(mission));
    return this;
  }

  protected drawLine(coordinates: Position[]) {
    const paths: GeoJsonFeature[] = [
      {
        type: "Feature",
        id: this.features.length,
        geometry: {
          type: "LineString",
          coordinates: [this.features[0].geometry.coordinates, this.features[1].geometry.coordinates],
        },
        properties: {
          title: "Taxi",
          type: "taxi",
          altitude: undefined,
          direction: undefined,
          frequency: undefined,
          "marker-symbol": "dot-10",
          "symbol-sort-key": 2,
        },
      },
      {
        type: "Feature",
        id: this.features.length + 1,
        geometry: {
          type: "LineString",
          coordinates: coordinates,
        },
        properties: {
          title: "Flightplan",
          type: "flightplan",
          altitude: undefined,
          direction: undefined,
          frequency: undefined,
          "marker-symbol": "dot-10",
          "symbol-sort-key": 2,
          stroke: "#FF1493",
        },
      },
      {
        type: "Feature",
        id: this.features.length + 2,
        geometry: {
          type: "LineString",
          coordinates: [
            this.features[this.features.length - 2].geometry.coordinates,
            this.features[this.features.length - 1].geometry.coordinates,
          ],
        },
        properties: {
          title: "Taxi",
          type: "taxi",
          altitude: undefined,
          direction: undefined,
          frequency: undefined,
          "marker-symbol": "dot-10",
          "symbol-sort-key": 2,
        },
      },
    ];
    this.features.push(...paths);
  }

  protected getLineCoordinates(mission: Mission, segmentsPerCircle = 12): Position[] {
    const lineCoordinates: Position[] = [];
    mission.checkpoints.forEach((c, index) => {
      const turnRadius = this.getTurnRadius(c.ground_speed, mission.turn_time);
      const nextCheckpoint = mission.checkpoints[index + 1];

      if (this.isHardTurnCheckpoint(c, nextCheckpoint, turnRadius)) {
        lineCoordinates.push(this.getGeoJsonPosition(c.lon_lat));
      } else {
        let turnDegrees = this.getTurnDegreesForCheckpoint(c, nextCheckpoint);
        const turnAnticipationDistance = Math.tan(((Math.abs(turnDegrees) / 180) * Math.PI) / 2) * turnRadius;

        if (
          !c.flyOver &&
          Math.abs(turnDegrees) < 150 &&
          turnAnticipationDistance <= Math.min(c.distance / 2, nextCheckpoint.distance / 2)
        ) {
          // Fly-by
          const segments = Math.ceil(Math.abs(turnDegrees) / (360 / segmentsPerCircle));
          const segmentDegrees = turnDegrees / segments;
          const segmentLength = ((turnRadius * 2 * Math.PI) / 360) * Math.abs(segmentDegrees);

          let entry = c.lon_lat.getRelativeCoordinates(turnAnticipationDistance, c.direction - 180);
          lineCoordinates.push(this.getGeoJsonPosition(entry));
          for (let i = 0; i < segments; i++) {
            entry = entry.getRelativeCoordinates(segmentLength, c.direction - (i + 0.5) * segmentDegrees);
            lineCoordinates.push(this.getGeoJsonPosition(entry));
          }

          //entry = c.lon_lat.getRelativeCoordinates(turnAnticipationDistance, nextCheckpoint.direction);
          //lineCoordinates.push(this.getGeoJsonPosition(entry));
        } else {
          // Fly-over
          // @see https://en.wikipedia.org/wiki/Circular_segment
          turnDegrees *= 2;
          const h = turnRadius * (1 - Math.cos(((Math.abs(turnDegrees) / 180) * Math.PI) / 2));
          const alpha = (2 * Math.acos(1 - h / 2 / turnRadius) * 180) / Math.PI;
          const counterRotationDegrees = (Math.abs(turnDegrees) - alpha) / 2;
          const rotationDegrees = Math.abs(turnDegrees) - counterRotationDegrees;
          const prefix = Math.sign(turnDegrees);

          let entry = c.lon_lat.clone();
          lineCoordinates.push(this.getGeoJsonPosition(entry));

          // rotate one direction
          let segments = Math.ceil(Math.abs(rotationDegrees) / (360 / segmentsPerCircle));
          let segmentDegrees = rotationDegrees / segments;
          let segmentLength = ((turnRadius * 2 * Math.PI) / 360) * Math.abs(segmentDegrees);

          for (let i = 0; i < segments; i++) {
            entry = entry.getRelativeCoordinates(segmentLength, c.direction - (i + 0.5) * segmentDegrees * prefix);
            lineCoordinates.push(this.getGeoJsonPosition(entry));
          }

          // rotate other direction
          segments = Math.ceil(Math.abs(counterRotationDegrees) / (360 / segmentsPerCircle));
          segmentDegrees = counterRotationDegrees / segments;
          segmentLength = ((turnRadius * 2 * Math.PI) / 360) * Math.abs(segmentDegrees);

          for (let i = 0; i < segments; i++) {
            entry = entry.getRelativeCoordinates(
              segmentLength,
              c.direction - rotationDegrees * prefix + (i + 0.5) * segmentDegrees * prefix
            );
            lineCoordinates.push(this.getGeoJsonPosition(entry));
          }
          //lineCoordinates.push(this.getGeoJsonPosition(c.lon_lat));
        }
      }
    });
    return lineCoordinates;
  }

  protected getTurnDegreesForCheckpoint(checkpoint: MissionCheckpoint, nextCheckpoint: MissionCheckpoint) {
    let turnDegrees = checkpoint.direction - nextCheckpoint.direction;
    while (turnDegrees > 180) {
      turnDegrees -= 360;
    }
    while (turnDegrees < -180) {
      turnDegrees += 360;
    }
    return turnDegrees;
  }

  protected isHardTurnCheckpoint(checkpoint: MissionCheckpoint, nextCheckpoint: MissionCheckpoint, turnRadius: number) {
    return (
      !nextCheckpoint ||
      turnRadius < 0.01 ||
      checkpoint.type !== MissionCheckpoint.TYPE_WAYPOINT ||
      nextCheckpoint.direction === undefined ||
      checkpoint.direction === undefined ||
      nextCheckpoint.distance === undefined ||
      checkpoint.distance === undefined
    );
  }

  /**
   * @param speedKts    number Kts
   * @param turnTimeMin number Minutes
   * @returns number in Nautical Miles
   */
  protected getTurnRadius(speedKts: number, turnTimeMin: number = 2): number {
    const distance = speedKts * (turnTimeMin / 60);
    return distance / (2 * Math.PI);
  }

  protected getGeoJsonPosition(entry: LonLat): Position {
    return entry.altitude_m ? [entry.lon, entry.lat, entry.altitude_m] : [entry.lon, entry.lat];
  }

  protected getGeoJsonIcon(cp: MissionCheckpoint, finishCp: MissionCheckpoint | null): string {
    if (finishCp && finishCp === cp) {
      return GeoJsonTypes.FINISH;
    }
    switch (cp.type_extended) {
      case MissionCheckpoint.TYPE_ORIGIN:
      case MissionCheckpoint.TYPE_DESTINATION:
        return GeoJsonTypes.ORIGIN_DESINTATION;
      case MissionCheckpoint.TYPE_VOR:
        return GeoJsonTypes.VOR;
      case MissionCheckpoint.TYPE_NDB:
        return GeoJsonTypes.NDB;
      case MissionCheckpoint.TYPE_FIX:
        return GeoJsonTypes.FIX;
      case MissionCheckpoint.TYPE_AIRPORT:
        return GeoJsonTypes.AIRPORT;
      default:
        return GeoJsonTypes.WAYPOINT;
    }
  }
}
