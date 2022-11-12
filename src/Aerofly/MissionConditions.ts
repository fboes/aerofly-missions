import { MainMcf } from "./MainMcf.js";

type WindCorrection = {
  ground_speed: number,
  heading: number,
  heading_rad: number,
}

export class MissionConditions {
  time = {
    time_year: 2022,
    time_month: 1,
    time_day: 1,
    time_hours: 20,
  };
  /**
   * True direction wind is coming from in Degrees
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

  static CONDITION_VFR = 'VFR';
  static CONDITION_MVFR = 'MVFR';
  static CONDITION_IFR = 'IFR';
  static CONDITION_LIFR = 'LIFR';

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

  /**
   * @see https://aviation.stackexchange.com/questions/13280/what-do-the-different-colors-of-weather-stations-indicate-on-skyvector
   */
  get cloud_cover_symbol(): string {
    if (this.cloud_cover === 0) {
      return '○';
    } else if (this.cloud_cover <= 0.125) {
      return '⦶';
    } else if (this.cloud_cover <= 0.375) {
      return '◔';
    } else if (this.cloud_cover <= 0.625) {
      return '◑';
    } else if (this.cloud_cover <= 0.875) {
      return '◕';
    }
    return '●';
  }

  get cloud_base_feet(): number {
    return this.cloud_base * 3.28084;
  }

  set visibility_percent(percent: number) {
    this.visibility = percent * 10000; // Max visibility
  }

  get visibility_sm(): number {
    return (this.visibility === 10000) ? 10 : this.visibility / 1000 / 1.609344;
  }

  set wind_speed_percent(percent: number) {
    this.wind_speed = 8 * (percent + Math.pow(percent, 2));
  }

  get wind_direction_rad(): number {
    return (this.wind_direction % 360) / 180 * Math.PI;
  }

  /**
   * @see https://www.thinkaviation.net/levels-of-vfr-ifr-explained/
   * @see https://en.wikipedia.org/wiki/Ceiling_(cloud)
   */
  get flight_category(): string {
    const visibility_sm = this.visibility_sm;
    const cloud_base_feet = this.cloud_cover > 0.5 ? this.cloud_base_feet : 9999;

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

  get time_object(): Date {
    return new Date(
      Date.UTC(
        this.time.time_year,
        this.time.time_month - 1,
        this.time.time_day,
        Math.floor(this.time.time_hours),
        Math.floor(this.time.time_hours % 1 * 60),
        Math.floor(this.time.time_hours % 1 * 60 % 1 * 60),
      )
    );
  }

  /**
   * @see https://e6bx.com/e6b
   *
   * @param course_rad in radians
   * @param tas_kts in knots
   * @returns ground speed in knots, true heading
   */
  getWindCorrection(course_rad: number, tas_kts: number): WindCorrection {
    const deltaRad = this.wind_direction_rad - course_rad;
    const correctionRad = (deltaRad === 0 || deltaRad === Math.PI)
      ? 0
      : Math.asin(this.wind_speed * Math.sin(deltaRad) / tas_kts)
      ;
    const heading_rad = correctionRad + course_rad;
    let ground_speed = tas_kts - Math.cos(deltaRad) * this.wind_speed;

    if (deltaRad === 0) {
      ground_speed = tas_kts - this.wind_speed;
    } else if (deltaRad === Math.PI) {
      ground_speed = tas_kts + this.wind_speed;
    } else {
      ground_speed = Math.sin(deltaRad - correctionRad) * tas_kts / Math.sin(deltaRad);
    }

    return {
      ground_speed,
      heading_rad,
      heading: (heading_rad * 180 / Math.PI) % 360
    }
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
                    // <[string8u][flight_category][${this.flight_category}]>
                >
`;
  }
}
