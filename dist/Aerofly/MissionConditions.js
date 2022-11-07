export class MissionConditions {
    constructor() {
        this.time = {
            time_year: 2022,
            time_month: 1,
            time_day: 1,
            time_hours: 20,
        };
        /**
         * Degrees
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
    }
    fromMainMcf(mainMcf) {
        this.time.time_year = mainMcf.time_utc.time_year;
        this.time.time_month = mainMcf.time_utc.time_month;
        this.time.time_day = mainMcf.time_utc.time_day;
        this.time.time_hours = mainMcf.time_utc.time_hours;
        this.wind_direction = mainMcf.wind.direction_in_degree;
        this.wind_speed_percent = mainMcf.wind.strength;
        this.wind_gusts = this.wind_speed * (1 + mainMcf.wind.turbulence);
        this.turbulence_strength = mainMcf.wind.turbulence;
        this.thermal_strength = mainMcf.wind.thermal_activity;
        this.visibility_percent = mainMcf.visibility;
        // Order clouds from lowest to highest, ignoring empty cloud layers
        const clouds = [
            [mainMcf.clouds.cumulus_density, mainMcf.clouds.cumulus_height],
            [mainMcf.clouds.cumulus_mediocris_density, mainMcf.clouds.cumulus_mediocris_height],
            [mainMcf.clouds.cirrus_density, mainMcf.clouds.cirrus_height],
        ].sort((a, b) => {
            return a[0] <= 0 ? +1 : a[1] - b[1];
        });
        const lowestCloud = clouds[0];
        this.cloud_base_percent = lowestCloud[1];
        this.cloud_cover = lowestCloud[0];
        return this;
    }
    set cloud_base_percent(percent) {
        this.cloud_base = percent * 10000 / 3.28084; // Max cloud height
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
    get cloud_base_feet() {
        return this.cloud_base * 3.28084;
    }
    set visibility_percent(percent) {
        this.visibility = percent * 10000; // Max visibility
    }
    get visibility_sm() {
        return (this.visibility === 10000) ? 10 : this.visibility / 1000 / 1.609344;
    }
    set wind_speed_percent(percent) {
        this.wind_speed = 8 * (percent + Math.pow(percent, 2));
    }
    get wind_direction_rad() {
        return (this.wind_direction % 360) / 180 * Math.PI;
    }
    /**
     * @see https://e6bx.com/e6b
     *
     * @param course_rad in radians
     * @param tas_kts in knots
     * @returns ground speed in knots, heading
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
