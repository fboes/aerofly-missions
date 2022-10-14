import { MainMcf } from "./MainMcf.js";

export class MissionConditions {
  time = {
    time_year: 2022,
    time_month: 1,
    time_day: 1,
    time_hours: 20,
  };
  /**
   * Degrees
   */
  wind_direction: number = 0;
  /**
   * Knots
   */
  wind_speed: number = 0;
  wind_gusts: number = 0;
  turbulence_strength: number = 0;
  thermal_strength: number = 0;
  /**
   * Meters
   */
  visibility: number = 20000;
  /**
   * Percentage, 0..1
   */
  cloud_cover: number = 0.0;
  /**
   * Feet AGL
   */
  cloud_base: number = 0.0;

  fromMainMcf(mainMcf: MainMcf): MissionConditions {
    this.time.time_year = mainMcf.time_utc.time_year;
    this.time.time_month = mainMcf.time_utc.time_month;
    this.time.time_day = mainMcf.time_utc.time_day;
    this.time.time_hours = mainMcf.time_utc.time_hours;

    this.wind_direction = mainMcf.wind.direction_in_degree;
    this.wind_speed = 8 * (mainMcf.wind.strength + Math.pow(mainMcf.wind.strength, 2));
    this.wind_gusts = this.wind_speed * (1 + mainMcf.wind.turbulence);
    this.turbulence_strength = mainMcf.wind.turbulence;
    this.thermal_strength = mainMcf.wind.thermal_activity;
    this.visibility = mainMcf.visibility * 10000; // Max visibility

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
    this.cloud_base = lowest[1] * 3000; // Max cloud height
    this.cloud_cover = lowest[0];
    return this;
  }

  toString(): string {
    return `                <[tmmission_conditions][conditions][]
                    <[tm_time_utc][time][]
                        <[int32][time_year][${this.time.time_year.toFixed()}]>
                        <[int32][time_month][${this.time.time_month.toFixed()}]>
                        <[int32][time_day][${this.time.time_day.toFixed()}]>
                        <[float64][time_hours][${this.time.time_hours}]>
                    >
                    <[float64][wind_direction][${this.wind_direction}]>
                    <[float64][wind_speed][${this.wind_speed}]>
                    <[float64][wind_gusts][${this.wind_gusts}]>
                    <[float64][turbulence_strength][${this.turbulence_strength}]>
                    <[float64][thermal_strength][${this.thermal_strength}]>
                    <[float64][visibility][${this.visibility}]>
                    <[float64][cloud_cover][${this.cloud_cover}]>
                    <[float64][cloud_base][${this.cloud_base}]>
                >
`;
  }
}
