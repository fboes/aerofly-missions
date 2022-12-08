import * as fs from "node:fs";
import { GarminFpl } from "./GarminFpl.js";
export class XplaneFms extends GarminFpl {
    read() {
        if (!fs.existsSync(this.filename)) {
            throw new Error("File does not exist: " + this.filename);
        }
        const configFileContent = fs.readFileSync(this.filename, "utf8");
        if (!configFileContent) {
            throw new Error("File is empty: " + this.filename);
        }
        const waypointLines = configFileContent.match(/(^|\n)\d+ [A-Z]+ \S+ \S+ \S+ \S+(\n|$)/mg);
        if (!waypointLines) {
            throw new Error("No nav lines found: " + this.filename);
        }
        this.waypoins = waypointLines.map((line) => {
            const m = line.match(/(\d+) ([A-Z]+).*? ([0-9.+-]+) ([0-9.+-]+) ([0-9.+-]+)/);
            if (!m) {
                return {
                    identifier: '',
                    type: '',
                    lat: 0,
                    lon: 0
                };
            }
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
                lon: Number(m[5])
            };
        });
    }
}
