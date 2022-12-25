export class MainMcfParser {
    constructor(configFileContent) {
        this.configFileContent = configFileContent;
    }
    getNumber(subject, key, defaultValue = 0) {
        return Number(this.getValue(subject, key, String(defaultValue)));
    }
    setNumber(subject, key, value) {
        return this.setValue(subject, key, String(value));
    }
    getNumberArray(subject, key) {
        return this.getValue(subject, key)
            .split(" ")
            .map((i) => Number(i));
    }
    getValue(subject, key, defaultValue = "") {
        const match = subject.match(new RegExp("(?:\\]\\s*\\[" + key + "\\]\\s*\\[)([^\\]]*)(?:\\])"));
        return match ? match[1] : defaultValue;
    }
    setValue(subject, key, value) {
        return (value === undefined)
            ? subject
            : subject.replace(new RegExp('(\\]\\[' + key + '\\]\\[)[^\\]]*(\\])'), '$1' + value + '$2');
    }
    getGroup(subject, group, indent = 2) {
        const indentString = "    ".repeat(indent);
        const match = subject.match(new RegExp("\\n" + indentString + "<\\[" + group + "\\][\\s\\S]+?\\n" + indentString + ">"));
        return match ? match[0] : "";
    }
    setGroup(subject, group, indent, callback) {
        const indentString = "    ".repeat(indent);
        return subject.replace(new RegExp('(\\n' + indentString + '<\\[' + group + '\\]\\S*)([\\s\\S]+?)(\\n' + indentString + '>)'), callback);
    }
    ;
}
/**
 * The reader is actually junk and would benefit from some serious refactoring.
 */
export class MainMcf extends MainMcfParser {
    constructor(configFileContent) {
        super(configFileContent);
        this.configFileContent = configFileContent;
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
                CruiseAltitude: -1,
                Ways: [],
            },
        };
        this.read(configFileContent);
    }
    read(configFileContent) {
        const tmsettings_aircraft = this.getGroup(configFileContent, "tmsettings_aircraft");
        const tmsettings_flight = this.getGroup(configFileContent, "tmsettings_flight");
        const tm_time_utc = this.getGroup(configFileContent, "tm_time_utc");
        const tmsettings_wind = this.getGroup(configFileContent, "tmsettings_wind");
        const tmsettings_clouds = this.getGroup(configFileContent, "tmsettings_clouds");
        const tmnav_route = this.getGroup(configFileContent, "tmnav_route", 3);
        const list_tmmission_checkpoint = this.getGroup(configFileContent, "pointer_list_tmnav_route_way", 4);
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
                    Position: this.getNumberArray(wp, "Position"),
                    NavaidFrequency: this.getNumber(wp, "NavaidFrequency"),
                    Elevation: this.getNumber(wp, "Elevation"),
                    Altitude: this.getNumberArray(wp, "Altitude"),
                    Length: this.getNumber(wp, "RunwayLength"),
                };
            });
        }
        this.aircraft = {
            name: this.getValue(tmsettings_aircraft, "name", "c172"),
        };
        this.flight_setting = {
            position: this.getNumberArray(tmsettings_flight, "position"),
            orientation: this.getNumberArray(tmsettings_flight, "orientation"),
            configuration: this.getValue(tmsettings_flight, "configuration"),
            on_ground: this.getValue(tmsettings_flight, "on_ground") === "true",
        };
        this.time_utc = {
            time_year: this.getNumber(tm_time_utc, "time_year"),
            time_month: this.getNumber(tm_time_utc, "time_month"),
            time_day: this.getNumber(tm_time_utc, "time_day"),
            time_hours: this.getNumber(tm_time_utc, "time_hours"),
        };
        this.visibility = this.getNumber(configFileContent, "visibility");
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
                CruiseAltitude: this.getNumber(tmnav_route, 'CruiseAltitude'),
                Ways: waypoints,
            },
        };
    }
    fromMission(mission) {
        this.configFileContent = this.setGroup(this.configFileContent, "tmsettings_aircraft", 2, (tmsettings_aircraft) => {
            tmsettings_aircraft = this.setValue(tmsettings_aircraft, "name", mission.aircraft_name);
            return tmsettings_aircraft;
        });
        this.configFileContent = this.setGroup(this.configFileContent, "tm_time_utc", 2, (tm_time_utc) => {
            tm_time_utc = this.setNumber(tm_time_utc, "time_year", mission.conditions.time.time_year);
            tm_time_utc = this.setNumber(tm_time_utc, "time_month", mission.conditions.time.time_month);
            tm_time_utc = this.setNumber(tm_time_utc, "time_day", mission.conditions.time.time_day);
            tm_time_utc = this.setNumber(tm_time_utc, "time_hours", mission.conditions.time.time_hours);
            return tm_time_utc;
        });
        this.configFileContent = this.setNumber(this.configFileContent, "visibility", mission.conditions.visibility_percent);
        this.configFileContent = this.setGroup(this.configFileContent, "tmsettings_clouds", 2, (tmsettings_clouds) => {
            tmsettings_clouds = this.setNumber(tmsettings_clouds, "cumulus_density", mission.conditions.cloud.cover);
            tmsettings_clouds = this.setNumber(tmsettings_clouds, "cumulus_height", mission.conditions.cloud.height_percent);
            tmsettings_clouds = this.setNumber(tmsettings_clouds, "cumulus_mediocris_density", mission.conditions.cloud2.cover);
            tmsettings_clouds = this.setNumber(tmsettings_clouds, "cumulus_mediocris_height", mission.conditions.cloud2.height_percent);
            tmsettings_clouds = this.setNumber(tmsettings_clouds, "cirrus_density", mission.conditions.cloud3.cover);
            tmsettings_clouds = this.setNumber(tmsettings_clouds, "cirrus_height", mission.conditions.cloud3.height_percent);
            return tmsettings_clouds;
        });
        this.configFileContent = this.setGroup(this.configFileContent, "tmsettings_wind", 2, (tmsettings_wind) => {
            tmsettings_wind = this.setNumber(tmsettings_wind, "strength", mission.conditions.wind_speed_percent);
            tmsettings_wind = this.setNumber(tmsettings_wind, "direction_in_degree", mission.conditions.wind_direction);
            tmsettings_wind = this.setNumber(tmsettings_wind, "turbulence", mission.conditions.turbulence_strength);
            tmsettings_wind = this.setNumber(tmsettings_wind, "thermal_activity", mission.conditions.thermal_strength);
            return tmsettings_wind;
        });
        this.configFileContent = this.setGroup(this.configFileContent, "tmnav_route", 3, (tmnav_route) => {
            tmnav_route = this.setNumber(tmnav_route, "CruiseAltitude", mission.cruise_altitude);
            return tmnav_route;
        });
        /*
        const tmsettings_flight = this.getGroup(configFileContent, "tmsettings_flight");
        const tmnav_route = this.getGroup(configFileContent, "tmnav_route", 3);
        const list_tmmission_checkpoint = this.getGroup(configFileContent, "pointer_list_tmnav_route_way", 4);
    
        this.flight_setting = {
          position: this.getNumberArray(tmsettings_flight, "position"),
          orientation: this.getNumberArray(tmsettings_flight, "orientation"),
          configuration: this.getValue(tmsettings_flight, "configuration"),
          on_ground: this.getValue(tmsettings_flight, "on_ground") === "true",
        };
    
        this.navigation = {
          Route: {
            CruiseAltitude: this.getNumber(tmnav_route, 'CruiseAltitude'),
            Ways: waypoints,
          },
        };*/
    }
    toString() {
        return this.configFileContent;
    }
}
