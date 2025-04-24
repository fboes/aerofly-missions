import { MissionCheckpoint } from "../Aerofly/MissionCheckpoint.js";
import { Units } from "../World/Units.js";
import { GarminExportAbstract, GarminFpl } from "./GarminFpl.js";
export class GeoFs extends GarminFpl {
    read(configFileContent) {
        const geoFsJson = JSON.parse(configFileContent);
        if (!Array.isArray(geoFsJson)) {
            throw Error("Missing array structure in GeoFS JSON file");
        }
        const departureRunwayNode = geoFsJson.at(1);
        this.departureRunway =
            departureRunwayNode && this.isRunway(departureRunwayNode.type) ? departureRunwayNode.ident : undefined;
        const destinationRunwayNode = geoFsJson.at(-2);
        this.destinationRunway =
            destinationRunwayNode && this.isRunway(destinationRunwayNode.type) ? destinationRunwayNode.ident : undefined;
        this.waypoints = geoFsJson
            .filter((geoFsNode) => {
            return !this.isRunway(geoFsNode.type);
        })
            .map((geoFsNode) => {
            return {
                identifier: geoFsNode.ident,
                type: this.convertType(geoFsNode.type),
                lat: geoFsNode.lat,
                lon: geoFsNode.lon,
                elevationMeter: this.convertAltitude(geoFsNode.alt),
            };
        });
        this.cruisingAltFt =
            this.waypoints.reduce((accumulator, waypoint) => {
                var _a;
                return Math.max(accumulator, (_a = waypoint.elevationMeter) !== null && _a !== void 0 ? _a : 0);
            }, 0) || undefined;
    }
    /**
     *
     * @param alt Can be given in feet as int or in flight level as string (ie. "FL350").
     * @returns altitude in feet, converting FL to 100 ft
     */
    convertAltitude(alt) {
        if (alt === undefined) {
            return undefined;
        }
        if (typeof alt === "string") {
            alt = Number(alt.replace(/^FL(\d+)$/, "$100")) / Units.feetPerMeter;
        }
        return alt !== null && alt !== void 0 ? alt : undefined;
    }
    convertType(type) {
        switch (type) {
            case "DPT":
            case "DST":
                return "AIRPORT";
            case "NDB":
            case "NDB-DME":
                return "NDB";
            case "VOR":
            case "VOR-DME":
            case "VORTAC":
                return "VOR";
            default:
                return "USER WAYPOINT";
        }
    }
    isRunway(type) {
        return ["RNW", "ILS"].includes(type !== null && type !== void 0 ? type : "");
    }
}
export class GeoFsExport extends GarminExportAbstract {
    toJSON() {
        const m = this.mission;
        const lastIndex = m.checkpoints.length - 1;
        return m.checkpoints.map((cp, index) => {
            const lonLat = index === 0 ? m.origin_lon_lat : cp.lon_lat;
            let heading = undefined;
            if (index === 0 && m.origin_dir >= 0) {
                heading = m.origin_dir;
            }
            else if (index === lastIndex && m.destination_dir >= 0) {
                heading = m.destination_dir;
            }
            const alt = [MissionCheckpoint.TYPE_ORIGIN, MissionCheckpoint.TYPE_DESTINATION].includes(cp.type)
                ? 0
                : Math.round(lonLat.altitude_ft) || null;
            return {
                ident: cp.name,
                type: this.convertType(cp),
                lat: lonLat.lat,
                lon: lonLat.lon,
                alt,
                spd: cp.speed > 0 ? cp.speed : null,
                heading,
            };
        });
    }
    toString() {
        return JSON.stringify(this);
    }
    convertType(cp) {
        switch (cp.type_extended) {
            case MissionCheckpoint.TYPE_ORIGIN:
                return "DPT";
            case MissionCheckpoint.TYPE_DESTINATION:
                return "DST";
            case MissionCheckpoint.TYPE_DEPARTURE_RUNWAY:
            case MissionCheckpoint.TYPE_DESTINATION_RUNWAY:
                return cp.frequency ? "ILS" : "RNW";
            case MissionCheckpoint.TYPE_FIX:
                return "FIX";
            case MissionCheckpoint.TYPE_NDB:
                return "NDB";
            case MissionCheckpoint.TYPE_VOR:
                return "VOR";
            default:
                return "WPT";
        }
    }
}
