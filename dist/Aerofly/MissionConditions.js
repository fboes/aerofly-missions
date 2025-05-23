import { Units } from "../World/Units.js";
export class MissionConditionsCloud {
    constructor(cover_percent = 0, height_percent = 0) {
        /**
         * Percentage, 0..1
         */
        this.cover = 0.0;
        /**
         * Meters AGL
         */
        this.height = 0.0;
        this.height_percent = height_percent;
        this.cover = cover_percent;
    }
    set height_percent(percent) {
        this.height = (percent * 10000) / Units.feetPerMeter; // Max cloud height
    }
    get height_percent() {
        return (this.height * Units.feetPerMeter) / 10000; // Max cloud height
    }
    set cover_code(cover_code) {
        switch (cover_code) {
            case "CLR":
                this.cover = 0;
                break;
            case "FEW":
                this.cover = 1 / 8;
                break;
            case "SCT":
                this.cover = 2 / 8;
                break;
            case "BKN":
                this.cover = 4 / 8;
                break;
            case "OVC":
                this.cover = 1;
                break;
            default:
                this.cover = 0;
                break;
        }
    }
    /**
     * @see https://en.wikipedia.org/wiki/METAR
     */
    get cover_code() {
        const octas = Math.round(this.cover * 8);
        if (octas < 1) {
            return "CLR";
        }
        else if (octas <= 2) {
            return "FEW";
        }
        else if (octas <= 4) {
            return "SCT";
        }
        else if (octas <= 7) {
            return "BKN";
        }
        return "OVC";
    }
    /**
     * @see https://aviation.stackexchange.com/questions/13280/what-do-the-different-colors-of-weather-stations-indicate-on-skyvector
     */
    get cover_symbol() {
        if (this.cover === 0) {
            return "○";
        }
        else if (this.cover <= 0.125) {
            return "⦶";
        }
        else if (this.cover <= 0.375) {
            return "◔";
        }
        else if (this.cover <= 0.625) {
            return "◑";
        }
        else if (this.cover <= 0.875) {
            return "◕";
        }
        return "●";
    }
    set height_feet(height_feet) {
        this.height = height_feet / Units.feetPerMeter;
    }
    get height_feet() {
        return this.height * Units.feetPerMeter;
    }
}
export class MissionConditionsTime {
    constructor() {
        this.dateTime = new Date();
        this.dateTime.setUTCSeconds(0);
        this.dateTime.setUTCMilliseconds(0);
    }
    get time_year() {
        return this.dateTime.getUTCFullYear();
    }
    set time_year(time_year) {
        this.dateTime.setUTCFullYear(time_year);
    }
    get time_month() {
        return this.dateTime.getUTCMonth() + 1;
    }
    set time_month(time_month) {
        this.dateTime.setUTCMonth(time_month - 1);
    }
    get time_day() {
        return this.dateTime.getUTCDate();
    }
    set time_day(time_day) {
        this.dateTime.setUTCDate(time_day);
    }
    get time_hours() {
        return this.dateTime.getUTCHours() + this.dateTime.getUTCMinutes() / 60;
    }
    set time_hours(time_hours) {
        this.dateTime.setUTCHours(Math.ceil(time_hours));
        this.dateTime.setUTCMinutes((time_hours % 1) * 60);
    }
}
export class MissionConditions {
    constructor() {
        this.time = new MissionConditionsTime();
        /**
         * True direction wind is coming from in Degrees
         */
        this.wind_direction = 0;
        /**
         * Knots
         */
        this.wind_speed = 0;
        this.wind_gusts = 0;
        this.turbulence_strength = 0;
        this.thermal_strength = 0;
        /**
         * Meters
         */
        this.visibility = 20000;
        this.clouds = [new MissionConditionsCloud()];
    }
    /**
     * Get lowest cloud
     */
    get cloud() {
        if (this.clouds.length < 1) {
            this.clouds.push(new MissionConditionsCloud());
        }
        return this.clouds[0];
    }
    /**
     * Get medium cloud
     */
    get cloud2() {
        if (this.clouds.length < 2) {
            this.clouds.push(new MissionConditionsCloud());
        }
        return this.clouds[1];
    }
    /**
     * Get highest cloud
     */
    get cloud3() {
        if (this.clouds.length < 3) {
            this.clouds.push(new MissionConditionsCloud());
        }
        return this.clouds[2];
    }
    set visibility_percent(percent) {
        this.visibility = Math.round(percent * 15000); // Max visibility
    }
    get visibility_percent() {
        return Math.min(1, this.visibility / 15000); // Max visibility
    }
    get visibility_sm() {
        return this.visibility === 15000 ? 10 : this.visibility / Units.meterPerStatuteMile;
    }
    set wind_speed_percent(percent) {
        this.wind_speed = 8 * (percent + Math.pow(percent, 2));
    }
    get wind_speed_percent() {
        return Math.sqrt(this.wind_speed / 8 + 0.25) - 0.5;
    }
    get wind_direction_rad() {
        return ((this.wind_direction % 360) / 180) * Math.PI;
    }
    get wind_gusts_type() {
        const delta = this.wind_gusts - this.wind_speed;
        if (delta > 25) {
            return MissionConditions.WIND_GUSTS_VIOLENT;
        }
        else if (delta > 15) {
            return MissionConditions.WIND_GUSTS_STRONG;
        }
        else if (delta > 10) {
            return MissionConditions.WIND_GUSTS_STANDARD;
        }
        return "";
    }
    fromMainMcf(mainMcf) {
        this.time.time_year = mainMcf.time_utc.time_year;
        this.time.time_month = mainMcf.time_utc.time_month;
        this.time.time_day = mainMcf.time_utc.time_day;
        this.time.time_hours = mainMcf.time_utc.time_hours;
        this.wind_direction = mainMcf.wind.direction_in_degree;
        this.wind_speed_percent = mainMcf.wind.strength;
        this.wind_gusts = this.wind_speed + mainMcf.wind.turbulence * 25;
        this.turbulence_strength = mainMcf.wind.turbulence;
        this.thermal_strength = mainMcf.wind.thermal_activity;
        this.visibility_percent = mainMcf.visibility;
        // Order clouds from lowest to highest, ignoring empty cloud layers
        this.clouds = [
            [mainMcf.clouds.cumulus_density, mainMcf.clouds.cumulus_height],
            [mainMcf.clouds.cumulus_mediocris_density, mainMcf.clouds.cumulus_mediocris_height],
            [mainMcf.clouds.cirrus_density, mainMcf.clouds.cirrus_height],
        ].map((a) => {
            return new MissionConditionsCloud(a[0], a[1]);
        });
        return this;
    }
    /**
     * @see https://www.thinkaviation.net/levels-of-vfr-ifr-explained/
     * @see https://en.wikipedia.org/wiki/Ceiling_(cloud)
     */
    getFlightCategory(useIcao = false) {
        let cloud_base_feet = 9999;
        this.clouds.forEach((cloud) => {
            if (cloud.cover > 0.5) {
                cloud_base_feet = Math.min(cloud_base_feet, cloud.height_feet);
            }
        });
        if (useIcao) {
            if (this.visibility >= 5000 && cloud_base_feet > 1500) {
                return MissionConditions.CONDITION_VFR;
            }
            return MissionConditions.CONDITION_IFR;
        }
        else {
            const visibility_sm = this.visibility_sm;
            if (visibility_sm > 5.0 && cloud_base_feet > 3000) {
                return MissionConditions.CONDITION_VFR;
            }
            if (visibility_sm >= 3.0 && cloud_base_feet >= 1000) {
                return MissionConditions.CONDITION_MVFR;
            }
            if (visibility_sm >= 1.0 && cloud_base_feet >= 500) {
                return MissionConditions.CONDITION_IFR;
            }
            return MissionConditions.CONDITION_LIFR;
        }
    }
    /**
     * @see https://e6bx.com/e6b
     *
     * @param course_rad in radians
     * @param tas_kts in knots
     * @returns ground speed in knots, true heading
     */
    getWindCorrection(course_rad, tas_kts) {
        const deltaRad = this.wind_direction_rad - course_rad;
        const correctionRad = deltaRad === 0 || deltaRad === Math.PI ? 0 : Math.asin((this.wind_speed * Math.sin(deltaRad)) / tas_kts);
        const heading_rad = correctionRad + course_rad;
        let ground_speed = tas_kts - Math.cos(deltaRad) * this.wind_speed;
        if (deltaRad === 0) {
            ground_speed = tas_kts - this.wind_speed;
        }
        else if (deltaRad === Math.PI) {
            ground_speed = tas_kts + this.wind_speed;
        }
        else {
            ground_speed = (Math.sin(deltaRad - correctionRad) * tas_kts) / Math.sin(deltaRad);
        }
        return {
            ground_speed,
            heading_rad,
            heading: ((heading_rad * 180) / Math.PI) % 360,
        };
    }
    makeTurbulence() {
        this.turbulence_strength = Math.min(1, this.wind_speed / 80 + this.wind_gusts / 20);
    }
    toString() {
        return `\
                <[tmmission_conditions][conditions][]
                    <[tm_time_utc][time][]
                        <[int32][time_year][${this.time.time_year.toFixed()}]>
                        <[int32][time_month][${this.time.time_month.toFixed()}]>
                        <[int32][time_day][${this.time.time_day.toFixed()}]>
                        <[float64][time_hours][${this.time.time_hours}]>
                    >
                    <[float64][wind_direction][${this.wind_direction}]>
                    <[float64][wind_speed][${this.wind_speed}]> // kts
                    <[float64][wind_gusts][${this.wind_gusts}]> // kts
                    <[float64][turbulence_strength][${this.turbulence_strength}]>
                    <[float64][thermal_strength][${this.thermal_strength}]>
                    <[float64][visibility][${this.visibility}]> // meters
                    <[float64][cloud_cover][${this.cloud.cover}]>
                    <[float64][cloud_base][${this.cloud.height}]> // meters AGL
                    <[float64][cirrus_cover][${this.cloud2.cover}]>
                    <[float64][cirrus_base][${this.cloud2.height}]> // meters AGL
                    <[float64][cumulus_mediocris_cover][${this.cloud3.cover}]>
                    <[float64][cumulus_mediocris_base][${this.cloud3.height}]> // meters AGL
                >
`;
    }
    hydrate(json) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        if (json.time.dateTime) {
            this.time.dateTime = new Date(json.time.dateTime);
        }
        else {
            this.time.time_day = (_a = json.time.time_day) !== null && _a !== void 0 ? _a : this.time.time_day;
            this.time.time_hours = (_b = json.time.time_hours) !== null && _b !== void 0 ? _b : this.time.time_hours;
            this.time.time_month = (_c = json.time.time_month) !== null && _c !== void 0 ? _c : this.time.time_month;
            this.time.time_year = (_d = json.time.time_year) !== null && _d !== void 0 ? _d : this.time.time_year;
        }
        this.wind_direction = (_e = json.wind_direction) !== null && _e !== void 0 ? _e : this.wind_direction;
        this.wind_speed = (_f = json.wind_speed) !== null && _f !== void 0 ? _f : this.wind_speed;
        this.wind_gusts = (_g = json.wind_gusts) !== null && _g !== void 0 ? _g : this.wind_gusts;
        this.turbulence_strength = (_h = json.turbulence_strength) !== null && _h !== void 0 ? _h : this.turbulence_strength;
        this.thermal_strength = (_j = json.thermal_strength) !== null && _j !== void 0 ? _j : this.thermal_strength;
        this.visibility = (_k = json.visibility) !== null && _k !== void 0 ? _k : this.visibility;
        this.clouds = json.clouds.map((c) => {
            const cx = new MissionConditionsCloud(0, 0);
            cx.cover = c.cover;
            cx.height = c.height;
            return cx;
        });
    }
}
MissionConditions.CONDITION_VFR = "VFR";
MissionConditions.CONDITION_MVFR = "MVFR";
MissionConditions.CONDITION_IFR = "IFR";
MissionConditions.CONDITION_LIFR = "LIFR";
MissionConditions.WIND_GUSTS_STANDARD = "gusts";
MissionConditions.WIND_GUSTS_STRONG = "strong gusts";
MissionConditions.WIND_GUSTS_VIOLENT = "violent gusts";
