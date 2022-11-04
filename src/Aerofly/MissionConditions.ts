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
   * Meters AGL
   */
  cloud_base: number = 0.0;

  fromMainMcf(mainMcf: MainMcf): MissionConditions {
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
      return a[0] <= 0 ? +1 : a[1] - b[1]
    });
    const lowestCloud = clouds[0];

    this.cloud_base_percent = lowestCloud[1];
    this.cloud_cover = lowestCloud[0];
    return this;
  }

  set cloud_base_percent(percent: number) {
    this.cloud_base = percent * 10000 / 3.28084; // Max cloud height
  }

  /**
   * @see https://en.wikipedia.org/wiki/METAR
   */
  get cloud_cover_code(): string {
    if (this.cloud_cover < 1 / 8) {
      return 'CLR';
    } else if (this.cloud_cover <= 2 / 8) {
      return 'FEW';
    } else if (this.cloud_cover <= 4 / 8) {
      return 'SCT';
    } else if (this.cloud_cover <= 7 / 8) {
      return 'BKN';
    }
    return 'OVC';
  }

  get cloud_base_feet(): number {
    return this.cloud_base * 3.28084;
  }

  set visibility_percent(percent: number) {
    this.visibility = percent * 10000; // Max visibility
  }

  get visibility_sm(): number {
    return this.visibility / 1000 / 1.609344;
  }

  set wind_speed_percent(percent: number) {
    this.wind_speed = 8 * (percent + Math.pow(percent, 2));
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
