import { LonLat } from "../World/LonLat.js";
import { MissionCheckpoint } from "../Aerofly/MissionCheckpoint.js";
export class GeoJson {
    constructor() {
        this.type = "FeatureCollection";
        this.features = [];
    }
    fromMainMcf(mainMcf) {
        this.features = mainMcf.navigation.Route.Ways.map((waypoint, index) => {
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
                    direction: 0,
                    "marker-symbol": (waypoint.type === MissionCheckpoint.TYPE_ORIGIN || waypoint.type === MissionCheckpoint.TYPE_DESTINATION) ? "airport" : "dot-10"
                },
            };
        });
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
                direction: 0,
                "marker-symbol": "airport"
            },
        });
        this.drawLine();
        return this;
    }
    fromMission(mission) {
        this.features = mission.checkpoints.map((c, index) => {
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
                    direction: c.direction,
                    "marker-symbol": (c.type === MissionCheckpoint.TYPE_ORIGIN || c.type === MissionCheckpoint.TYPE_DESTINATION) ? "airport" : "dot-10"
                },
            };
        });
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
                direction: mission.origin_dir,
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
                direction: mission.destination_dir,
                "marker-symbol": "airport"
            },
        });
        this.drawLine();
        return this;
    }
    drawLine() {
        const paths = [
            {
                type: "Feature",
                id: this.features.length,
                geometry: {
                    type: "LineString",
                    coordinates: [
                        this.features[0].geometry.coordinates,
                        this.features[1].geometry.coordinates
                    ],
                },
                properties: {
                    title: "Taxi",
                    type: "Taxi",
                    altitude: -1,
                    direction: 0,
                    "marker-symbol": "dot-10",
                },
            },
            {
                type: "Feature",
                id: this.features.length + 1,
                geometry: {
                    type: "LineString",
                    coordinates: this.features.filter((feature) => {
                        return feature.properties.type !== 'plane';
                    }).map((feature) => {
                        return feature.geometry.coordinates;
                    }),
                },
                properties: {
                    title: "Flightplan",
                    type: "Flightplan",
                    altitude: -1,
                    direction: 0,
                    "marker-symbol": "dot-10",
                },
            },
            {
                type: "Feature",
                id: this.features.length + 2,
                geometry: {
                    type: "LineString",
                    coordinates: [
                        this.features[this.features.length - 2].geometry.coordinates,
                        this.features[this.features.length - 1].geometry.coordinates
                    ],
                },
                properties: {
                    title: "Taxi",
                    type: "Taxi",
                    altitude: -1,
                    direction: 0,
                    "marker-symbol": "dot-10",
                },
            }
        ];
        this.features.push(...paths);
    }
}
