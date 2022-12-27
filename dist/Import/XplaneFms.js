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
