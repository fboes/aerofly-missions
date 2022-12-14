import * as fs from "node:fs";

export interface MainMcfWaypointInterface {
  type: string;
  Identifier: string;
  Position: number[];
  NavaidFrequency: number;
  Elevation: number;
  Altitude: number[];
  Length: number;
}

export class MainMcfParser {
  constructor(configFileContent: string) {
  }

  getNumber(subject: string, key: string, defaultValue: number = 0): number {
    return Number(this.getValue(subject, key, String(defaultValue)));
  }

  getNumberArray(subject: string, key: string): number[] {
    return this.getValue(subject, key)
      .split(" ")
      .map((i) => Number(i));
  }

  getValue(subject: string, key: string, defaultValue: string = ""): string {
    const match = subject.match(new RegExp("(?:\\]\\s*\\[" + key + "\\]\\s*\\[)([^\\]]*)(?:\\])"));
    return match ? match[1] : defaultValue;
  }

  getGroup(subject: string, group: string, indent: number = 2): string {
    const indentString = "    ".repeat(indent);
    const match = subject.match(
      new RegExp("\\n" + indentString + "<\\[" + group + "\\][\\s\\S]+?\\n" + indentString + ">")
    );
    return match ? match[0] : "";
  }
}

/**
 * The reader is actually junk and would benefit from some serious refactoring.
 */
export class MainMcf extends MainMcfParser {
  aircraft = {
    name: "",
  };
  flight_setting = {
    position: <number[]>[0, 0, 0],
    orientation: <number[]>[0, 0, 0],
    configuration: "",
    on_ground: true,
  };
  time_utc = {
    time_year: 0,
    time_month: 0,
    time_day: 0,
    time_hours: 0,
  };
  visibility = 0;
  wind = {
    strength: 0,
    direction_in_degree: 0,
    turbulence: 0,
    thermal_activity: 0,
  };
  clouds = {
    cumulus_density: 0,
    cumulus_height: 0,
    cumulus_mediocris_density: 0,
    cumulus_mediocris_height: 0,
    cirrus_height: 0,
    cirrus_density: 0,
  };
  navigation = {
    Route: {
      CruiseAltitude: -1,
      Ways: <MainMcfWaypointInterface[]>[],
    },
  };

  constructor(configFileContent: string) {
    super(configFileContent);
    this.read(configFileContent);
  }

  read(configFileContent: string): void {
    const tmsettings_aircraft = this.getGroup(configFileContent, "tmsettings_aircraft");
    const tmsettings_flight = this.getGroup(configFileContent, "tmsettings_flight");
    const tm_time_utc = this.getGroup(configFileContent, "tm_time_utc");
    const tmsettings_wind = this.getGroup(configFileContent, "tmsettings_wind");
    const tmsettings_clouds = this.getGroup(configFileContent, "tmsettings_clouds");
    const tmnav_route = this.getGroup(configFileContent, "tmnav_route", 3);
    const list_tmmission_checkpoint = this.getGroup(configFileContent, "pointer_list_tmnav_route_way", 4);

    let waypoints: MainMcfWaypointInterface[] = [];
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
}
