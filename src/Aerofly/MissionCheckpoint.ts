import { Quote } from "../Export/Quote.js";
import { LonLat } from "../World/LonLat.js";
import { Units } from "../World/Units.js";
import { MainMcfWaypointInterface } from "./MainMcf.js";
import { MissionConditions, MissionConditionsFlightRules } from "./MissionConditions.js";

export type MissionCheckpointType =
  | "origin"
  | "departure_runway"
  | "departure"
  | "waypoint"
  | "arrival"
  | "approach"
  | "destination_runway"
  | "destination";
export type MissionCheckpointTypeExtended = MissionCheckpointType | "vor" | "ndb" | "fix" | "intersection" | "airport";

export class MissionCheckpoint {
  type: MissionCheckpointType = "waypoint";
  name: string = "";
  lon_lat: LonLat = new LonLat(0, 0);
  /**
   * True course in degrees to fly from last point to this point.
   * -1 on first, but seems rather unrelevant
   */
  direction: number = -1;
  /**
   *  Not official: Distance in nautical miles to fly from last point to this point.
   * -1 on first
   */
  distance: number = -1;
  /**
   * Only set on waypoint, function unknown
   * Given in percentage, -1..1
   */
  slope: number = 0;
  /**
   * Set on departure_runway, destination_runway
   */
  length: number = 0;
  /**
   * In Hz, `111400000` is 111.4 MHz
   * @see MissionCheckpoint.rawFreqency
   */
  frequency: number = 0;
  /**
   * If waypoint is meant to be flown over. Else turn anticipation will be used.
   */
  flyOver: boolean = false;
  /**
   * Not official: In kts TAS
   */
  speed: number = -1;
  /**
   * Not official: In knots
   */
  ground_speed: number = -1;
  /**
   * Not official: True heading to fly to correct for wind drift
   */
  heading: number = -1;

  protected _icao_region: string | null = null;

  static TYPE_ORIGIN: MissionCheckpointType = "origin";
  static TYPE_DEPARTURE_RUNWAY: MissionCheckpointType = "departure_runway";
  static TYPE_DEPARTURE: MissionCheckpointType = "departure";
  static TYPE_WAYPOINT: MissionCheckpointType = "waypoint";
  static TYPE_ARRIVAL: MissionCheckpointType = "arrival";
  static TYPE_APPROACH: MissionCheckpointType = "approach";
  static TYPE_DESTINATION_RUNWAY: MissionCheckpointType = "destination_runway";
  static TYPE_DESTINATION: MissionCheckpointType = "destination";
  static TYPE_VOR: MissionCheckpointTypeExtended = "vor";
  static TYPE_NDB: MissionCheckpointTypeExtended = "ndb";
  static TYPE_FIX: MissionCheckpointTypeExtended = "fix";
  static TYPE_INTERSECTION: MissionCheckpointTypeExtended = "intersection";
  static TYPE_AIRPORT: MissionCheckpointTypeExtended = "airport";

  /**
   * Aerofly represents frequencies in Hz.
   * If you want to set a frequency in MHz, use this setter.
   */
  set frequency_mhz(frequency_mhz: number) {
    this.frequency = frequency_mhz * 1_000_000;
  }

  get frequency_mhz(): number {
    return this.frequency / 1_000_000;
  }

  /**
   * Aerofly represents frequencies in Hz.
   * If you want to set a frequency in KHz, use this setter.
   */
  set frequency_khz(frequency_khz: number) {
    this.frequency = frequency_khz * 1000;
  }

  get frequency_khz(): number {
    return this.frequency / 1000;
  }

  /**
   * @returns "k" for all frequencies up to 1,000 kHz
   */
  get frequency_unit(): "M" | "k" {
    return this.frequency > 10_000_000 ? "M" : "k";
  }

  get frequency_string(): string {
    if (!this.frequency) {
      return "";
    }
    const frequency_unit = this.frequency_unit;
    return (
      (frequency_unit === "M" ? this.frequency_mhz.toFixed(2) : this.frequency_khz.toFixed()) +
      " " +
      frequency_unit +
      "Hz"
    );
  }

  set icao_region(icao_region: string | null) {
    this._icao_region = icao_region;
  }

  /**
   * @see https://en.m.wikipedia.org/wiki/ICAO_airport_code
   */
  get icao_region(): string | null {
    if (this._icao_region) {
      return this._icao_region;
    }

    const airportMatch = this.name.match(/^([A-Z]{2})[A-Z]{2}$/);
    if (airportMatch && airportMatch[1]) {
      const specialRegionMatch = airportMatch[1].match(/^[CKUYZ]/);
      if (
        specialRegionMatch &&
        !["UA", "UB", "UC", "UD", "UG", "UK", "UM", "UT", "ZK", "ZM"].includes(airportMatch[1])
      ) {
        return specialRegionMatch[0];
      }

      return airportMatch[1];
    }
    return null;
  }

  /**
   * @see https://aviation.stackexchange.com/questions/23743/what-is-the-difference-between-a-fix-a-waypoint-and-an-intersection
   * FIX− A geographical position determined by visual reference to the surface, by reference to one or more radio NAVAIDs, by celestial plotting, or by another navigational device.
   * WAYPOINT− A predetermined geographical position used for route/instrument approach definition, progress reports, published VFR routes, visual reporting points or points for transitioning and/or circumnavigating controlled and/or special use airspace, that is defined relative to a VORTAC station or in terms of latitude/longitude coordinates.
   */
  get type_extended(): MissionCheckpointTypeExtended {
    if (this.type === MissionCheckpoint.TYPE_WAYPOINT) {
      if (this.frequency) {
        return this.frequency_unit === "M" ? MissionCheckpoint.TYPE_VOR : MissionCheckpoint.TYPE_NDB;
      }
      if (this.name.match(/^[A-Z]{3,5}$/)) {
        switch (this.name.length) {
          case 3:
            return MissionCheckpoint.TYPE_VOR;
          case 4:
            return MissionCheckpoint.TYPE_AIRPORT;
          default:
            return MissionCheckpoint.TYPE_WAYPOINT;
        }
      }

      return MissionCheckpoint.TYPE_FIX;
    }

    return this.type;
  }

  /**
   * @returns boolean if the type and name are exportable to other applications because it is known there, e.g. VORs, NDBs
   */
  isExportable(): boolean {
    const type = this.type_extended;
    return [
      MissionCheckpoint.TYPE_ORIGIN,
      MissionCheckpoint.TYPE_DESTINATION,
      MissionCheckpoint.TYPE_NDB,
      MissionCheckpoint.TYPE_VOR,
      MissionCheckpoint.TYPE_WAYPOINT,
      MissionCheckpoint.TYPE_AIRPORT,
    ].includes(type);
  }

  get direction_magnetic(): number {
    if (this.direction == -1) {
      return this.direction;
    }
    return (this.direction - this.lon_lat.magnetic_declination + 360) % 360;
  }

  get direction_rad() {
    return ((this.direction % 360) / 180) * Math.PI;
  }

  get heading_magnetic(): number {
    if (this.heading == -1) {
      return this.heading;
    }
    return (this.heading - this.lon_lat.magnetic_declination + 360) % 360;
  }

  get distance_m(): number {
    return this.distance * Units.meterPerNauticalMile;
  }

  get slope_deg(): number {
    return (Math.atan(this.slope) * 180) / Math.PI;
  }

  /**
   * In hours
   */
  get time_enroute(): number {
    return this.distance >= 0 && this.ground_speed > 0 ? this.distance / this.ground_speed : 0;
  }

  fromMainMcf(waypoint: MainMcfWaypointInterface): MissionCheckpoint {
    this.type = <MissionCheckpointType>waypoint.type;
    this.name = waypoint.Identifier;
    this.lon_lat = LonLat.fromMainMcf(waypoint.Position, waypoint.Elevation);
    if (waypoint.Altitude[0]) {
      this.lon_lat.altitude_m = Math.max(this.lon_lat.altitude_m, waypoint.Altitude[0]);
    }
    if (waypoint.Altitude[1]) {
      this.lon_lat.altitude_m = Math.min(this.lon_lat.altitude_m, waypoint.Altitude[1]);
    }
    this.frequency = waypoint.NavaidFrequency;
    this.length = waypoint.Length;
    this.flyOver = waypoint.FlyOver;
    return this;
  }

  /**
   * Add direction and distance to this checkpont.
   * May also change altitude to add separation.
   * @see https://en.wikipedia.org/wiki/Flight_level
   *
   * @param lastLonLat LonLat of last checkpoint before this one
   * @param changeHeight If not set to null, will change heights to 'IFR' if not 'VFR' given
   */
  setDirectionByCoordinates(lastLonLat: LonLat, changeHeight: null | MissionConditionsFlightRules = null) {
    this.direction = lastLonLat.getBearingTo(this.lon_lat);
    this.heading = this.direction;
    this.distance = lastLonLat.getDistanceTo(this.lon_lat);

    if (changeHeight && this.type === MissionCheckpoint.TYPE_WAYPOINT) {
      const altitude_ft = this.lon_lat.altitude_ft;
      const direction_magnetic = this.direction_magnetic;
      if (changeHeight === MissionConditions.CONDITION_VFR || changeHeight === MissionConditions.CONDITION_MVFR) {
        // Separation above 3000ft MSL
        if (altitude_ft > 3000 && altitude_ft < 20000) {
          this.lon_lat.altitude_ft =
            direction_magnetic < 180
              ? Math.ceil((altitude_ft - 1500) / 2000) * 2000 + 1500 // 3500, 5500, ..
              : Math.ceil((altitude_ft - 500) / 2000) * 2000 + 500; // 4500, 6500, ..
        }
      } else {
        // IFR
        this.lon_lat.altitude_ft =
          direction_magnetic < 180
            ? Math.ceil((altitude_ft - 1000) / 2000) * 2000 + 1000 // 1000, 3000, ..
            : Math.ceil(altitude_ft / 2000) * 2000; // 2000, 4000, ..
      }
    }

    const altDifference = this.lon_lat.altitude_m - lastLonLat.altitude_m; // m
    this.slope = altDifference / this.distance_m;
  }

  toString(index: number): string {
    let additional = "";
    if (this.type === MissionCheckpoint.TYPE_WAYPOINT) {
      additional += `\
                        <[bool][fly_over][${this.flyOver ? "true" : "false"}]>
`;
    }
    if (this.lon_lat.altitude_m !== 0) {
      additional += `\
                        <[bool][alt_cst][true]>
`;
    }
    return `\
                    <[tmmission_checkpoint][element][${index}]
                        <[string8u][type][${Quote.tmc(this.type)}]>
                        <[string8u][name][${Quote.tmc(this.name)}]>
                        <[vector2_float64][lon_lat][${this.lon_lat}]>
                        <[float64][altitude][${this.lon_lat.altitude_m}]>
                        //<[float64][speed][${this.speed}]>
                        <[float64][direction][${this.direction}]>
                        <[float64][slope][${this.slope}]> // ${this.slope_deg.toFixed(1)} deg
                        <[float64][length][${this.length}]>
                        <[float64][frequency][${this.frequency.toFixed()}]>
${additional}\
                    >
`;
  }

  toStringTargetPlane(name: string = "finish"): string {
    return `\
                <[tmmission_target_plane][${name}][]
                    <[vector2_float64][lon_lat][${this.lon_lat.lon} ${this.lon_lat.lat}]>
                    <[float64][direction][${this.direction}]>
                >
`;
  }

  hydrate(cp: MissionCheckpoint) {
    this.type = cp.type ?? this.type;
    this.name = cp.name ?? this.name;
    this.lon_lat.magnetic_declination = cp.lon_lat.magnetic_declination ?? this.lon_lat.magnetic_declination;
    this.lon_lat.lon = cp.lon_lat.lon ?? this.lon_lat.lon;
    this.lon_lat.lat = cp.lon_lat.lat ?? this.lon_lat.lat;
    this.lon_lat.altitude_m = cp.lon_lat.altitude_m ?? this.lon_lat.altitude_m;
    this.direction = cp.direction ?? this.direction;
    this.distance = cp.distance ?? this.direction;
    this.slope = cp.slope ?? this.slope;
    this.length = cp.length ?? this.length;
    this.frequency = cp.frequency ?? this.frequency;
    this.speed = cp.speed ?? this.speed;
    this.ground_speed = cp.ground_speed ?? this.ground_speed;
    this.heading = cp.heading ?? this.heading;
    this.flyOver = cp.flyOver ?? this.flyOver;
  }
}
