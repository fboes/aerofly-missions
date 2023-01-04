import { LonLat } from "../World/LonLat.js";
import { MissionCheckpoint } from "../Aerofly/MissionCheckpoint.js";
export class GeoJson {
    constructor() {
        this.type = "FeatureCollection";
        this.features = [];
    }
    fromMainMcf(mainMcf, withDepDest = true) {
        this.features = mainMcf.navigation.Route.Ways.map((waypoint, index) => {
            const lon_lat = LonLat.fromMainMcf(waypoint.Position);
            return {
                type: "Feature",
                id: index,
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
        });
        if (withDepDest) {
            const origin_lon_lat = LonLat.fromMainMcf(mainMcf.flight_setting.position);
            this.features.unshift({
                type: "Feature",
                id: this.features.length,
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
        }
        this.drawLine();
        return this;
    }
    fromMission(mission, withDepDest = true) {
        this.features = mission.checkpoints.map((c, index) => {
            return {
                type: "Feature",
                id: index,
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
        });
        if (withDepDest) {
            this.features.unshift({
                type: "Feature",
                id: this.features.length,
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
        }
        this.drawLine();
        return this;
    }
    drawLine() {
        this.features.push({
            type: "Feature",
            id: this.features.length,
            geometry: {
                type: "LineString",
                coordinates: this.features.map((feature) => {
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
