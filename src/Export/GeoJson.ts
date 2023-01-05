import { LonLat } from "../World/LonLat.js";
import { MainMcf } from "../Aerofly/MainMcf.js";
import { Mission } from "../Aerofly/Mission.js";
import { MissionCheckpoint } from "../Aerofly/MissionCheckpoint.js";

export type GeoJsonFeature = GeoJSON.Feature & {
  id: number,
  geometry: {
    coordinates: any[];
  };
  properties: {
    title: string,
    type: string,
    altitude: number,
    "marker-symbol": string,
  };
};

export class GeoJson implements GeoJSON.FeatureCollection {
  type: 'FeatureCollection' = "FeatureCollection";
  features: GeoJsonFeature[] = [];

  fromMainMcf(mainMcf: MainMcf) {
    this.features = mainMcf.navigation.Route.Ways.map(
      (waypoint, index): GeoJsonFeature => {
        const lon_lat = LonLat.fromMainMcf(waypoint.Position);

        return {
          type: "Feature",
          id: index + 1,
          geometry: {
            type: "Point",
            coordinates: [lon_lat.lon, lon_lat.lat],
          },
          properties: {
            title: waypoint.Identifier,
            type: waypoint.type,
            altitude: waypoint.Elevation,
            "marker-symbol": (waypoint.type === MissionCheckpoint.TYPE_ORIGIN || waypoint.type === MissionCheckpoint.TYPE_DESTINATION) ? "airport" : "dot-10"
          },
        };
      }
    );

    const origin_lon_lat = LonLat.fromMainMcf(mainMcf.flight_setting.position);
    this.features.unshift({
      type: "Feature",
      id: 0,
      geometry: {
        type: "Point",
        coordinates: [origin_lon_lat.lon, origin_lon_lat.lat],
      },
      properties: {
        title: "Departure",
        type: "plane",
        altitude: -1,
        "marker-symbol": "airport"
      },
    });

    this.drawLine();
    return this;
  }

  fromMission(mission: Mission) {
    this.features = mission.checkpoints.map(
      (c, index): GeoJsonFeature => {
        return {
          type: "Feature",
          id: index + 1,
          geometry: {
            type: "Point",
            coordinates: [c.lon_lat.lon, c.lon_lat.lat],
          },
          properties: {
            title: c.name,
            type: c.type,
            altitude: c.lon_lat.altitude_m,
            "marker-symbol": (c.type === MissionCheckpoint.TYPE_ORIGIN || c.type === MissionCheckpoint.TYPE_DESTINATION) ? "airport" : "dot-10"
          },
        };
      }
    );

    this.features.unshift({
      type: "Feature",
      id: 0,
      geometry: {
        type: "Point",
        coordinates: [mission.origin_lon_lat.lon, mission.origin_lon_lat.lat],
      },
      properties: {
        title: mission.origin_icao,
        type: "plane",
        altitude: -1,
        "marker-symbol": "airport"
      },
    });

    this.features.push({
      type: "Feature",
      id: this.features.length,
      geometry: {
        type: "Point",
        coordinates: [mission.destination_lon_lat.lon, mission.destination_lon_lat.lat],
      },
      properties: {
        title: mission.destination_icao,
        type: "plane",
        altitude: -1,
        "marker-symbol": "airport"
      },
    });


    this.drawLine();
    return this;
  }

  drawLine() {
    this.features.push({
      type: "Feature",
      id: this.features.length,
      geometry: {
        type: "LineString",
        coordinates: this.features.filter((feature) => {
          return feature.properties.type !== 'plane'
        }).map((feature) => {
          return feature.geometry.coordinates;
        }),
      },
      properties: {
        title: "Flightplan",
        type: "Flightplan",
        altitude: -1,
        "marker-symbol": "dot-10",
      },
    });
  }
}
