import { Units } from "../World/Units.js";
export class MissionConditions {
    constructor() {
        this.time = {
            time_year: 2022,
            time_month: 1,
            time_day: 1,
            time_hours: 20,
        };
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
        /**
         * Percentage, 0..1
         */
        this.cloud_cover = 0.0;
        /**
         * Meters AGL
         */
        this.cloud_base = 0.0;
        const d = new Date();
        this.time.time_year = d.getUTCFullYear();
        this.time.time_month = d.getUTCMonth() + 1;
        this.time.time_day = d.getUTCDate();
        this.time.time_hours = d.getUTCHours();
    }
    fromMainMcf(mainMcf) {
        this.time.time_year = mainMcf.time_utc.time_year;
        this.time.time_month = mainMcf.time_utc.time_month;
        this.time.time_day = mainMcf.time_utc.time_day;
        this.time.time_hours = mainMcf.time_utc.time_hours;
        this.wind_direction = mainMcf.wind.direction_in_degree;
        this.wind_speed_percent = mainMcf.wind.strength;
        this.wind_gusts = this.wind_speed + (mainMcf.wind.turbulence * 25);
        this.turbulence_strength = mainMcf.wind.turbulence;
        this.thermal_strength = mainMcf.wind.thermal_activity;
        this.visibility_percent = mainMcf.visibility;
        // Order clouds from lowest to highest, ignoring empty cloud layers
        const clouds = [
            [mainMcf.clouds.cumulus_density, mainMcf.clouds.cumulus_height],
            [mainMcf.clouds.cumulus_mediocris_density, mainMcf.clouds.cumulus_mediocris_height],
            [mainMcf.clouds.cirrus_density, mainMcf.clouds.cirrus_height],
        ].map((a) => {
            if (a[0] <= 0) {
                a[1] = 99999;
            }
            return a;
        }).sort((a, b) => {
            return a[1] - b[1];
        });
        // Get lowest cloud - but if it is to thin check if the next cloud has more substance
        const lowestCloud = (clouds[0][0] > 0.5 || clouds[0][0] > clouds[1][0]) ? clouds[0] : clouds[1];
        this.cloud_base_percent = lowestCloud[1];
        this.cloud_cover = lowestCloud[0];
        return this;
    }
    set cloud_base_percent(percent) {
        this.cloud_base = percent * 10000 / Units.feetPerMeter; // Max cloud height
    }
    set cloud_cover_code(cloud_cover_code) {
        switch (cloud_cover_code) {
            case 'CLR':
                this.cloud_cover = Math.random() * 1 / 8;
                break;
            case 'FEW':
                this.cloud_cover = 1 / 8 + (Math.random() * 1 / 8);
                break;
            case 'SCT':
                this.cloud_cover = 2 / 8 + (Math.random() * 2 / 8);
                break;
            case 'BKN':
                this.cloud_cover = 4 / 8 + (Math.random() * 3 / 8);
                break;
            case 'OVC':
                this.cloud_cover = 7 / 8 + (Math.random() * 1 / 8);
                break;
            default:
                this.cloud_cover = 0;
                break;
        }
    }
    /**
     * @see https://en.wikipedia.org/wiki/METAR
     */
    get cloud_cover_code() {
        if (this.cloud_cover < 1 / 8) {
            return 'CLR';
        }
        else if (this.cloud_cover <= 2 / 8) {
            return 'FEW';
        }
        else if (this.cloud_cover <= 4 / 8) {
            return 'SCT';
        }
        else if (this.cloud_cover <= 7 / 8) {
            return 'BKN';
        }
        return 'OVC';
    }
    /**
     * @see https://aviation.stackexchange.com/questions/13280/what-do-the-different-colors-of-weather-stations-indicate-on-skyvector
     */
    get cloud_cover_symbol() {
        if (this.cloud_cover === 0) {
            return '○';
        }
        else if (this.cloud_cover <= 0.125) {
            return '⦶';
        }
        else if (this.cloud_cover <= 0.375) {
            return '◔';
        }
        else if (this.cloud_cover <= 0.625) {
            return '◑';
        }
        else if (this.cloud_cover <= 0.875) {
            return '◕';
        }
        return '●';
    }
    set cloud_base_feet(cloud_base_feet) {
        this.cloud_base = cloud_base_feet / Units.feetPerMeter;
    }
    get cloud_base_feet() {
        return this.cloud_base * Units.feetPerMeter;
    }
    set visibility_percent(percent) {
        this.visibility = Math.round(percent * 15000); // Max visibility
    }
    get visibility_sm() {
        return (this.visibility === 15000) ? 10 : this.visibility / Units.meterPerStatuteMile;
    }
    set wind_speed_percent(percent) {
        this.wind_speed = 8 * (percent + Math.pow(percent, 2));
    }
    get wind_direction_rad() {
        return (this.wind_direction % 360) / 180 * Math.PI;
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
        return '';
    }
    /**
     * @see https://www.thinkaviation.net/levels-of-vfr-ifr-explained/
     * @see https://en.wikipedia.org/wiki/Ceiling_(cloud)
     */
    getFlightCategory(useIcao = false) {
        const cloud_base_feet = this.cloud_cover > 0.5 ? this.cloud_base_feet : 9999;
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
    get time_object() {
        return new Date(Date.UTC(this.time.time_year, this.time.time_month - 1, this.time.time_day, Math.floor(this.time.time_hours), Math.floor(this.time.time_hours % 1 * 60), Math.floor(this.time.time_hours % 1 * 60 % 1 * 60)));
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
        const correctionRad = (deltaRad === 0 || deltaRad === Math.PI)
            ? 0
            : Math.asin(this.wind_speed * Math.sin(deltaRad) / tas_kts);
        const heading_rad = correctionRad + course_rad;
        let ground_speed = tas_kts - Math.cos(deltaRad) * this.wind_speed;
        if (deltaRad === 0) {
            ground_speed = tas_kts - this.wind_speed;
        }
        else if (deltaRad === Math.PI) {
            ground_speed = tas_kts + this.wind_speed;
        }
        else {
            ground_speed = Math.sin(deltaRad - correctionRad) * tas_kts / Math.sin(deltaRad);
        }
        return {
            ground_speed,
            heading_rad,
            heading: (heading_rad * 180 / Math.PI) % 360
        };
    }
    makeTurbulence() {
        this.turbulence_strength = Math.min(1, this.wind_speed / 80 + this.wind_gusts / 20);
    }
    toString() {
        return `                <[tmmission_conditions][conditions][]
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
                    <[float64][cloud_cover][${this.cloud_cover}]>
                    <[float64][cloud_base][${this.cloud_base}]> // meters AGL
                >
`;
    }
}
MissionConditions.CONDITION_VFR = 'VFR';
MissionConditions.CONDITION_MVFR = 'MVFR';
MissionConditions.CONDITION_IFR = 'IFR';
MissionConditions.CONDITION_LIFR = 'LIFR';
MissionConditions.WIND_GUSTS_STANDARD = 'gusts';
MissionConditions.WIND_GUSTS_STRONG = 'strong gusts';
MissionConditions.WIND_GUSTS_VIOLENT = 'violent gusts';
