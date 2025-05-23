import { Units } from "../World/Units.js";
import { GarminFpl } from "./GarminFpl.js";
export class GeoJsonImport extends GarminFpl {
    read(configFileContent) {
        this.cruisingAltFt = undefined;
        const json = JSON.parse(configFileContent);
        const lineFeatures = json.features.filter((f) => {
            return f.geometry.type && f.geometry.type === "LineString";
        });
        const pointFeatures = json.features.filter((f) => {
            return f.geometry.type && f.geometry.type === "Point" && f.properties.type !== "aircraft";
        });
        if (pointFeatures.length > 0) {
            this.waypoints = pointFeatures.map((f, index) => {
                if (f.properties.altitude !== undefined && index !== 0 && index !== pointFeatures.length - 1) {
                    this.cruisingAltFt =
                        this.cruisingAltFt !== undefined
                            ? Math.max(this.cruisingAltFt, f.properties.altitude * Units.feetPerMeter)
                            : f.properties.altitude;
                }
                let type = index === 0 || index === pointFeatures.length - 1 ? "AIRPORT" : "USER WAYPOINT";
                if (type === "USER WAYPOINT" && f.properties.frequency) {
                    type = f.properties.frequency.match("MHz") ? "VOR" : "NDB";
                }
                return {
                    identifier: f.properties.title || "WP" + index.toFixed().padStart(2, "0"),
                    type: type,
                    lon: f.geometry.coordinates[0],
                    lat: f.geometry.coordinates[1],
                    elevationMeter: f.properties.altitude ? f.properties.altitude : undefined,
                };
            });
        }
        else if (lineFeatures[0]) {
            const coordinates = lineFeatures[0].geometry.coordinates;
            this.waypoints = coordinates.map((coords, index) => {
                return {
                    identifier: "WP" + index.toFixed().padStart(2, "0"),
                    type: index === 0 || index === coordinates.length - 1 ? "AIRPORT" : "USER WAYPOINT",
                    lon: coords[0],
                    lat: coords[1],
                    elevationMeter: 0,
                };
            });
            if (json.features[0].properties.origin) {
                this.waypoints[0].identifier = json.features[0].properties.origin;
            }
            if (json.features[0].properties.destination) {
                this.waypoints[coordinates.length - 1].identifier = json.features[0].properties.destination;
            }
        }
        else {
            throw new Error("Missing relevant GeoJSON features for flightplan");
        }
    }
}
