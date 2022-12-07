import { GarminFpl } from "../Import/GarminFpl.js";
import { LonLat } from "../World/LonLat.js";
import { Units } from "../World/Units.js";
import { MainMcf } from "./MainMcf.js";
import { MissionCheckpoint } from "./MissionCheckpoint.js";
import { MissionConditions } from "./MissionConditions.js";

export class Mission {
  /**
   * This string should not be longer than MAX_LENGTH_TITLE characters to fit on the screen.
   */
  protected _title: string = '';
  /**
   * This string should not be longer than MAX_LENGTH_DESCRIPTION characters to fit on the screen.
   */
  protected _description: string = '';
  protected _flight_setting: string = Mission.FLIGHT_SETTING_TAXI;
  /**
   * Internal Aerofly name of aircraft type.
   */
  protected _aircraft_name: string = "c172";
  protected _aircraft_icao: string = "C172";

  callsign: string = "N5472R";
  origin_icao: string = "";
  origin_lon_lat: LonLat = new LonLat(0, 0);
  /**
   * True heading of aircraft in Degrees on startup
   */
  origin_dir: number = 0;
  destination_icao: string = "";
  destination_lon_lat: LonLat = new LonLat(0, 0);
  /**
   * True heading of aircraft in Degrees on exit
   */
  destination_dir: number = 0;
  conditions: MissionConditions = new MissionConditions();
  checkpoints: MissionCheckpoint[] = [];
  /**
 * Not official: In kts TAS
 */
  cruise_speed: number = 0;
  /**
   * Not official: In meters
   */
  cruise_altitude: number = 0;

  static FLIGHT_SETTING_LANDING = "landing";
  static FLIGHT_SETTING_TAKEOFF = "takeoff";
  static FLIGHT_SETTING_APPROACH = "approach";
  static FLIGHT_SETTING_TAXI = "taxi";
  static FLIGHT_SETTING_CRUISE = "cruise";
  static MAX_LENGTH_TITLE = 32;
  static MAX_LENGTH_DESCRIPTION = 50;
  static MAX_LINES_DESCRIPTION = 8;

  warnings: string[] = [];

  constructor(title: string, description: string) {
    this.title = title;
    this.description = description;
  }

  set title(title: string) {
    title = title.trim();
    if (title.length > Mission.MAX_LENGTH_TITLE) {
      this.warnings.push(`Title is longer than ${Mission.MAX_LENGTH_TITLE}, truncating`);
      title = title.substring(0, Mission.MAX_LENGTH_TITLE);
    }
    this._title = title;
  }

  get title(): string {
    return this._title;
  }

  set description(description: string) {
    description = description.trim();
    const lines = description.split(/\n/);
    let lineCount = lines.length;
    lines.forEach(l => {
      lineCount += Math.floor(l.length / Mission.MAX_LENGTH_DESCRIPTION);
    })

    if (lineCount > Mission.MAX_LINES_DESCRIPTION) {
      this.warnings.push(`Description is longer than ${Mission.MAX_LINES_DESCRIPTION} lines à ${Mission.MAX_LENGTH_DESCRIPTION} characters`);
    }
    this._description = description;
  }

  get description(): string {
    return this._description;
  }

  set flight_setting(flight_setting: string) {
    if (
      ![
        Mission.FLIGHT_SETTING_LANDING,
        Mission.FLIGHT_SETTING_TAKEOFF,
        Mission.FLIGHT_SETTING_APPROACH,
        Mission.FLIGHT_SETTING_TAXI,
        Mission.FLIGHT_SETTING_CRUISE,
      ].includes(flight_setting)
    ) {
      throw new Error("Unknown flight setting: " + flight_setting);
    }
    this._flight_setting = flight_setting;
  }

  get flight_setting() {
    return this._flight_setting;
  }

  get cruise_altitude_ft() {
    return this.cruise_altitude * Units.feetPerMeter;
  }

  set cruise_altitude_ft(cruise_altitude_ft: number) {
    this.cruise_altitude = cruise_altitude_ft / Units.feetPerMeter;
  }

  /**
   * ...this also sets `this.aircraft_icao`, `this._cruise_speed` and `this.callsign`
   *
   * @see https://www.icao.int/publications/doc8643/pages/search.aspx
   * @see https://en.wikipedia.org/wiki/List_of_aircraft_registration_prefixes
   * @see http://c-aviation.net/military-callsigns/
   */
  set aircraft_name(aircraft_name: string) {
    this._aircraft_name = aircraft_name.toLowerCase();
    switch (this._aircraft_name) {
      case "b58":
        this.aircraft_icao = "BE58";
        this.callsign = 'N58EU';
        this.cruise_speed = 180;
        break;
      case "jungmeister":
        this.aircraft_icao = "BU33";
        this.callsign = 'HB-MIZ';
        this.cruise_speed = 110;
        break;
      case "q400":
        this.aircraft_icao = "DH8D";
        this.cruise_speed = 360;
        break;
      case "crj900":
        this.aircraft_icao = "CRJ9";
        break;
      case "c90gtx":
        this.aircraft_icao = "BE9L";
        this.callsign = 'D-IBYP';
        this.cruise_speed = 226;
        break;
      case "f15e":
        this.aircraft_icao = "F15";
        this.callsign = 'ASJ0494';
        this.cruise_speed = 570;
        break;
      case "f18":
        this.aircraft_icao = "F18H";
        this.callsign = 'VVAC260';
        this.cruise_speed = 570;
        break;
      case "f4u":
        this.aircraft_icao = "CORS";
        this.cruise_speed = 187;
        break;
      case "p38":
        this.aircraft_icao = "P38";
        this.callsign = "N38BP";
        this.cruise_speed = 239;
        break;
      case "bf109e":
        this.aircraft_icao = "ME09";
        this.cruise_speed = 320;
        break;
      case "mb339":
        this.aircraft_icao = "M339";
        this.callsign = 'UAF-431';
        this.cruise_speed = 350;
        break;
      case "pitts":
        this.aircraft_icao = "PTS2";
        this.callsign = 'D-EUJS';
        this.cruise_speed = 152;
        break;
      case "a320":
        this.callsign = 'LH321';
        break;
      case "b737":
        this.aircraft_icao = "B735";
        break;
      case "b787":
        this.aircraft_icao = "B78X";
        break;
      case "b777":
        this.aircraft_icao = "B77W";
        break;
      case "ec135":
        this.aircraft_icao = "EC35";
        this.callsign = 'D-HDRS';
        this.cruise_speed = 137;
        break;
      case 'c172':
        this.callsign = 'N51911';
        this.cruise_speed = 122;
        break;
    }

    if (!this.aircraft_icao) {
      this.aircraft_icao = aircraft_name.toUpperCase();
    }
    if (!this.cruise_speed) {
      this.cruise_speed = 450; // True for most airliners
    }
    if (!this.callsign) {
      this.callsign = "N";
      if (this.origin_lon_lat.lon > 14) {
        this.callsign = this.origin_lon_lat.lat < 44 ? "SE-" : "SP-";
      } else if (this.origin_lon_lat.lon > 4) {
        this.callsign = this.origin_lon_lat.lat < 55 ? "D-" : "LN-";
      } else if (this.origin_lon_lat.lon > -30) {
        this.callsign = this.origin_lon_lat.lat < 49 ? "F-" : "G-";
      }
      this.callsign +=
        this.callsign !== "D-" && this.callsign !== "G-"
          ? String(this.aircraft_icao.charCodeAt(0)) + String(this.aircraft_icao.charCodeAt(2)) // 4 numbers
          : String.fromCharCode(
            (this.aircraft_icao.charCodeAt(1) % 26) + 65,
            (this.aircraft_icao.charCodeAt(0) % 26) + 65,
            (this.aircraft_icao.charCodeAt(3) % 26) + 65,
            (this.aircraft_icao.charCodeAt(2) % 26) + 65
          ); // 4 numbers
    }
  }

  get aircraft_name() {
    return this._aircraft_name;
  }

  set aircraft_icao(aircraft_icao: string) {
    this._aircraft_icao = aircraft_icao.substring(0, 4).toUpperCase();
  }

  get aircraft_icao() {
    return this._aircraft_icao;
  }

  /**
   * In hours
   */
  get time_enroute(): number {
    let total_time_enroute = 0;
    this.checkpoints.forEach((c) => {
      total_time_enroute += c.time_enroute;
    });
    return total_time_enroute;
  }

  /**
   * In nautical miles
   */
  get distance(): number {
    let total_distance = 0;
    this.checkpoints.forEach((c) => {
      total_distance += c.distance;
    });
    return total_distance;
  }

  calculateMagneticDeclination(l: LonLat, magnetic_declination: number): number {
    // TODO: Get IPACS to disclose how to parse `world/magnetic.tmm`
    // Formula for parts of Europe and Aerofly FS 4
    return (!magnetic_declination && l.lon > -10 && l.lon < 26 && l.lat > 45)
      ? (7 / 22) * l.lon - 3.4
      : magnetic_declination;

  }

  fromMainMcf(mainMcf: MainMcf, ils: number = 0, magnetic_declination: number = 0, withoutCheckpoints = false): Mission {
    this.aircraft_name = mainMcf.aircraft.name;
    this.cruise_altitude = mainMcf.navigation.Route.CruiseAltitude;

    if (!withoutCheckpoints) {
      switch (mainMcf.flight_setting.configuration) {
        case "ShortFinal":
          this.flight_setting = Mission.FLIGHT_SETTING_LANDING;
          break;
        case "Takeoff":
          this.flight_setting = Mission.FLIGHT_SETTING_TAKEOFF;
          break;
        case "Final":
          this.flight_setting = Mission.FLIGHT_SETTING_APPROACH;
          break;
        case "Parking":
          this.flight_setting = Mission.FLIGHT_SETTING_TAXI;
          break;
        default:
          this.flight_setting = mainMcf.flight_setting.on_ground
            ? Mission.FLIGHT_SETTING_TAXI
            : Mission.FLIGHT_SETTING_CRUISE;
          break;
      }
      this.conditions.fromMainMcf(mainMcf);
      this.checkpoints = mainMcf.navigation.Route.Ways.filter(w => {
        return [
          MissionCheckpoint.TYPE_ORIGIN,
          MissionCheckpoint.TYPE_DEPARTURE_RUNWAY,
          MissionCheckpoint.TYPE_WAYPOINT,
          MissionCheckpoint.TYPE_DESTINATION_RUNWAY,
          MissionCheckpoint.TYPE_DESTINATION,
        ].includes(w.type)
        // Filtering departure, approach and arrival - these points have no coordinates
      }).map((w) => {
        let cp = new MissionCheckpoint();
        cp.fromMainMcf(w, this.cruise_altitude);
        cp.lon_lat.magnetic_declination = this.calculateMagneticDeclination(cp.lon_lat, magnetic_declination);
        if (cp.type !== MissionCheckpoint.TYPE_ORIGIN) {
          cp.ground_speed = this.cruise_speed;
        }
        if (cp.type === MissionCheckpoint.TYPE_DEPARTURE_RUNWAY || cp.type === MissionCheckpoint.TYPE_DESTINATION) {
          cp.ground_speed = 30;
        }

        return cp;
      });


      const flight_category = this.conditions.getFlightCategory(this.origin_lon_lat.continent !== LonLat.CONTINENT_NORTH_AMERICA);
      this.calculateDirectionForCheckpoints(flight_category === MissionConditions.CONDITION_MVFR || flight_category === MissionConditions.CONDITION_VFR);

      this.origin_icao = this.checkpoints[0].name;
      this.origin_lon_lat = LonLat.fromMainMcf(mainMcf.flight_setting.position);
      this.origin_lon_lat.magnetic_declination = this.calculateMagneticDeclination(this.origin_lon_lat, magnetic_declination);

      const checkpointDepartureRunway = this.checkpoints.find(c => {
        return c.type === MissionCheckpoint.TYPE_DEPARTURE_RUNWAY;
      })

      const distanceOriginAircraft = this.origin_lon_lat.getDistanceTo(this.checkpoints[0].lon_lat);
      if (distanceOriginAircraft > 2) {
        this.warnings.push(`Position of aircraft too far away from origin of flight plan: ${distanceOriginAircraft.toFixed(2)} NM`);
        if (checkpointDepartureRunway) {
          this.origin_lon_lat = checkpointDepartureRunway.lon_lat;
          this.warnings.push(`Setting positon of aircraft to departure runway: ${checkpointDepartureRunway.lon_lat}`)
          this.origin_dir = (checkpointDepartureRunway.direction + 180) % 360;
          this.warnings.push(`Setting orientation of aircraft to departure runway: ${this.origin_dir.toFixed()}°`)
        }
      }

      if (this.origin_dir < 0) {
        this.origin_dir =
          ((Math.atan2(mainMcf.flight_setting.orientation[1], mainMcf.flight_setting.orientation[0]) - 1) *
            (180 / Math.PI) +
            26 +
            360) %
          360;
        this.warnings.push(`Aircraft orientation inferred from mainMcf.flight_setting.orientation: ${this.origin_dir.toFixed()}°`)
      }

      const checkpointDestination = this.checkpoints.find(c => {
        return c.type === MissionCheckpoint.TYPE_DESTINATION
      }) || this.checkpoints[this.checkpoints.length - 1];
      this.destination_icao = checkpointDestination.name;
      this.destination_dir = checkpointDestination.direction;
      this.destination_lon_lat = checkpointDestination.lon_lat;

      const checkpointDestinationRunway = this.checkpoints.find(c => {
        return c.type === MissionCheckpoint.TYPE_DESTINATION_RUNWAY
      }) || checkpointDestination;
      if (ils) {
        checkpointDestinationRunway.frequency_mhz = ils;
      }

      this.setAutoTitleDescription(flight_category);
    }

    return this;
  }

  fromGarminFpl(gpl: GarminFpl, magnetic_declination: number = 0): Mission {
    if (gpl.cruisingAlt) {
      this.cruise_altitude_ft = gpl.cruisingAlt;
    }

    this.checkpoints = gpl.waypoins.map((w, i) => {
      let cp = new MissionCheckpoint();
      cp.lon_lat.lat = w.lat;
      cp.lon_lat.lon = w.lon;
      cp.name = w.identifier;
      if (w.type === 'AIRPORT') {
        cp.type = (i === 0) ? MissionCheckpoint.TYPE_ORIGIN : MissionCheckpoint.TYPE_DESTINATION;
      } else {
        cp.altitude = this.cruise_altitude;
      }

      cp.lon_lat.magnetic_declination = this.calculateMagneticDeclination(cp.lon_lat, magnetic_declination);
      if (cp.type !== MissionCheckpoint.TYPE_ORIGIN) {
        cp.ground_speed = this.cruise_speed;
      }
      if (cp.type === MissionCheckpoint.TYPE_DEPARTURE_RUNWAY || cp.type === MissionCheckpoint.TYPE_DESTINATION) {
        cp.ground_speed = 30;
      }

      return cp;
    });

    const flight_category = this.conditions.getFlightCategory(this.origin_lon_lat.continent !== LonLat.CONTINENT_NORTH_AMERICA);
    this.calculateDirectionForCheckpoints(flight_category === MissionConditions.CONDITION_MVFR || flight_category === MissionConditions.CONDITION_VFR);

    this.origin_icao = this.checkpoints[0].name;
    this.origin_dir = this.checkpoints[1].direction;
    this.origin_lon_lat = this.checkpoints[0].lon_lat;

    const checkpointDestination = this.checkpoints.find(c => {
      return c.type === MissionCheckpoint.TYPE_DESTINATION
    }) || this.checkpoints[this.checkpoints.length - 1];
    this.destination_icao = checkpointDestination.name;
    this.destination_dir = checkpointDestination.direction;
    this.destination_lon_lat = checkpointDestination.lon_lat;

    this.setAutoTitleDescription(flight_category);

    return this;
  }

  setAutoTitleDescription(flight_category: string = '') {
    if (flight_category === '') {
      flight_category = this.conditions.getFlightCategory(this.origin_lon_lat.continent !== LonLat.CONTINENT_NORTH_AMERICA);
    }

    if (this.title === "" || this.title === "Custom missions") {
      this.title = `From ${this.origin_icao} to ${this.destination_icao}`;
    }

    if (this.description === "") {
      const localTime = this.getLocalDaytime();
      this.description = `A ${localTime} flight from ${this.origin_icao} to ${this.destination_icao} under ${flight_category} conditions.`;
      this.description += ` Wind is ${this.conditions.wind_speed.toFixed()} kts from ${this.conditions.wind_direction.toFixed()}°.`;

      const navDescription = this.checkpoints
        .filter((c) => {
          return c.frequency > 0;
        })
        .map((c) => {
          return `${c.name}: ${c.frequency_string}, DTK ${c.direction_magnetic.toFixed()}°`;
        })
        .join("\n");
      if (navDescription) {
        this.description += "\n\n" + navDescription;
      }
    }
  }

  calculateDirectionForCheckpoints(isVfr = true) {
    let lastC: MissionCheckpoint | null = null;

    // Add directions
    this.checkpoints.forEach(c => {
      if (lastC !== null) {
        c.setDirectionByCoordinates(lastC.lon_lat, isVfr);
      }
      // Modify cruising speed by wind
      if (c.type !== MissionCheckpoint.TYPE_DEPARTURE_RUNWAY && c.type !== MissionCheckpoint.TYPE_DESTINATION) {
        if (c.ground_speed && c.direction >= 0 && this.conditions.wind_speed) {
          const windCorrection = this.conditions.getWindCorrection(c.direction_rad, c.ground_speed);
          c.ground_speed = windCorrection.ground_speed;
          c.heading = windCorrection.heading;
        }
      }
      lastC = c;
    });
  }

  protected getLocalDaytime(): string {
    const localSolarTime = (this.conditions.time.time_hours + (this.origin_lon_lat.lon / 180) * 12 + 24) % 24;

    if (localSolarTime < 5 || localSolarTime >= 19) {
      return "night";
    }
    if (localSolarTime < 8) {
      return "early morning";
    }
    if (localSolarTime < 11) {
      return "morning";
    }
    if (localSolarTime < 13) {
      return "noon";
    }
    if (localSolarTime < 15) {
      return "afternoon";
    }
    if (localSolarTime < 19) {
      return "late afternoon";
    }

    return "day";
  }

  toString(): string {
    let string = `            <[tmmission_definition][mission][]
                <[string8][title][${this.title}]>
                <[string8][description][${this.description}]>
                <[string8]   [flight_setting]     [${this.flight_setting}]>
                <[string8u]  [aircraft_name]      [${this.aircraft_name}]>
                <[stringt8c] [aircraft_icao]      [${this.aircraft_icao}]>
                <[stringt8c] [callsign]           [${this.callsign}]>
                <[stringt8c] [origin_icao]        [${this.origin_icao}]>
                <[tmvector2d][origin_lon_lat]     [${this.origin_lon_lat}]>
                <[float64]   [origin_dir]         [${this.origin_dir}]>
                <[stringt8c] [destination_icao]   [${this.destination_icao}]>
                <[tmvector2d][destination_lon_lat][${this.destination_lon_lat}]>
                <[float64]   [destination_dir]    [${this.destination_dir}]>
                //<[float64]   [cruise_altitude]    [${this.cruise_altitude}]>
                //<[float64]   [cruise_speed]       [${this.cruise_speed}]>
${this.conditions}                <[list_tmmission_checkpoint][checkpoints][]
`;
    this.checkpoints.forEach((c, i) => {
      string += c.toString(i);
    });
    string += `                >
            >
// -----------------------------------------------------------------------------
`;
    return string;
  }
}
