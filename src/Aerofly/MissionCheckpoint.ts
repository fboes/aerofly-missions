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
   * Direction in degrees to fly from last point to this point.
   * -1 on first, but seem rather unrelevant
   */
  direction: number = -1;
  /**
    * Distance in nautical miles to fly from last point to this point.
    *-1 on first
   */
  distance: number = -1;
  /**
   * Only set on waypoint
   */
  slope: number = 0;
  /**
   * Set on departure_runway, destination_runway
   */
  length: number = 0;
  /**
   * Aerofly representation, `111400000` is 111.4 MHz
   * @see MissionCheckpoint.rawFreqency
   */
  frequency: number = 0;
  /**
   * In knots
   */
  speed: number = -1;

  static TYPE_ORIGIN = "origin";
  static TYPE_DEPARTURE_RUNWAY = "departure_runway";
  static TYPE_WAYPOINT = "waypoint";
  static TYPE_APPROACH = "approach";
  static TYPE_DESTINATION_RUNWAY = "destination_runway";
  static TYPE_DESTINATION = "destination";

  /**
   * Aerofly represents frequencies not as floating numbers.
   * If you want to set a frequency in MHz, use this setter.
   */
  set rawFrequency(frequency: number) {
    this.frequency = frequency * (this.frequency < 200 ? 1000000 : 1000);
  }

  get rawFrequency(): number {
    return this.frequency / (this.frequency > 1000000 ? 1000000 : 1000);
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
    return (this.distance >= 0 && this.speed > 0) ? (this.distance / this.speed) : 0;
  }

  get altitude_ft(): number {
    return this.altitude * 3.28084;
  }

  set altitude_ft(altitude_ft: number) {
    this.altitude = altitude_ft / 3.28084
  }

  fromMainMcf(waypoint: MainMcfWaypointInterface, cruiseAltitude: number = 0): MissionCheckpoint {
    this.type = waypoint.type;
    this.name = waypoint.Identifier;
    this.lon_lat = LonLat.fromMainMcf(waypoint.Position);
    this.altitude = waypoint.Elevation || cruiseAltitude;
    this.frequency = waypoint.NavaidFrequency;
    this.length = waypoint.Length;
    return this;
  }

  setDirectionByCoordinates(lonLat: LonLat) {
    this.direction = lonLat.getBearingTo(this.lon_lat);
    this.distance = lonLat.getDistanceTo(this.lon_lat);

    /*if (this.altitude && this.direction && this.type == MissionCheckpoint.TYPE_WAYPOINT) {
      let altitude_ft = Math.ceil((this.altitude_ft - 500) / 1000) * 1000;
      if ((altitude_ft % 2000 !== 0) !== (this.direction < 180)) {
        altitude_ft += 1000;
      }
      altitude_ft += 500;
      this.altitude_ft = altitude_ft;
    }*/
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
