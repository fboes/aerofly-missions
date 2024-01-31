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
                    coordinates: [lon_lat.lon, lon_lat.lat, waypoint.Elevation],
                },
                properties: {
                    title: waypoint.Identifier,
                    type: waypoint.type,
                    altitude: waypoint.Elevation,
                    direction: undefined,
                    frequency: undefined,
                    "marker-symbol": waypoint.type === MissionCheckpoint.TYPE_ORIGIN || waypoint.type === MissionCheckpoint.TYPE_DESTINATION
                        ? "airport"
                        : "dot-10",
                    "marker-color": waypoint.type === MissionCheckpoint.TYPE_ORIGIN || waypoint.type === MissionCheckpoint.TYPE_DESTINATION
                        ? "#5e6eba"
                        : "#555555",
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
                altitude: undefined,
                direction: undefined,
                frequency: undefined,
                "marker-symbol": "airport",
            },
        });
        this.drawLine(this.features
            .filter((feature) => {
            return feature.properties.type !== "plane";
        })
            .map((feature) => {
            return feature.geometry.coordinates;
        }));
        return this;
    }
    fromMission(mission) {
        this.features = mission.checkpoints.map((c, index) => {
            return {
                type: "Feature",
                id: index + 1,
                geometry: {
                    type: "Point",
                    coordinates: [c.lon_lat.lon, c.lon_lat.lat, c.lon_lat.altitude_m],
                },
                properties: {
                    title: c.name,
                    type: c.type,
                    altitude: c.lon_lat.altitude_m,
                    direction: c.direction,
                    frequency: c.frequency_string,
                    "marker-symbol": c.type === MissionCheckpoint.TYPE_ORIGIN || c.type === MissionCheckpoint.TYPE_DESTINATION
                        ? "airport"
                        : "dot-10",
                    "marker-color": c.type === MissionCheckpoint.TYPE_ORIGIN || c.type === MissionCheckpoint.TYPE_DESTINATION
                        ? "#5e6eba"
                        : "#555555",
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
                altitude: undefined,
                direction: mission.origin_dir,
                frequency: undefined,
                "marker-symbol": "airport",
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
                altitude: undefined,
                direction: mission.destination_dir,
                frequency: undefined,
                "marker-symbol": "airport",
            },
        });
        this.drawLine(this.getLineCoordinates(mission));
        return this;
    }
    drawLine(coordinates) {
        const paths = [
            {
                type: "Feature",
                id: this.features.length,
                geometry: {
                    type: "LineString",
                    coordinates: [this.features[0].geometry.coordinates, this.features[1].geometry.coordinates],
                },
                properties: {
                    title: "Taxi",
                    type: "Taxi",
                    altitude: undefined,
                    direction: undefined,
                    frequency: undefined,
                    "marker-symbol": "dot-10",
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
                    type: "Flightplan",
                    altitude: undefined,
                    direction: undefined,
                    frequency: undefined,
                    "marker-symbol": "dot-10",
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
                    type: "Taxi",
                    altitude: undefined,
                    direction: undefined,
                    frequency: undefined,
                    "marker-symbol": "dot-10",
                },
            },
        ];
        this.features.push(...paths);
    }
    getLineCoordinates(mission, segmentsPerCircle = 12) {
        let lineCoordinates = [];
        mission.checkpoints.forEach((c, index) => {
            const turnRadius = this.getTurnRadius(c.ground_speed, mission.turn_time);
            const nextCheckpoint = mission.checkpoints[index + 1];
            if (!nextCheckpoint ||
                turnRadius < 0.01 ||
                c.type !== MissionCheckpoint.TYPE_WAYPOINT ||
                nextCheckpoint.direction === undefined ||
                c.direction === undefined ||
                nextCheckpoint.distance === undefined ||
                c.distance === undefined) {
                lineCoordinates.push(this.getGeoJsonPosition(c.lon_lat));
            }
            else {
                let turnDegrees = c.direction - nextCheckpoint.direction;
                while (turnDegrees > 180) {
                    turnDegrees -= 360;
                }
                while (turnDegrees < -180) {
                    turnDegrees += 360;
                }
                const turnAnticipationDistance = Math.tan(((Math.abs(turnDegrees) / 180) * Math.PI) / 2) * turnRadius;
                if (Math.abs(turnDegrees) < 150 &&
                    turnAnticipationDistance <= Math.min(c.distance / 2, nextCheckpoint.distance / 2)) {
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
                }
                else {
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
                        entry = entry.getRelativeCoordinates(segmentLength, c.direction - rotationDegrees * prefix + (i + 0.5) * segmentDegrees * prefix);
                        lineCoordinates.push(this.getGeoJsonPosition(entry));
                    }
                    //lineCoordinates.push(this.getGeoJsonPosition(c.lon_lat));
                }
            }
        });
        return lineCoordinates;
    }
    /**
     * @param speedKts    number Kts
     * @param turnTimeMin number Minutes
     * @returns number in Nautical Miles
     */
    getTurnRadius(speedKts, turnTimeMin = 2) {
        const distance = speedKts * (turnTimeMin / 60);
        return distance / (2 * Math.PI);
    }
    getGeoJsonPosition(entry) {
        return entry.altitude_m ? [entry.lon, entry.lat, entry.altitude_m] : [entry.lon, entry.lat];
    }
}
