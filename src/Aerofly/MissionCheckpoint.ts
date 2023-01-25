import { Quote } from "../Export/Quote.js";
import { LonLat } from "../World/LonLat.js";
import { MainMcfWaypointInterface } from "./MainMcf.js";

export type MissionCheckpointType = "origin" | "departure_runway" | "departure" | "waypoint" | "arrival" | "approach" | "destination_runway" | "destination";

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
   *-1 on first
   */
  distance: number = -1;
  /**
   * Only set on waypoint, function unknown
   * Problably percentage -1..1
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

  static TYPE_ORIGIN: MissionCheckpointType = "origin";
  static TYPE_DEPARTURE_RUNWAY: MissionCheckpointType = "departure_runway";
  static TYPE_WAYPOINT: MissionCheckpointType = "waypoint";
  static TYPE_DESTINATION_RUNWAY: MissionCheckpointType = "destination_runway";
  static TYPE_DESTINATION: MissionCheckpointType = "destination";

  /**
   * Aerofly represents frequencies in Hz.
   * If you want to set a frequency in MHz, use this setter.
   */
  set frequency_mhz(frequency_mhz: number) {
    this.frequency = frequency_mhz * 1000000;
  }

  get frequency_mhz(): number {
    return this.frequency / 1000000;
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

  get frequency_unit(): 'M' | 'k' {
    return this.frequency > 10000000 ? "M" : "k";
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

  /**
   * In hours
   */
  get time_enroute(): number {
    return this.distance >= 0 && this.ground_speed > 0 ? this.distance / this.ground_speed : 0;
  }

  /**
   *
   * @param waypoint
   * @param cruiseAltitude in meters
   * @returns MissionCheckpoint
   */
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
    return this;
  }

  /**
   * Add direction and distance to this checkpont.
   *
   * @param lonLat LonLat of last checkpoint before this one
   */
  setDirectionByCoordinates(lonLat: LonLat) {
    this.direction = lonLat.getBearingTo(this.lon_lat);
    this.heading = this.direction;
    this.distance = lonLat.getDistanceTo(this.lon_lat);
    this.slope = 0;
  }

  toString(index: number): string {
    return `                    <[tmmission_checkpoint][element][${index}]
                        <[string8u][type][${Quote.tmc(this.type)}]>
                        <[string8u][name][${Quote.tmc(this.name)}]>
                        <[vector2_float64][lon_lat][${this.lon_lat}]>
                        <[float64][altitude][${this.lon_lat.altitude_m}]>
                        //<[float64][speed][${this.speed}]>
                        <[float64][direction][${this.direction}]>
                        <[float64][slope][${this.slope}]>
                        <[float64][length][${this.length}]>
                        <[float64][frequency][${this.frequency.toFixed()}]>
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
  }
}
