import { Quote } from "../Export/Quote.js";
import { LonLat } from "../World/LonLat.js";
import { Units } from "../World/Units.js";
export class MissionCheckpoint {
    constructor() {
        this.type = "waypoint";
        this.name = "";
        this.lon_lat = new LonLat(0, 0);
        /**
         * True course in degrees to fly from last point to this point.
         * -1 on first, but seems rather unrelevant
         */
        this.direction = -1;
        /**
         *  Not official: Distance in nautical miles to fly from last point to this point.
         * -1 on first
         */
        this.distance = -1;
        /**
         * Only set on waypoint, function unknown
         * Given in percentage, -1..1
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
         * Not official: In kts TAS
         */
        this.speed = -1;
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
        return this.frequency > 10000000 ? "M" : "k";
    }
    get frequency_string() {
        if (!this.frequency) {
            return "";
        }
        const frequency_unit = this.frequency_unit;
        return ((frequency_unit === "M" ? this.frequency_mhz.toFixed(2) : this.frequency_khz.toFixed()) +
            " " +
            frequency_unit +
            "Hz");
    }
    get type_extended() {
        if (this.type === MissionCheckpoint.TYPE_WAYPOINT) {
            if (this.frequency) {
                return this.frequency_unit === 'M' ? MissionCheckpoint.TYPE_VOR : MissionCheckpoint.TYPE_NDB;
            }
            if (this.name.match(/[A-Z]{5}/)) {
                return MissionCheckpoint.TYPE_INTERSECTION;
            }
        }
        return this.type;
    }
    /**
     * @returns boolean if the type and name are exportable to other applications because it is known there, e.g. VORs, NDBs
     */
    isExportable() {
        const type = this.type_extended;
        return (type === MissionCheckpoint.TYPE_ORIGIN || type === MissionCheckpoint.TYPE_DESTINATION || type === MissionCheckpoint.TYPE_NDB || type === MissionCheckpoint.TYPE_VOR || type === MissionCheckpoint.TYPE_INTERSECTION);
    }
    get direction_magnetic() {
        if (this.direction == -1) {
            return this.direction;
        }
        return (this.direction - this.lon_lat.magnetic_declination + 360) % 360;
    }
    get direction_rad() {
        return ((this.direction % 360) / 180) * Math.PI;
    }
    get heading_magnetic() {
        if (this.heading == -1) {
            return this.heading;
        }
        return (this.heading - this.lon_lat.magnetic_declination + 360) % 360;
    }
    get distance_m() {
        return this.distance * Units.meterPerNauticalMile;
    }
    get slope_deg() {
        return Math.atan(this.slope) * 180 / Math.PI;
    }
    /**
     * In hours
     */
    get time_enroute() {
        return this.distance >= 0 && this.ground_speed > 0 ? this.distance / this.ground_speed : 0;
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
     * @param lastLonLat LonLat of last checkpoint before this one
     */
    setDirectionByCoordinates(lastLonLat) {
        this.direction = lastLonLat.getBearingTo(this.lon_lat);
        this.heading = this.direction;
        this.distance = lastLonLat.getDistanceTo(this.lon_lat);
        const altDifference = this.lon_lat.altitude_m - lastLonLat.altitude_m; // m
        this.slope = altDifference / this.distance_m;
    }
    toString(index) {
        return `                    <[tmmission_checkpoint][element][${index}]
                        <[string8u][type][${Quote.tmc(this.type)}]>
                        <[string8u][name][${Quote.tmc(this.name)}]>
                        <[vector2_float64][lon_lat][${this.lon_lat}]>
                        <[float64][altitude][${this.lon_lat.altitude_m}]>
                        //<[float64][speed][${this.speed}]>
                        <[float64][direction][${this.direction}]>
                        <[float64][slope][${this.slope}]> // ${this.slope_deg.toFixed(1)} deg
                        <[float64][length][${this.length}]>
                        <[float64][frequency][${this.frequency.toFixed()}]>
                    >
`;
    }
    hydrate(cp) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
        this.type = (_a = cp.type) !== null && _a !== void 0 ? _a : this.type;
        this.name = (_b = cp.name) !== null && _b !== void 0 ? _b : this.name;
        this.lon_lat.magnetic_declination = (_c = cp.lon_lat.magnetic_declination) !== null && _c !== void 0 ? _c : this.lon_lat.magnetic_declination;
        this.lon_lat.lon = (_d = cp.lon_lat.lon) !== null && _d !== void 0 ? _d : this.lon_lat.lon;
        this.lon_lat.lat = (_e = cp.lon_lat.lat) !== null && _e !== void 0 ? _e : this.lon_lat.lat;
        this.lon_lat.altitude_m = (_f = cp.lon_lat.altitude_m) !== null && _f !== void 0 ? _f : this.lon_lat.altitude_m;
        this.direction = (_g = cp.direction) !== null && _g !== void 0 ? _g : this.direction;
        this.distance = (_h = cp.distance) !== null && _h !== void 0 ? _h : this.direction;
        this.slope = (_j = cp.slope) !== null && _j !== void 0 ? _j : this.slope;
        this.length = (_k = cp.length) !== null && _k !== void 0 ? _k : this.length;
        this.frequency = (_l = cp.frequency) !== null && _l !== void 0 ? _l : this.frequency;
        this.speed = (_m = cp.speed) !== null && _m !== void 0 ? _m : this.speed;
        this.ground_speed = (_o = cp.ground_speed) !== null && _o !== void 0 ? _o : this.ground_speed;
        this.heading = (_p = cp.heading) !== null && _p !== void 0 ? _p : this.heading;
    }
}
MissionCheckpoint.TYPE_ORIGIN = "origin";
MissionCheckpoint.TYPE_DEPARTURE_RUNWAY = "departure_runway";
MissionCheckpoint.TYPE_WAYPOINT = "waypoint";
MissionCheckpoint.TYPE_DESTINATION_RUNWAY = "destination_runway";
MissionCheckpoint.TYPE_DESTINATION = "destination";
MissionCheckpoint.TYPE_VOR = "vor";
MissionCheckpoint.TYPE_NDB = "ndb";
MissionCheckpoint.TYPE_INTERSECTION = "intersection";
