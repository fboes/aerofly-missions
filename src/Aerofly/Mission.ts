import { Quote } from "../Export/Quote.js";
import { GarminFpl } from "../Import/GarminFpl.js";
import { LonLat } from "../World/LonLat.js";
import { Units } from "../World/Units.js";
import { Aircraft, AircraftFinder } from "./Aircraft.js";
import { FileParser } from "./FileParser.js";
import { MainMcf } from "./MainMcf.js";
import { MissionCheckpoint, MissionCheckpointType } from "./MissionCheckpoint.js";
import { MissionConditions, MissionConditionsFlightRules } from "./MissionConditions.js";

export type MissionFlightSetting =
  | "cold_and_dark"
  | "before_start"
  | "taxi"
  | "takeoff"
  | "cruise"
  | "approach"
  | "landing"
  | "winch_launch"
  | "aerotow"
  | "pushback";

export class Mission {
  /**
   * This string should not be longer than MAX_LENGTH_TITLE characters to fit on the screen.
   */
  protected _title: string = "";
  /**
   * This string should not be longer than MAX_LENGTH_DESCRIPTION characters to fit on the screen.
   */
  protected _description: string = "";
  flight_setting: MissionFlightSetting = Mission.FLIGHT_SETTING_TAXI;
  /**
   * Internal Aerofly name of aircraft type.
   */
  protected _aircraft_name: string = "c172";
  protected _aircraft_icao: string = "C172";

  /**
   * @see https://en.wikipedia.org/wiki/Aviation_call_signs
   * @see https://en.wikipedia.org/wiki/List_of_aircraft_registration_prefixes
   * @see https://en.wikipedia.org/wiki/List_of_airline_codes
   * @see http://c-aviation.net/military-callsigns/
   */
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
  finish: MissionCheckpoint | null = null;
  conditions: MissionConditions = new MissionConditions();
  checkpoints: MissionCheckpoint[] = [];
  /**
   * Not official: In kts TAS
   */
  cruise_speed: number = 122;
  /**
   * Not official: In meters
   */
  cruise_altitude: number = 0;
  /**
   * How many minutes does it take to make a full circle
   */
  turn_time: number = 2;

  /**
   * Hide guides in missio
   */
  no_guides: boolean = false;

  protected _magnetic_declination?: number;

  static FLIGHT_SETTING_COLD_AND_DARK: MissionFlightSetting = "cold_and_dark";
  static FLIGHT_SETTING_BEFORE_START: MissionFlightSetting = "before_start";
  static FLIGHT_SETTING_LANDING: MissionFlightSetting = "landing";
  static FLIGHT_SETTING_TAKEOFF: MissionFlightSetting = "takeoff";
  static FLIGHT_SETTING_APPROACH: MissionFlightSetting = "approach";
  static FLIGHT_SETTING_TAXI: MissionFlightSetting = "taxi";
  static FLIGHT_SETTING_CRUISE: MissionFlightSetting = "cruise";

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
    lines.forEach((l) => {
      lineCount += Math.floor(l.length / Mission.MAX_LENGTH_DESCRIPTION);
    });

    if (lineCount > Mission.MAX_LINES_DESCRIPTION) {
      this.warnings.push(
        `Description is longer than ${Mission.MAX_LINES_DESCRIPTION} lines à ${Mission.MAX_LENGTH_DESCRIPTION} characters`
      );
    }
    this._description = description;
  }

  get description(): string {
    return this._description;
  }

  get cruise_altitude_ft() {
    return this.cruise_altitude * Units.feetPerMeter;
  }

  set cruise_altitude_ft(cruise_altitude_ft: number) {
    this.cruise_altitude = cruise_altitude_ft / Units.feetPerMeter;
  }

  /**
   * @see this.setAircraft
   */
  set aircraft_name(aircraft_name: string) {
    const aircraft = AircraftFinder.getByAeroflyCode(aircraft_name.toLowerCase());
    this.setAircraft(aircraft);
  }

  get aircraft_name() {
    return this._aircraft_name;
  }

  /**
   * @see this.setAircraft
   */
  set aircraft_icao(aircraft_icao: string) {
    const aircraft = AircraftFinder.getByIcaoCode(aircraft_icao.toUpperCase());
    this.setAircraft(aircraft);
  }

  /**
   * @param aircraft will set all relevant properties in this missoion
   */
  setAircraft(aircraft: Aircraft) {
    this._aircraft_name = aircraft.aeroflyCode;
    this._aircraft_icao = aircraft.icaoCode;
    this.callsign = aircraft.callsign;
    this.cruise_speed = aircraft.cruiseSpeedKts;
    this.cruise_altitude_ft = aircraft.cruiseAltitudeFt;
    this.turn_time = aircraft.turnTime;
    this.syncCruiseSpeed();
    this.calculateCheckpoints();
  }

  /**
   * @see https://www.icao.int/publications/doc8643/pages/search.aspx
   */
  get aircraft_icao() {
    return this._aircraft_icao;
  }

  get origin_country() {
    return this.icaoAirportToIsoCountry(this.origin_icao);
  }

  get destination_country() {
    return this.icaoAirportToIsoCountry(this.destination_icao);
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

  get hasFrequencies(): boolean {
    this.checkpoints.forEach((cp) => {
      if (cp.frequency) {
        return true;
      }
    });
    return false;
  }

  fromMainMcf(mainMcf: MainMcf, ils: number = 0, withoutCheckpoints = false): Mission {
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

      this.finish = null;
      let lastPosition: LonLat | null = null;
      this.checkpoints = mainMcf.navigation.Route.Ways.filter((w) => {
        // Please not that procedure waypoints cannot be restored as of now
        return [
          MissionCheckpoint.TYPE_ORIGIN,
          MissionCheckpoint.TYPE_DEPARTURE_RUNWAY,
          //MissionCheckpoint.TYPE_DEPARTURE,
          MissionCheckpoint.TYPE_WAYPOINT,
          //MissionCheckpoint.TYPE_ARRIVAL,
          //MissionCheckpoint.TYPE_APPROACH,
          MissionCheckpoint.TYPE_DESTINATION_RUNWAY,
          MissionCheckpoint.TYPE_DESTINATION,
        ].includes(w.type);
        // Filtering departure, approach and arrival - these points have no coordinates
      }).map((w) => {
        let cp = new MissionCheckpoint();
        cp.fromMainMcf(w);

        if (lastPosition && (isNaN(cp.lon_lat.lon) || isNaN(cp.lon_lat.lat))) {
          cp.lon_lat = lastPosition.getRelativeCoordinates(3, 45);
        }

        lastPosition = cp.lon_lat;
        return cp;
      });

      const flight_category = this.conditions.getFlightCategory(this.origin_country !== "US");
      this.syncCruiseSpeed();
      this.calculateCheckpoints();

      this.origin_icao = this.checkpoints[0].name;
      this.origin_lon_lat = LonLat.fromMainMcf(mainMcf.flight_setting.position);

      const checkpointDepartureRunway = this.checkpoints.find((c) => {
        return c.type === MissionCheckpoint.TYPE_DEPARTURE_RUNWAY;
      });

      const distanceOriginAircraft = this.origin_lon_lat.getDistanceTo(this.checkpoints[0].lon_lat);
      if (distanceOriginAircraft > 2) {
        this.warnings.push(
          `Position of aircraft too far away from origin of flight plan: ${distanceOriginAircraft.toFixed(2)} NM`
        );
        if (checkpointDepartureRunway) {
          this.origin_lon_lat = new LonLat(
            checkpointDepartureRunway.lon_lat.lon,
            checkpointDepartureRunway.lon_lat.lat,
            checkpointDepartureRunway.lon_lat.altitude_m
          );
          this.warnings.push(`Setting positon of aircraft to departure runway: ${this.origin_lon_lat}`);
          this.origin_dir = (checkpointDepartureRunway.direction + 180) % 360;
          this.warnings.push(`Setting orientation of aircraft to departure runway: ${this.origin_dir.toFixed()}°`);
        }
      }

      if (this.origin_dir < 0) {
        this.origin_dir =
          ((Math.atan2(mainMcf.flight_setting.orientation[1], mainMcf.flight_setting.orientation[0]) - 1) *
            (180 / Math.PI) +
            26 +
            360) %
          360;
        this.warnings.push(
          `Aircraft orientation inferred from mainMcf.flight_setting.orientation: ${this.origin_dir.toFixed()}°`
        );
      }

      const checkpointDestination =
        this.findCheckPointByType(MissionCheckpoint.TYPE_DESTINATION) ?? this.checkpoints[this.checkpoints.length - 1];
      this.destination_icao = structuredClone(checkpointDestination.name);
      this.destination_dir = structuredClone(checkpointDestination.direction);
      this.destination_lon_lat = checkpointDestination.lon_lat.clone();

      const checkpointDestinationRunway =
        this.findCheckPointByType(MissionCheckpoint.TYPE_DESTINATION_RUNWAY) ?? checkpointDestination;
      if (ils) {
        checkpointDestinationRunway.frequency_mhz = ils;
      }

      this.setAutoTitleDescription(flight_category);
    }

    return this;
  }

  fromGarminFpl(gpl: GarminFpl): Mission {
    if (gpl.cruisingAlt) {
      this.cruise_altitude_ft = gpl.cruisingAlt;
    }

    // Assuming non AFS4 flight plans to start on the ground ;)
    this.flight_setting = Mission.FLIGHT_SETTING_TAXI;

    this.finish = null;
    this.checkpoints = gpl.waypoints.map((w, i) => {
      let cp = new MissionCheckpoint();
      cp.lon_lat.lat = w.lat;
      cp.lon_lat.lon = w.lon;
      cp.lon_lat.altitude_ft = w.alt ?? 0;
      cp.name = w.identifier;
      if (w.type === "AIRPORT" && (i === 0 || i === gpl.waypoints.length - 1)) {
        cp.type = i === 0 ? MissionCheckpoint.TYPE_ORIGIN : MissionCheckpoint.TYPE_DESTINATION;
      } else if (
        w.type === "USER WAYPOINT" &&
        (i === 1 || i === gpl.waypoints.length - 2) &&
        cp.name.match(/^(RW)?\d\d[A-Z]?$/)
      ) {
        cp.type = i === 1 ? MissionCheckpoint.TYPE_DEPARTURE_RUNWAY : MissionCheckpoint.TYPE_DESTINATION_RUNWAY;
        cp.name = cp.name.replace(/^(RW)/, "");
      }

      return cp;
    });

    // Find runways and runway directions
    const departureRunway: MissionCheckpoint | undefined = this.findCheckPointByType(
      MissionCheckpoint.TYPE_DEPARTURE_RUNWAY
    );
    const departureRunwayDirection: number | undefined = departureRunway
      ? Number(departureRunway.name.replace(/\D+/, "") + "0")
      : undefined;
    const destinationRunway: MissionCheckpoint | undefined = this.findCheckPointByType(
      MissionCheckpoint.TYPE_DESTINATION_RUNWAY
    );
    const destinationRunwayDirection: number | undefined = destinationRunway
      ? Number(destinationRunway.name.replace(/\D+/, "") + "0")
      : undefined;

    // TODO: If no runways exist, check for gpl.departureRunway / gpl.destinationRunway

    // Set origin to runway if exists
    this.origin_icao = this.checkpoints[0].name;
    this.origin_dir = departureRunwayDirection ?? this.checkpoints[1].direction;
    this.origin_lon_lat =
      departureRunway?.lon_lat.getRelativeCoordinates(0.002, (departureRunwayDirection ?? 0) + 180) ??
      this.checkpoints[0].lon_lat.clone();

    // Set destination to runway if exists
    const checkpointDestination =
      this.findCheckPointByType(MissionCheckpoint.TYPE_DESTINATION) ?? this.checkpoints[this.checkpoints.length - 1];
    this.destination_icao = checkpointDestination.name;
    this.destination_dir = destinationRunwayDirection ?? checkpointDestination.direction;
    this.destination_lon_lat =
      destinationRunway?.lon_lat.getRelativeCoordinates(0.5, destinationRunwayDirection ?? 0) ??
      checkpointDestination.lon_lat.clone();

    const flight_category = this.conditions.getFlightCategory(this.origin_country !== "US");
    this.syncCruiseSpeed();
    this.calculateCheckpoints();
    this.setAutoTitleDescription(flight_category);

    return this;
  }

  reverseWaypoints() {
    this.checkpoints = this.checkpoints.reverse();
    if (this.checkpoints[0].type === MissionCheckpoint.TYPE_DESTINATION) {
      this.checkpoints[0].type = MissionCheckpoint.TYPE_ORIGIN;
    }
    if (this.checkpoints[1].type === MissionCheckpoint.TYPE_DESTINATION_RUNWAY) {
      this.checkpoints[1].type = MissionCheckpoint.TYPE_DEPARTURE_RUNWAY;
    }
    if (this.checkpoints[this.checkpoints.length - 2].type === MissionCheckpoint.TYPE_DEPARTURE_RUNWAY) {
      this.checkpoints[this.checkpoints.length - 2].type = MissionCheckpoint.TYPE_DESTINATION_RUNWAY;
    }
    if (this.checkpoints[this.checkpoints.length - 1].type === MissionCheckpoint.TYPE_ORIGIN) {
      this.checkpoints[this.checkpoints.length - 1].type = MissionCheckpoint.TYPE_DESTINATION;
    }

    const tmp_dir = this.origin_dir;
    const tmp_icao = this.origin_icao;
    const tmp_lon_lat = this.origin_lon_lat;
    this.origin_dir = this.destination_dir;
    this.origin_icao = this.destination_icao;
    this.origin_lon_lat = this.destination_lon_lat;
    this.destination_dir = tmp_dir;
    this.destination_icao = tmp_icao;
    this.destination_lon_lat = tmp_lon_lat;

    this.syncCruiseSpeed();
    this.calculateCheckpoints();
    const flight_category = this.conditions.getFlightCategory(this.origin_country !== "US");
    this.setAutoTitleDescription(flight_category);
  }

  setAutoTitleDescription(flight_category: string = "") {
    if (flight_category === "") {
      flight_category = this.conditions.getFlightCategory(this.origin_country !== "US");
    }

    if (this.title === "" || this.title === "Custom missions") {
      this.title =
        this.origin_icao !== this.destination_icao
          ? `From ${this.origin_icao} to ${this.destination_icao}`
          : `${this.origin_icao} local flight`;
    }

    if (this.description === "") {
      let localTime = this.getLocalDaytime();
      localTime = (localTime.match(/^[aeiou]/) ? "An " : "A ") + localTime;
      const flight =
        this.origin_icao !== this.destination_icao
          ? `from ${this.origin_icao} to ${this.destination_icao}`
          : `at ${this.origin_icao}`;
      this.description = `${localTime} flight ${flight} under ${flight_category} conditions.`;
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

  syncCruiseAltitude() {
    this.checkpoints.forEach((c) => {
      if (c.type == MissionCheckpoint.TYPE_WAYPOINT) {
        c.lon_lat.altitude_m = this.cruise_altitude;
      }
    });
  }

  syncCruiseSpeed() {
    let lastC: MissionCheckpoint | null = null;

    this.checkpoints.forEach((c) => {
      if (
        c.type === MissionCheckpoint.TYPE_DEPARTURE_RUNWAY ||
        (lastC && lastC.type === MissionCheckpoint.TYPE_DESTINATION_RUNWAY)
      ) {
        c.speed = 30;
      } else if (c.type !== MissionCheckpoint.TYPE_ORIGIN) {
        c.speed = this.cruise_speed;
      }
      c.ground_speed = c.speed;
      lastC = c;
    });
  }

  calculateCheckpoints(changeHeight: null | MissionConditionsFlightRules = null) {
    let lastC: MissionCheckpoint | null = null;

    // Add directions
    this.checkpoints.forEach((c) => {
      if (lastC !== null) {
        c.setDirectionByCoordinates(lastC.lon_lat, changeHeight);
      }

      if (
        c.type === MissionCheckpoint.TYPE_DEPARTURE_RUNWAY ||
        (lastC && lastC.type === MissionCheckpoint.TYPE_DESTINATION_RUNWAY)
      ) {
        c.ground_speed = c.speed;
        c.heading = c.direction;
      } else {
        // Modify cruising speed by wind
        if (c.speed && c.direction >= 0 && this.conditions.wind_speed) {
          const windCorrection = this.conditions.getWindCorrection(c.direction_rad, c.speed);
          c.ground_speed = windCorrection.ground_speed;
          c.heading = windCorrection.heading;
        } else {
          c.ground_speed = c.speed;
          c.heading = c.direction;
        }
      }
      lastC = c;
    });
  }

  set magnetic_declination(magneticDeclination: number | undefined) {
    this._magnetic_declination = magneticDeclination;
    this.origin_lon_lat.magnetic_declination = this.calculateMagneticDeclination(
      this.origin_lon_lat,
      magneticDeclination
    );
    this.destination_lon_lat.magnetic_declination = this.calculateMagneticDeclination(
      this.destination_lon_lat,
      magneticDeclination
    );
    this.checkpoints.forEach((cp) => {
      cp.lon_lat.magnetic_declination = this.calculateMagneticDeclination(cp.lon_lat, magneticDeclination);
    });
  }

  get magnetic_declination(): number | undefined {
    return this._magnetic_declination;
  }

  /**
   * @see https://en.wikipedia.org/wiki/ICAO_airport_code
   * @param icaoAirportCode
   * @returns ISO 3166 only for Europe, North America and Australia
   */
  protected icaoAirportToIsoCountry(icaoAirportCode: string): string {
    switch (icaoAirportCode.substring(0, 1)) {
      case "C":
        return "CA";
      case "K":
        return "US";
      case "Y":
        return "AU";
    }
    switch (icaoAirportCode.substring(0, 2)) {
      case "BG":
        return "GL";
      case "BI":
        return "IS";
      case "BK":
        return "XK";
      case "EB":
        return "BE";
      case "ED":
        return "DE"; // Germany
      case "EE":
        return "EE"; // Estonia
      case "EF":
        return "FI";
      case "EG":
        return "GB";
      case "EH":
        return "NL";
      case "EI":
        return "IE"; // Ireland
      case "EK":
        return "DK";
      case "EL":
        return "LU";
      case "EN":
        return "NO";
      case "EP":
        return "PL";
      case "ES":
        return "SE";
      case "ET":
        return "DE"; // Germany
      case "EV":
        return "LT";
      case "LT":
        return "LV"; // Latvia
      case "LA":
        return "AL";
      case "LB":
        return "BG";
      case "LC":
        return "CY";
      case "LD":
        return "HR"; // Croatia
      case "LE":
        return "ES";
      case "LF":
        return "FR";
      case "LG":
        return "GR";
      case "LH":
        return "HU";
      case "LI":
        return "IT";
      case "LJ":
        return "SI"; // Slovenia
      case "LK":
        return "CZ";
      case "LL":
        return "IL";
      case "LM":
        return "MT";
      case "LN":
        return "MC"; // Monaco
      case "LO":
        return "AT";
      case "LP":
        return "PT";
      case "LQ":
        return "BA";
      case "LR":
        return "RO";
      case "LS":
        return "CH";
      case "LT":
        return "TR";
      case "LU":
        return "MD";
      case "LV":
        return "PS"; // Palestine
      case "LW":
        return "MK";
      case "LX":
        return "GI";
      case "LY":
        return "RS";
      case "LZ":
        return "SK"; // Slovakia
    }
    return "";
  }

  /**
   *
   * @see https://en.wikipedia.org/wiki/List_of_aircraft_registration_prefixes
   * @param string ISO 3166
   * @returns will only partially translate, falls back to 'N'
   */
  protected isoCountryToCallsignPrefix(countryCode: string): string {
    switch (countryCode) {
      case "AL":
        return "ZA";
      case "AT":
        return "OE";
      case "AU":
        return "VH";
      case "BE":
        return "OO";
      case "BG":
        return "LZ";
      case "CA":
        return "C";
      case "CH":
        return "HB";
      case "CY":
        return "5B";
      case "CZ":
        return "OK";
      case "DE":
        return "D";
      case "DK":
        return "OY";
      case "EE":
        return "ES";
      case "ES":
        return "EC"; // EM
      case "FI":
        return "OH";
      case "FR":
        return "F";
      case "GB":
        return "G";
      case "GI":
        return "VPG";
      case "GR":
        return "SX";
      case "HR":
        return "9A";
      case "HU":
        return "HA";
      case "IE":
        return "EI"; // EJ
      case "IS":
        return "TF";
      case "IT":
        return "I";
      case "LU":
        return "LX";
      case "NL":
        return "PH";
      case "NO":
        return "LN";
      case "PL":
        return "SP"; // SN
      case "PT":
        return "CR"; // CS
      case "SE":
        return "SE";
      default:
        return "N";
    }
  }

  protected calculateMagneticDeclination(l: LonLat, magnetic_declination: number | undefined): number {
    if (magnetic_declination !== undefined) {
      return magnetic_declination;
    }
    // TODO: Get IPACS to disclose how to parse `world/magnetic.tmm`
    if (l.lon >= -123 && l.lon <= -119 && l.lat >= 37 && l.lat <= 40) {
      // Reno / San Francisco
      return 14;
    }

    // Formula for parts of Europe and Aerofly FS 4
    return l.lon >= -10 && l.lon <= 26 && l.lat >= 45 ? (7 / 22) * l.lon - 3.4 : 0;
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

  findCheckPointByType(type: MissionCheckpointType): MissionCheckpoint | undefined {
    switch (type) {
      case MissionCheckpoint.TYPE_ORIGIN:
        return this.checkpoints[0];
      case MissionCheckpoint.TYPE_DESTINATION:
        return this.checkpoints[this.checkpoints.length - 1];
      case MissionCheckpoint.TYPE_DEPARTURE_RUNWAY:
        return this.checkpoints[1].type === type ? this.checkpoints[1] : undefined;
      case MissionCheckpoint.TYPE_DESTINATION_RUNWAY:
        return this.checkpoints[this.checkpoints.length - 2].type === type
          ? this.checkpoints[this.checkpoints.length - 2]
          : undefined;
      default:
        return this.checkpoints.find((cp) => {
          return cp.type === type;
        });
    }
  }

  addCheckpointBefore(index: number, distance: number, altitudeChange = 0) {
    if (index < 1) {
      throw new RangeError("Cannot add waypoint at start of flight plan");
    }
    let cpTo = this.checkpoints[index];

    const cp = new MissionCheckpoint();
    cp.lon_lat = cpTo.lon_lat.getRelativeCoordinates(distance, (cpTo.direction + 180) % 360);
    cp.lon_lat.altitude_ft += altitudeChange;
    cp.name = cpTo.name + "+" + distance.toFixed();
    cp.speed = cpTo.speed;
    cp.ground_speed = cpTo.ground_speed;
    this.checkpoints.splice(index, 0, cp);
  }

  addCheckpointAfter(index: number, distance: number, altitudeChange = 0) {
    if (index > this.checkpoints.length - 2) {
      throw new RangeError("Cannot add waypoint at end of flight plan");
    }
    let cpFrom = this.checkpoints[index];
    let cpTo = this.checkpoints[index + 1];

    const cp = new MissionCheckpoint();
    cp.lon_lat = cpFrom.lon_lat.getRelativeCoordinates(distance, cpTo.direction);
    cp.lon_lat.altitude_ft += altitudeChange;
    cp.name = cpFrom.name + "+" + distance.toFixed();
    cp.speed = cpTo.speed;
    cp.ground_speed = cpTo.ground_speed;
    this.checkpoints.splice(index + 1, 0, cp);
    this.calculateCheckpoints();
  }

  toString(): string {
    if (this.no_guides) {
      // Create finish target plane 1m in front of aircraft origin position
      this.finish = new MissionCheckpoint();
      this.finish.lon_lat = this.origin_lon_lat.getRelativeCoordinates(1 / Units.meterPerNauticalMile, this.origin_dir);
    }
    const finish = this.finish?.toStringTargetPlane("finish") ?? "";
    let string = `\
            // Exported by Aerofly Missionsgerät
            <[tmmission_definition][mission][]
                <[string8][title][${Quote.tmc(this.title)}]>
                <[string8][description][${Quote.tmc(this.description)}]>
                <[string8]   [flight_setting]     [${Quote.tmc(this.flight_setting)}]>
                <[string8u]  [aircraft_name]      [${Quote.tmc(this.aircraft_name)}]>
                //<[string8u][aircraft_livery]    []>
                <[stringt8c] [aircraft_icao]      [${Quote.tmc(this._aircraft_icao)}]>
                <[stringt8c] [callsign]           [${Quote.tmc(this.callsign)}]>
                <[stringt8c] [origin_icao]        [${Quote.tmc(this.origin_icao)}]>
                <[tmvector2d][origin_lon_lat]     [${this.origin_lon_lat}]>
                <[float64]   [origin_dir]         [${this.origin_dir}]>
                <[stringt8c] [destination_icao]   [${Quote.tmc(this.destination_icao)}]>
                <[tmvector2d][destination_lon_lat][${this.destination_lon_lat}]>
                <[float64]   [destination_dir]    [${this.destination_dir}]>
                //<[float64]   [cruise_altitude]    [${this.cruise_altitude}]>
                //<[float64]   [cruise_speed]       [${this.cruise_speed}]>
${this.conditions + finish}\
                <[list_tmmission_checkpoint][checkpoints][]
`;
    this.checkpoints.forEach((c, i) => {
      string += c.toString(i);
    });
    string += `\
                >
            >
// -----------------------------------------------------------------------------
`;
    return string;
  }

  hydrate(json: Mission) {
    this._title = json._title ?? this._title;
    this._description = json._description ?? this._description;
    this.flight_setting = json.flight_setting ?? this.flight_setting;
    this._aircraft_name = json._aircraft_name ?? this._aircraft_name;
    this._aircraft_icao = json._aircraft_icao ?? this._aircraft_icao;
    this._magnetic_declination = json._magnetic_declination ?? this._magnetic_declination;
    this.callsign = json.callsign ?? this.callsign;
    this.origin_icao = json.origin_icao ?? this.origin_icao;
    this.origin_lon_lat.magnetic_declination =
      json.origin_lon_lat.magnetic_declination ?? this.origin_lon_lat.magnetic_declination;
    this.origin_lon_lat.lon = json.origin_lon_lat.lon ?? this.origin_lon_lat.lon;
    this.origin_lon_lat.lat = json.origin_lon_lat.lat ?? this.origin_lon_lat.lat;
    this.origin_lon_lat.altitude_m = json.origin_lon_lat.altitude_m ?? this.origin_lon_lat.altitude_m;
    this.origin_dir = json.origin_dir ?? this.origin_dir;
    this.destination_icao = json.destination_icao ?? this.destination_icao;
    this.destination_lon_lat.magnetic_declination =
      json.destination_lon_lat.magnetic_declination ?? this.destination_lon_lat.magnetic_declination;
    this.destination_lon_lat.lon = json.destination_lon_lat.lon ?? this.destination_lon_lat.lon;
    this.destination_lon_lat.lat = json.destination_lon_lat.lat ?? this.destination_lon_lat.lat;
    this.destination_lon_lat.altitude_m = json.destination_lon_lat.altitude_m ?? this.destination_lon_lat.altitude_m;
    this.destination_dir = json.destination_dir ?? this.destination_dir;
    this.cruise_speed = json.cruise_speed ?? this.cruise_speed;
    this.cruise_altitude = json.cruise_altitude ?? this.cruise_altitude;
    this.turn_time = json.turn_time ?? this.turn_time;
    this.no_guides = json.no_guides ?? this.no_guides;

    this.conditions.hydrate(json.conditions);

    this.finish = json.finish ?? this.finish;
    this.checkpoints = json.checkpoints.map((c) => {
      const cx = new MissionCheckpoint();
      cx.hydrate(c);
      return cx;
    });
  }
}

export class MissionFactory extends FileParser {
  create(configFileContent: string, mission: Mission): Mission {
    const tmmission_definition = this.getGroup(configFileContent, "tmmission_definition", 3);
    const tmmission_conditions = this.getGroup(configFileContent, "tmmission_conditions", 4);
    const list_tmmission_checkpoint = this.getGroup(configFileContent, "list_tmmission_checkpoint", 4);

    mission.title = this.getValue(tmmission_definition, "title");
    mission.description = this.getValue(tmmission_definition, "description");
    mission.flight_setting = this.convertFlightSetting(this.getValue(tmmission_definition, "flight_setting"));
    mission.aircraft_name = this.getValue(tmmission_definition, "aircraft_name");
    mission.aircraft_icao = this.getValue(tmmission_definition, "aircraft_icao");
    mission.callsign = this.getValue(tmmission_definition, "callsign");
    mission.origin_icao = this.getValue(tmmission_definition, "origin_icao");

    const origin_lon_lat = this.getNumberArray(tmmission_definition, "origin_lon_lat");
    mission.origin_lon_lat.lon = origin_lon_lat[0];
    mission.origin_lon_lat.lat = origin_lon_lat[1];

    mission.origin_dir = this.getNumber(tmmission_definition, "origin_dir");
    mission.destination_icao = this.getValue(tmmission_definition, "destination_icao");

    const destination_lon_lat = this.getNumberArray(tmmission_definition, "destination_lon_lat");
    mission.destination_lon_lat.lon = destination_lon_lat[0];
    mission.destination_lon_lat.lat = destination_lon_lat[1];
    mission.destination_dir = this.getNumber(tmmission_definition, "destination_dir");
    mission.cruise_altitude = this.getNumber(tmmission_conditions, "cruise_altitude", mission.cruise_altitude);
    mission.cruise_speed = this.getNumber(tmmission_conditions, "cruise_speed", mission.cruise_speed);

    mission.conditions.time.time_year = this.getNumber(tmmission_conditions, "time_year");
    mission.conditions.time.time_month = this.getNumber(tmmission_conditions, "time_month");
    mission.conditions.time.time_day = this.getNumber(tmmission_conditions, "time_day");
    mission.conditions.time.time_hours = this.getNumber(tmmission_conditions, "time_hours");
    mission.conditions.wind_direction = this.getNumber(tmmission_conditions, "wind_direction");
    mission.conditions.wind_speed = this.getNumber(tmmission_conditions, "wind_speed");
    mission.conditions.wind_gusts = this.getNumber(tmmission_conditions, "wind_gusts");
    mission.conditions.turbulence_strength = this.getNumber(tmmission_conditions, "turbulence_strength");
    mission.conditions.thermal_strength = this.getNumber(tmmission_conditions, "thermal_strength");
    mission.conditions.visibility = this.getNumber(tmmission_conditions, "visibility");
    mission.conditions.cloud.cover = this.getNumber(tmmission_conditions, "cloud_cover");
    mission.conditions.cloud.height = this.getNumber(tmmission_conditions, "cloud_base");

    mission.finish = null;
    mission.checkpoints = list_tmmission_checkpoint
      .split("<[tmmission_checkpoint")
      .slice(1)
      .map((wp) => {
        const cp = new MissionCheckpoint();
        cp.type = <MissionCheckpointType>this.getValue(wp, "type");
        cp.name = this.getValue(wp, "name");

        const lon_lat = this.getNumberArray(wp, "lon_lat");
        cp.lon_lat.lon = lon_lat[0];
        cp.lon_lat.lat = lon_lat[1];
        cp.lon_lat.altitude_m = this.getNumber(wp, "altitude");

        cp.direction = this.getNumber(wp, "direction");
        cp.slope = this.getNumber(wp, "slope");
        cp.length = this.getNumber(wp, "length");
        cp.frequency = this.getNumber(wp, "frequency");
        cp.speed = this.getNumber(wp, "speed", mission.cruise_speed);
        cp.flyOver = this.getValue(wp, "fly_over", "false") !== "false";
        mission.cruise_altitude = Math.max(mission.cruise_altitude, cp.lon_lat.altitude_m);
        return cp;
      });

    mission.calculateCheckpoints();

    return mission;
  }

  protected convertFlightSetting(mainMcfFlightSetting: string): MissionFlightSetting {
    switch (mainMcfFlightSetting) {
      case "approach":
        return Mission.FLIGHT_SETTING_APPROACH;
      case "beforeStart":
        return Mission.FLIGHT_SETTING_BEFORE_START;
      case "coldAndDark":
        return Mission.FLIGHT_SETTING_COLD_AND_DARK;
      case "cruise":
        return Mission.FLIGHT_SETTING_CRUISE;
      case "landing":
        return Mission.FLIGHT_SETTING_LANDING;
      case "takeoff":
        return Mission.FLIGHT_SETTING_TAKEOFF;
      default:
        return Mission.FLIGHT_SETTING_TAXI;
    }
  }
}
