import { LonLat } from "./LonLat.js";
export class MissionCheckpoint {
    constructor() {
        this._type = "waypoint";
        this.name = "";
        this.lon_lat = new LonLat(0, 0);
        /**
         * Always set, but waypoints are AGL?
         */
        this.altitude = 0;
        /**
         * Direction in degrees to fly from last point to this point.
         * -1 on first, but seem rather unrelevant
         */
        this.direction = -1;
        /**
          * Distance in nautical miles to fly from last point to this point.
          *-1 on first
         */
        this.distance = -1;
        /**
         * Only set on waypoint
         */
        this.slope = 0;
        /**
         * Set on departure_runway, destination_runway
         */
        this.length = 0;
        /**
         * Aerofly representation, `111400000` is 111.4 MHz
         * @see MissionCheckpoint.rawFreqency
         */
        this.frequency = 0;
    }
    /**
     * Aerofly represents frequencies not as floating numbers.
     * If you want to set a frequency in MHz, use this setter.
     */
    set rawFrequency(frequency) {
        this.frequency = frequency * (this.frequency < 200 ? 1000000 : 1000);
    }
    get rawFrequency() {
        return this.frequency / (this.frequency > 1000000 ? 1000000 : 1000);
    }
    set type(type) {
        if (![
            MissionCheckpoint.TYPE_ORIGIN,
            MissionCheckpoint.TYPE_DEPARTURE_RUNWAY,
            MissionCheckpoint.TYPE_WAYPOINT,
            MissionCheckpoint.TYPE_APPROACH,
            MissionCheckpoint.TYPE_DESTINATION_RUNWAY,
            MissionCheckpoint.TYPE_DESTINATION,
        ].includes(type)) {
            throw new Error("Unknown checkpoint type: " + type);
        }
        this._type = type;
    }
    get type() {
        return this._type;
    }
    fromMainMcf(waypoint) {
        this.type = waypoint.type;
        this.name = waypoint.Identifier;
        this.lon_lat = LonLat.fromMainMcf(waypoint.Position);
        if (!waypoint.Elevation) {
            waypoint.Elevation = 1000;
        }
        this.altitude = waypoint.Elevation;
        this.frequency = waypoint.NavaidFrequency;
        this.length = waypoint.Length;
        return this;
    }
    setDirectionByCoordinates(lonLat) {
        this.direction = lonLat.getBearingTo(this.lon_lat);
        this.distance = lonLat.getDistanceTo(this.lon_lat);
    }
    toString(index) {
        return `                    <[tmmission_checkpoint][element][${index}]
                        <[string8u][type][${this.type}]>
                        <[string8u][name][${this.name}]>
                        <[vector2_float64][lon_lat][${this.lon_lat}]>
                        <[float64][altitude][${this.altitude}]>
                        <[float64][direction][${this.direction}]>
                        // <[float64][distance][${this.distance.toFixed(2)}]>
                        <[float64][slope][${this.slope}]>
                        <[float64][length][${this.length}]>
                        <[float64][frequency][${this.frequency.toFixed()}]>
                    >
`;
    }
}
MissionCheckpoint.TYPE_ORIGIN = "origin";
MissionCheckpoint.TYPE_DEPARTURE_RUNWAY = "departure_runway";
MissionCheckpoint.TYPE_WAYPOINT = "waypoint";
MissionCheckpoint.TYPE_APPROACH = "approach";
MissionCheckpoint.TYPE_DESTINATION_RUNWAY = "destination_runway";
MissionCheckpoint.TYPE_DESTINATION = "destination";
