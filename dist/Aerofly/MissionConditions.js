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
        let lowest = [0, 10];
        [
            [mainMcf.clouds.cumulus_density, mainMcf.clouds.cumulus_height],
            [mainMcf.clouds.cumulus_mediocris_density, mainMcf.clouds.cumulus_mediocris_height],
            [mainMcf.clouds.cirrus_density, mainMcf.clouds.cirrus_height],
        ].forEach((c) => {
            if (c[1] !== 0 && c[1] < lowest[1]) {
                lowest = c;
            }
        });
        this.cloud_base_percent = lowest[1];
        this.cloud_cover = lowest[0];
        return this;
    }
    set cloud_base_percent(percent) {
        this.cloud_base = percent * 10000 / 3.28084; // Max cloud height
    }
    /**
     * @see https://en.wikipedia.org/wiki/METAR
     */
    get cloud_cover_code() {
        console.log(this.cloud_cover);
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
    set wind_speed_percent(percent) {
        this.wind_speed = 8 * (percent + Math.pow(percent, 2));
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
