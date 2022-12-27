import { LonLat } from "../World/LonLat.js";
export class MissionCheckpoint {
    constructor() {
        this._type = "waypoint";
        this.name = "";
        this.lon_lat = new LonLat(0, 0);
        /**
         * True course in degrees to fly from last point to this point.
         * -1 on first, but seems rather unrelevant
         */
        this.direction = -1;
        /**
         *  Not official: Distance in nautical miles to fly from last point to this point.
         *-1 on first
         */
        this.distance = -1;
        /**
         * Only set on waypoint, function unknown
         */
        this.slope = 0;
        /**
         * Set on departure_runway, destination_runway
         */
        this.length = 0;
        /**
         * In Hz, `111400000` is 111.4 MHz
         * @see MissionCheckpoint.rawFreqency
         */
        this.frequency = 0;
        /**
         * Not official: In knots
         */
        this.ground_speed = -1;
        /**
         * Not official: True heading to fly to correct for wind drift
         */
        this.heading = -1;
    }
    /**
     * Aerofly represents frequencies in Hz.
     * If you want to set a frequency in MHz, use this setter.
     */
    set frequency_mhz(frequency_mhz) {
        this.frequency = frequency_mhz * 1000000;
    }
    get frequency_mhz() {
        return this.frequency / 1000000;
    }
    /**
   * Aerofly represents frequencies in Hz.
   * If you want to set a frequency in KHz, use this setter.
   */
    set frequency_khz(frequency_khz) {
        this.frequency = frequency_khz * 1000;
    }
    get frequency_khz() {
        return this.frequency / 1000;
    }
    get frequency_unit() {
        return this.frequency > 10000000 ? 'M' : 'k';
    }
    get frequency_string() {
        if (!this.frequency) {
            return '';
        }
        const frequency_unit = this.frequency_unit;
        return ((frequency_unit === 'M') ? this.frequency_mhz.toFixed(2) : this.frequency_khz.toFixed()) + ' ' + frequency_unit + 'Hz';
    }
    get direction_magnetic() {
        return (this.direction - this.lon_lat.magnetic_declination + 360) % 360;
    }
    get heading_magnetic() {
        return (this.heading - this.lon_lat.magnetic_declination + 360) % 360;
    }
    set type(type) {
        if (![
            MissionCheckpoint.TYPE_ORIGIN,
            MissionCheckpoint.TYPE_DEPARTURE_RUNWAY,
            MissionCheckpoint.TYPE_WAYPOINT,
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
    /**
     * In hours
     */
    get time_enroute() {
        return this.distance >= 0 && this.ground_speed > 0 ? this.distance / this.ground_speed : 0;
    }
    get direction_rad() {
        return (this.direction % 360) / 180 * Math.PI;
    }
    /**
     *
     * @param waypoint
     * @param cruiseAltitude in meters
     * @returns MissionCheckpoint
     */
    fromMainMcf(waypoint) {
        this.type = waypoint.type;
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
    setDirectionByCoordinates(lonLat) {
        this.direction = lonLat.getBearingTo(this.lon_lat);
        this.heading = this.direction;
        this.distance = lonLat.getDistanceTo(this.lon_lat);
    }
    toString(index) {
        return `                    <[tmmission_checkpoint][element][${index}]
                        <[string8u][type][${this.type}]>
                        <[string8u][name][${this.name}]>
                        <[vector2_float64][lon_lat][${this.lon_lat}]>
                        <[float64][altitude][${this.lon_lat.altitude_m}]>
                        <[float64][direction][${this.direction}]>
                        <[float64][slope][${this.slope}]>
                        <[float64][length][${this.length}]>
                        <[float64][frequency][${this.frequency.toFixed()}]>
                    >
`;
    }
    fromJSON(cp) {
        this._type = cp._type;
        this.name = cp.name;
        this.lon_lat.lon = cp.lon_lat.lon;
        this.lon_lat.lat = cp.lon_lat.lat;
        this.lon_lat.altitude_m = cp.lon_lat.altitude_m;
        this.direction = cp.direction;
        this.distance = cp.distance;
        this.slope = cp.slope;
        this.length = cp.length;
        this.frequency = cp.frequency;
        this.ground_speed = cp.ground_speed;
        this.heading = cp.heading;
    }
}
MissionCheckpoint.TYPE_ORIGIN = "origin";
MissionCheckpoint.TYPE_DEPARTURE_RUNWAY = "departure_runway";
MissionCheckpoint.TYPE_WAYPOINT = "waypoint";
MissionCheckpoint.TYPE_DESTINATION_RUNWAY = "destination_runway";
MissionCheckpoint.TYPE_DESTINATION = "destination";
