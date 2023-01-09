import { MissionCheckpoint } from "../Aerofly/MissionCheckpoint.js";
import { GarminFpl } from "./GarminFpl.js";
export class XplaneFms extends GarminFpl {
    read(configFileContent) {
        const waypointLines = configFileContent.matchAll(/(?:^|\n)(\d+) ([A-Z]+).*? ([0-9.+-]+) ([0-9.+-]+) ([0-9.+-]+)(?:\n|$)/mg);
        if (!waypointLines) {
            throw new Error("No nav lines found");
        }
        this.waypoins = Array.from(waypointLines).map((m) => {
            let type = 'USER WAYPOINT';
            switch (Number(m[1])) {
                case 1:
                    type = "AIRPORT";
                    break;
                case 2:
                    type = "NDB";
                    break;
                case 3:
                    type = "VOR";
                    break;
            }
            this.cruisingAlt = Math.max(this.cruisingAlt, Number(m[3]));
            return {
                identifier: m[2],
                type: type,
                lat: Number(m[4]),
                lon: Number(m[5]),
                alt: Number(m[3])
            };
        });
    }
}
export class XplaneFmsExport {
    constructor(mission) {
        this.mission = mission;
    }
    toString() {
        const m = this.mission;
        let pln = `I
1100 Version
CYCLE 1710
ADEP ${m.origin_icao}
ADES ${m.destination_icao}
NUMENR ${m.checkpoints.length}
`;
        m.checkpoints.forEach((cp, index) => {
            // It is 1 for airport, 2 for NDB, 3 for VOR, 11 for named fix and 28 for unnamed lat/lon waypoints.
            let type;
            type = (cp.type === MissionCheckpoint.TYPE_ORIGIN || cp.type === MissionCheckpoint.TYPE_DESTINATION)
                ? 1
                : 28;
            if (type !== 1 && cp.frequency) {
                type = cp.frequency_unit === 'M' ? 3 : 2;
            }
            // ADEP/ADES for departure or destination airport of the flightplan, DRCT for a direct or random route leg to the waypoint, or the name of an airway or ATS route to the waypoint.
            let via;
            via = type === 1 ? 'ADEP' : 'DRCT';
            if (index === m.checkpoints.length - 1 && type === 1) {
                via = 'ADES';
            }
            pln += `${type} ${cp.name} ${via} ${cp.lon_lat.altitude_ft} ${cp.lon_lat.lat} ${cp.lon_lat.lon}
`;
        });
        return pln;
    }
}
