import { timeStamp } from "node:console";
import { LonLat } from "./LonLat.js";
import { MainMcfWaypointInterface } from "./MainMcf.js";

export class MissionCheckpoint {
  protected _type: string = "waypoint";
  name: string = "";
  lon_lat: LonLat = new LonLat(0, 0);
  /**
   * Altitude in meters MSL
   */
  altitude: number = 0;
  /**
   * Course in degrees to fly from last point to this point.
   * -1 on first, but seem rather unrelevant
   */
  direction: number = -1;
  /**
   * Distance in nautical miles to fly from last point to this point.
   *-1 on first
   */
  distance: number = -1;
  /**
   * Only set on waypoint, function unknown
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
   * Not official: In knots
   */
  ground_speed: number = -1;
  /**
   * Not official: Heading to fly to correct for wind drift
   */
  heading: number = -1;

  static TYPE_ORIGIN = "origin";
  static TYPE_DEPARTURE_RUNWAY = "departure_runway";
  static TYPE_WAYPOINT = "waypoint";
  static TYPE_APPROACH = "approach";
  static TYPE_DESTINATION_RUNWAY = "destination_runway";
  static TYPE_DESTINATION = "destination";

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

  get frequency_unit(): string {
    return this.frequency > 10000000 ? 'M' : 'k';
  }

  get frequency_string(): string {
    if (!this.frequency) {
      return '';
    }
    const frequency_unit = this.frequency_unit;
    return ((frequency_unit === 'M') ? this.frequency_mhz.toFixed(2) : this.frequency_khz.toFixed()) + ' ' + frequency_unit + 'Hz';
  }

  set type(type: string) {
    if (
      ![
        MissionCheckpoint.TYPE_ORIGIN,
        MissionCheckpoint.TYPE_DEPARTURE_RUNWAY,
        MissionCheckpoint.TYPE_WAYPOINT,
        MissionCheckpoint.TYPE_APPROACH,
        MissionCheckpoint.TYPE_DESTINATION_RUNWAY,
        MissionCheckpoint.TYPE_DESTINATION,
      ].includes(type)
    ) {
      throw new Error("Unknown checkpoint type: " + type);
    }
    this._type = type;
  }

  get type() {
    return this._type;
  }

  /**
   * In hours
   */
  get time(): number {
    return this.distance >= 0 && this.ground_speed > 0 ? this.distance / this.ground_speed : 0;
  }

  get altitude_ft(): number {
    return this.altitude * 3.28084;
  }

  set altitude_ft(altitude_ft: number) {
    this.altitude = altitude_ft / 3.28084;
  }

  get direction_rad() {
    return (this.direction % 360) / 180 * Math.PI;
  }

  fromMainMcf(waypoint: MainMcfWaypointInterface, cruiseAltitude: number = 0): MissionCheckpoint {
    this.type = waypoint.type;
    this.name = waypoint.Identifier;
    this.lon_lat = LonLat.fromMainMcf(waypoint.Position);
    this.altitude = waypoint.Elevation || cruiseAltitude;
    if (waypoint.Altitude[0]) {
      this.altitude = Math.max(this.altitude, waypoint.Altitude[0]);
    }
    if (waypoint.Altitude[1]) {
      this.altitude = Math.min(this.altitude, waypoint.Altitude[1]);
    }
    this.frequency = waypoint.NavaidFrequency;
    this.length = waypoint.Length;
    return this;
  }

  /**
   * Add direction and distance to this checkpont. Also fix altitude to add separation.
   * @see https://en.wikipedia.org/wiki/Flight_level
   *
   * @param lonLat LonLat of last checkpoint before this one
   */
  setDirectionByCoordinates(lonLat: LonLat) {
    this.direction = lonLat.getBearingTo(this.lon_lat);
    this.heading = this.direction;
    this.distance = lonLat.getDistanceTo(this.lon_lat);

    // Separation above 3000ft MSL VFR
    let altitude_ft = this.altitude_ft;
    if (altitude_ft > 3000 && altitude_ft < 20000 && this.direction && this.type == MissionCheckpoint.TYPE_WAYPOINT) {
      this.altitude_ft = (this.direction < 180)
        ? Math.ceil((altitude_ft - 1500) / 2000) * 2000 + 1500 // 3500, 5500
        : Math.ceil((altitude_ft - 500) / 2000) * 2000 + 500; // 4500, 6500
    }
  }

  toString(index: number): string {
    return `                    <[tmmission_checkpoint][element][${index}]
                        <[string8u][type][${this.type}]>
                        <[string8u][name][${this.name}]>
                        <[vector2_float64][lon_lat][${this.lon_lat}]>
                        <[float64][altitude][${this.altitude}]>
                        <[float64][direction][${this.direction}]>
                        // <[float64][distance][${this.distance.toFixed(2)}]>
                        // <[float64][time][${this.time.toFixed(2)}]>
                        <[float64][slope][${this.slope}]>
                        <[float64][length][${this.length}]>
                        <[float64][frequency][${this.frequency.toFixed()}]>
                    >
`;
  }
}
