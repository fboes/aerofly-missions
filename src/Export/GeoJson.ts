import { LonLat } from "../Aerofly/LonLat.js";
import { MainMcf } from "../Aerofly/MainMcf.js";
import { Mission } from "../Aerofly/Mission.js";

type GeoJsonFeature = {
  type: string;
  geometry: {
    type: string;
    coordinates: any[];
  };
  properties: object;
};

export class GeoJson {
  type: string = "FeatureCollection";
  features: GeoJsonFeature[] = [];

  fromMainMcf(mainMcf: MainMcf) {
    this.features = mainMcf.navigation.Route.Ways.map(
      (waypoint): GeoJsonFeature => {
        const lon_lat = LonLat.fromMainMcf(waypoint.Position);

        return {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [lon_lat.lon, lon_lat.lat],
          },
          properties: {
            title: waypoint.Identifier,
            type: waypoint.type
          },
        };
      }
    );

    const origin_lon_lat = LonLat.fromMainMcf(mainMcf.flight_setting.position);
    this.features.unshift({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [origin_lon_lat.lon, origin_lon_lat.lat],
      },
      properties: {
        title: "Starting position",
        type: "plane",
        "marker-symbol": "airport",
      },
    });

    this.drawLine();
    return this;
  }

  fromMission(mission: Mission) {
    this.features = mission.checkpoints.map(
      (c): GeoJsonFeature => {

        return {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [c.lon_lat.lon, c.lon_lat.lat],
          },
          properties: {
            title: c.name,
            type: c.type,
            direction: c.direction,
            distance: c.distance
          },
        };
      }
    );

    this.features.unshift({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [mission.origin_lon_lat.lon, mission.origin_lon_lat.lat],
      },
      properties: {
        title: "Starting position",
        type: "plane",
        "marker-symbol": "airport",
      },
    });

    this.features.push({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [mission.destination_lon_lat.lon, mission.destination_lon_lat.lat],
      },
      properties: {
        title: "Destination position",
        type: "plane",
        "marker-symbol": "airport",
      },
    });

    this.drawLine();
    return this;
  }

  drawLine() {
    this.features.push({
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: this.features.map((feature) => {
          return feature.geometry.coordinates;
        }),
      },
      properties: {
        title: "Flightplan",
      },
    });
  }
}
