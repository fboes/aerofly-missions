import { Units } from "../World/Units.js";
import { MainMcf } from "./MainMcf.js";

type WindCorrection = {
  ground_speed: number,
  heading: number,
  heading_rad: number,
}

export class MissionConditionsCloud {
  /**
  * Percentage, 0..1
  */
  cover: number = 0.0;
  /**
   * Meters AGL
   */
  height: number = 0.0;

  constructor(cover_percent = 0, height_percent = 0) {
    this.height_percent = height_percent;
    this.cover = cover_percent;
  }

  set height_percent(percent: number) {
    this.height = percent * 10000 / Units.feetPerMeter; // Max cloud height
  }

  set cover_code(cover_code: string) {
    switch (cover_code) {
      case 'CLR': this.cover = Math.random() * 1 / 8; break;
      case 'FEW': this.cover = 1 / 8 + (Math.random() * 1 / 8); break;
      case 'SCT': this.cover = 2 / 8 + (Math.random() * 2 / 8); break;
      case 'BKN': this.cover = 4 / 8 + (Math.random() * 3 / 8); break;
      case 'OVC': this.cover = 7 / 8 + (Math.random() * 1 / 8); break;
      default: this.cover = 0; break;
    }
  }

  /**
   * @see https://en.wikipedia.org/wiki/METAR
   */
  get cover_code(): string {
    if (this.cover < 1 / 8) {
      return 'CLR';
    } else if (this.cover <= 2 / 8) {
      return 'FEW';
    } else if (this.cover <= 4 / 8) {
      return 'SCT';
    } else if (this.cover <= 7 / 8) {
      return 'BKN';
    }
    return 'OVC';
  }

  /**
   * @see https://aviation.stackexchange.com/questions/13280/what-do-the-different-colors-of-weather-stations-indicate-on-skyvector
   */
  get cover_symbol(): string {
    if (this.cover === 0) {
      return '○';
    } else if (this.cover <= 0.125) {
      return '⦶';
    } else if (this.cover <= 0.375) {
      return '◔';
    } else if (this.cover <= 0.625) {
      return '◑';
    } else if (this.cover <= 0.875) {
      return '◕';
    }
    return '●';
  }

  set height_feet(height_feet: number) {
    this.height = height_feet / Units.feetPerMeter;
  }

  get height_feet(): number {
    return this.height * Units.feetPerMeter;
  }
}

export class MissionConditionsTime {
  dateTime: Date;

  constructor() {
    this.dateTime = new Date()
    this.dateTime.setUTCSeconds(0);
    this.dateTime.setUTCMilliseconds(0);
  }

  get time_year(): number {
    return this.dateTime.getUTCFullYear();
  }

  set time_year(time_year: number) {
    this.dateTime.setUTCFullYear(time_year);
  }

  get time_month(): number {
    return this.dateTime.getUTCMonth() + 1;
  }

  set time_month(time_month: number) {
    this.dateTime.setUTCMonth(time_month - 1);
  }

  get time_day(): number {
    return this.dateTime.getUTCDate();
  }

  set time_day(time_day: number) {
    this.dateTime.setUTCDate(time_day);
  }

  get time_hours(): number {
    return this.dateTime.getUTCHours() + this.dateTime.getUTCMinutes() / 60;
  }

  set time_hours(time_hours: number) {
    this.dateTime.setUTCHours(Math.ceil(time_hours));
    this.dateTime.setUTCMinutes((time_hours % 1)) * 60;
  }
}


export class MissionConditions {
  time = new MissionConditionsTime();

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

  clouds: MissionConditionsCloud[] = [new MissionConditionsCloud()];

  static CONDITION_VFR = 'VFR';
  static CONDITION_MVFR = 'MVFR';
  static CONDITION_IFR = 'IFR';
  static CONDITION_LIFR = 'LIFR';
  static WIND_GUSTS_STANDARD = 'gusts';
  static WIND_GUSTS_STRONG = 'strong gusts';
  static WIND_GUSTS_VIOLENT = 'violent gusts';

  /**
   * @see MissionConditionsCloud.cover
   */
  get cloud(): MissionConditionsCloud {
    if (this.clouds[0]) {
      this.clouds.push(new MissionConditionsCloud());
    }
    return this.clouds[0]
  }

  set visibility_percent(percent: number) {
    this.visibility = Math.round(percent * 15000); // Max visibility
  }

  get visibility_sm(): number {
    return (this.visibility === 15000) ? 10 : this.visibility / Units.meterPerStatuteMile;
  }

  set wind_speed_percent(percent: number) {
    this.wind_speed = 8 * (percent + Math.pow(percent, 2));
  }

  get wind_direction_rad(): number {
    return (this.wind_direction % 360) / 180 * Math.PI;
  }

  get wind_gusts_type(): string {
    const delta = this.wind_gusts - this.wind_speed;

    if (delta > 25) {
      return MissionConditions.WIND_GUSTS_VIOLENT;
    } else if (delta > 15) {
      return MissionConditions.WIND_GUSTS_STRONG;
    } else if (delta > 10) {
      return MissionConditions.WIND_GUSTS_STANDARD;
    }

    return '';
  }

  fromMainMcf(mainMcf: MainMcf): MissionConditions {
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
  getFlightCategory(useIcao = false): string {
    let cloud_base_feet = 9999;
    this.clouds.forEach(cloud => {
      if (cloud.cover > 0.5) {
        cloud_base_feet = Math.min(cloud_base_feet, cloud.height_feet)
      }
    })

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

  makeTurbulence() {
    this.turbulence_strength = Math.min(1, this.wind_speed / 80 + this.wind_gusts / 20);
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
                    <[float64][cloud_cover][${this.cloud.cover}]>
                    <[float64][cloud_base][${this.cloud.height}]> // meters AGL
                >
`;
  }
}
