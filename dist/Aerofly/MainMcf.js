import * as fs from "node:fs";
/**
 * The reader is actually junk and would benefit from some serious refactoring.
 */
export class MainMcf {
    constructor(filename) {
        this.filename = filename;
        this.aircraft = {
            name: "",
        };
        this.flight_setting = {
            position: [0, 0, 0],
            orientation: [0, 0, 0],
            configuration: "",
            on_ground: true,
        };
        this.time_utc = {
            time_year: 0,
            time_month: 0,
            time_day: 0,
            time_hours: 0,
        };
        this.visibility = 0;
        this.wind = {
            strength: 0,
            direction_in_degree: 0,
            turbulence: 0,
            thermal_activity: 0,
        };
        this.clouds = {
            cumulus_density: 0,
            cumulus_height: 0,
            cumulus_mediocris_density: 0,
            cumulus_mediocris_height: 0,
            cirrus_height: 0,
            cirrus_density: 0,
        };
        this.navigation = {
            Route: {
                Ways: [],
            },
        };
        this.configFileContent = "";
        /*filename = filename.replace(/^(~|%userprofile%)/, require("os").homedir());
        if (!path.isAbsolute(filename)) {
          filename = path.join(process.cwd(), filename);
        }*/
        if (!fs.existsSync(filename)) {
            throw new Error("File does not exist: " + filename);
        }
        this.configFileContent = fs.readFileSync(filename, "utf8");
        if (!this.configFileContent) {
            throw new Error("File is empty: " + filename);
        }
        this.read();
    }
    read() {
        const tmsettings_aircraft = this.getGroup("tmsettings_aircraft");
        const tmsettings_flight = this.getGroup("tmsettings_flight");
        const tm_time_utc = this.getGroup("tm_time_utc");
        const tmsettings_wind = this.getGroup("tmsettings_wind");
        const tmsettings_clouds = this.getGroup("tmsettings_clouds");
        const list_tmmission_checkpoint = this.getGroup("pointer_list_tmnav_route_way", 4);
        let waypoints = [];
        if (list_tmmission_checkpoint) {
            waypoints = list_tmmission_checkpoint
                .split("<[tmnav_route_")
                .slice(1)
                .map((wp) => {
                const typeMatch = wp.match(/^[^\]]+/);
                return {
                    type: typeMatch ? String(typeMatch[0]) : "waypoint",
                    Identifier: this.getValue(wp, "Identifier"),
                    Position: this.getValue(wp, "Position")
                        .split(" ")
                        .map((i) => Number(i)),
                    NavaidFrequency: this.getNumber(wp, "NavaidFrequency"),
                    Elevation: this.getNumber(wp, "Elevation"),
                    Length: this.getNumber(wp, "RunwayLength"),
                };
            });
        }
        this.aircraft = {
            name: this.getValue(tmsettings_aircraft, "name", "c172"),
        };
        this.flight_setting = {
            position: this.getValue(tmsettings_flight, "position")
                .split(" ")
                .map((i) => Number(i)),
            orientation: this.getValue(tmsettings_flight, "orientation")
                .split(" ")
                .map((i) => Number(i)),
            configuration: this.getValue(tmsettings_flight, "configuration"),
            on_ground: this.getValue(tmsettings_flight, "on_ground") === "true",
        };
        this.time_utc = {
            time_year: this.getNumber(tm_time_utc, "time_year"),
            time_month: this.getNumber(tm_time_utc, "time_month"),
            time_day: this.getNumber(tm_time_utc, "time_day"),
            time_hours: this.getNumber(tm_time_utc, "time_hours"),
        };
        this.visibility = this.getNumber(this.configFileContent, "visibility");
        this.wind = {
            strength: this.getNumber(tmsettings_wind, "strength"),
            direction_in_degree: this.getNumber(tmsettings_wind, "direction_in_degree"),
            turbulence: this.getNumber(tmsettings_wind, "turbulence"),
            thermal_activity: this.getNumber(tmsettings_wind, "thermal_activity"),
        };
        this.clouds = {
            cumulus_density: this.getNumber(tmsettings_clouds, "cumulus_density"),
            cumulus_height: this.getNumber(tmsettings_clouds, "cumulus_height"),
            cumulus_mediocris_density: this.getNumber(tmsettings_clouds, "cumulus_mediocris_density"),
            cumulus_mediocris_height: this.getNumber(tmsettings_clouds, "cumulus_mediocris_height"),
            cirrus_height: this.getNumber(tmsettings_clouds, "cirrus_height"),
            cirrus_density: this.getNumber(tmsettings_clouds, "cirrus_density"),
        };
        this.navigation = {
            Route: {
                Ways: waypoints,
            },
        };
    }
    getNumber(subject, key, defaultValue = 0) {
        return Number(this.getValue(subject, key, String(defaultValue)));
    }
    getValue(subject, key, defaultValue = "") {
        const match = subject.match(new RegExp("(?:\\]\\[" + key + "\\]\\[)([^\\]]*)(?:\\])"));
        return match ? match[1] : defaultValue;
    }
    getGroup(group, indent = 2) {
        const indentString = "    ".repeat(indent);
        const match = this.configFileContent.match(new RegExp("\\n" + indentString + "<\\[" + group + "\\][\\s\\S]+?\\n" + indentString + ">"));
        return match ? match[0] : "";
    }
}
