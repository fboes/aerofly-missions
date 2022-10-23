import { LonLat } from "./LonLat.js";
import { MainMcf } from "./MainMcf.js";
import { MissionCheckpoint } from "./MissionCheckpoint.js";
import { MissionConditions } from "./MissionConditions.js";

export class Mission {
  /**
   * This string should not be longer than 32 characters to fit on the screen.
   */
  title: string;
  /**
   * This string should not be longer than 200 characters to fit on the screen.
   */
  description: string;
  protected _flight_setting: string = "taxi";
  /**
   * Internal Aerofly name of plane type.
   */
  protected _aircraft_name: string = "c172";
  protected _aircraft_icao: string = "C172";
  callsign: string = "N5472R";
  origin_icao: string = "";
  origin_lon_lat: LonLat = new LonLat(0, 0);
  /**
   * Degrees
   */
  origin_dir: number = 0;
  destination_icao: string = "";
  destination_lon_lat: LonLat = new LonLat(0, 0);
  /**
   * Degrees
   */
  destination_dir: number = 0;
  conditions: MissionConditions = new MissionConditions();
  checkpoints: MissionCheckpoint[] = [];

  static FLIGHT_SETTING_LANDING = "landing";
  static FLIGHT_SETTING_TAKEOFF = "takeoff";
  static FLIGHT_SETTING_APPROACH = "approach";
  static FLIGHT_SETTING_TAXI = "taxi";
  static FLIGHT_SETTING_CRUISE = "cruise";

  constructor(title: string, description: string) {
    this.title = title; // shorten
    this.description = description; // shorten
  }

  fromMainMcf(mainMcf: MainMcf): Mission {
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
    this.checkpoints = mainMcf.navigation.Route.Ways.map((w) => {
      return new MissionCheckpoint().fromMainMcf(w);
    });
    this.calculateDirectionForCheckpoints();

    this.origin_icao = this.checkpoints[0].name;
    this.origin_lon_lat = LonLat.fromMainMcf(mainMcf.flight_setting.position);
    this.origin_dir =
      ((Math.atan2(mainMcf.flight_setting.orientation[1], mainMcf.flight_setting.orientation[0]) - 1) *
        (180 / Math.PI) +
        26 +
        360) %
      360;

    const lastCheckpoint = this.checkpoints[this.checkpoints.length - 1];
    this.destination_icao = lastCheckpoint.name;
    this.destination_dir = lastCheckpoint.direction;
    this.destination_lon_lat = lastCheckpoint.lon_lat;
    this.aircraft_name = mainMcf.aircraft.name;

    if (this.title === "" || this.title === "Custom missions") {
      this.title = `From ${this.origin_icao} to ${this.destination_icao}`;
    }

    if (this.description === "") {
      const localTime = this.getLocalDaytime();
      this.description = `A ${localTime} flight from ${this.origin_icao} to ${this.destination_icao}.`;
      this.description += ` Wind is ${this.conditions.wind_speed.toFixed()} kts from ${this.conditions.wind_direction.toFixed()}°.`;

      const navDescription = this.checkpoints
        .filter((c) => {
          return c.frequency > 0;
        })
        .map((c) => {
          return `${c.name}: ${c.rawFrequency.toFixed(2)}Mhz, TRK ${c.direction.toFixed()}°`;
        })
        .join("; ");
      if (navDescription) {
        this.description += " " + navDescription;
      }
    }

    return this;
  }

  calculateDirectionForCheckpoints() {
    let lastC: MissionCheckpoint|null = null;
    this.checkpoints.forEach(c => {
      if (lastC !== null) {
        c.setDirectionByCoordinates(lastC.lon_lat);
      }
      lastC = c;
    })
  }

  protected getLocalDaytime(): string {
    const localTime = (this.conditions.time.time_hours + (this.origin_lon_lat.lon / 180) * 12 + 24) % 24;

    if (localTime < 5 || localTime >= 19) {
      return "night";
    }
    if (localTime < 8) {
      return "early morning";
    }
    if (localTime < 11) {
      return "morning";
    }
    if (localTime < 13) {
      return "noon";
    }
    if (localTime < 15) {
      return "afternoon";
    }
    if (localTime < 19) {
      return "late afternoon";
    }

    return "day";
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

  /**
   * ...this also sets `this.aircraft_icao` and `this.callsign`
   *
   * @see https://www.icao.int/publications/doc8643/pages/search.aspx
   * @see https://en.wikipedia.org/wiki/List_of_aircraft_registration_prefixes
   */
  set aircraft_name(aircraft_name: string) {
    this._aircraft_name = aircraft_name.toLowerCase();
    switch (this._aircraft_name) {
      case "b58":
        this.aircraft_icao = "BE58";
        break;
      case "jungmeister":
        this.aircraft_icao = "BU33";
        break;
      case "q400":
        this.aircraft_icao = "DH8D";
        break;
      case "crj900":
        this.aircraft_icao = "CRJ9";
        break;
      case "c90gtx":
        this.aircraft_icao = "BE9L";
        break;
      case "f15e":
        this.aircraft_icao = "F15";
        break;
      case "f18":
        this.aircraft_icao = "F18H";
        break;
      case "f4u":
        this.aircraft_icao = "CORS";
        break;
      case "p38":
        this.aircraft_icao = "P38";
        break;
      case "bf109e":
        this.aircraft_icao = "ME09";
        break;
      case "mb339":
        this.aircraft_icao = "M339";
        break;
      case "pitts":
        this.aircraft_icao = "PTS2";
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
        break;
      default:
        this.aircraft_icao = aircraft_name;
        break;
    }

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

  get aircraft_name() {
    return this._aircraft_name;
  }

  set aircraft_icao(aircraft_icao: string) {
    this._aircraft_icao = aircraft_icao.substring(0, 4).toUpperCase();
  }

  get aircraft_icao() {
    return this._aircraft_icao;
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
