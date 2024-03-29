import { LonLat } from "./LonLat.js";

export type LonLateDateSunState = {
  solarElevationAngleDeg: number;
  localSolarTime: string;
  localTime: string;
  sunState: string;
};

export class LonLatDate {
  static SUN_STATE_DAY = "Day";
  static SUN_STATE_NIGHT = "Night";
  static SUN_STATE_DUSK = "Dusk";
  static SUN_STATE_DAWN = "Dawn";

  constructor(public lonLat: LonLat, public date: Date) {}

  get solarTimeZoneOffset(): number {
    return Math.round((this.lonLat.lon / 180) * 12);
  }

  /**
   *@see https://stackoverflow.com/questions/8619879/javascript-calculate-the-day-of-the-year-1-366
   */
  get dayOfYear(): number {
    return (
      (Date.UTC(this.date.getFullYear(), this.date.getMonth(), this.date.getDate()) -
        Date.UTC(this.date.getFullYear(), 0, 0)) /
      24 /
      60 /
      60 /
      1000
    );
  }

  /**
   * In hours
   */
  get localTime(): number {
    return ((this.date.getUTCHours() + this.solarTimeZoneOffset + 24) % 24) + this.date.getUTCMinutes() / 60;
  }

  /**
   * In degrees
   */
  get localSolarTimeMeridian(): number {
    return Math.round(this.lonLat.lon / 15) * 15;
  }

  /**
   * In minutes
   */
  get equationOfTime(): number {
    const b = ((2 * Math.PI) / 365) * (this.dayOfYear - 81);
    return 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
  }

  /**
   * In minutes
   */
  get timeCorrectionFactor(): number {
    return 4 * (this.lonLat.lon - this.localSolarTimeMeridian) + this.equationOfTime;
  }

  /**
   * In hours
   */
  get localSolarTime(): number {
    return (this.localTime + this.timeCorrectionFactor / 60 + 24) % 24;
  }

  /**
   * In radians
   */
  get hourAngle(): number {
    return (2 / 24) * Math.PI * (this.localSolarTime - 12);
  }

  /**
   * In radians
   */
  get sunDeclination(): number {
    const delta = 23.45 * Math.sin(((2 * Math.PI) / 365) * (this.dayOfYear - 81));
    return (delta / 180) * Math.PI;
  }

  /**
   * In radians
   * @see https://www.pveducation.org/pvcdrom/properties-of-sunlight/the-suns-position
   */
  get solarElevationAngle(): number {
    const delta = this.sunDeclination;
    const phi = this.lonLat.latRad;

    return Math.asin(Math.sin(delta) * Math.sin(phi) + Math.cos(delta) * Math.cos(phi) * Math.cos(this.hourAngle));
  }

  /**
   * Returns at least `sunState` for civil twilight
   */
  get sunState(): LonLateDateSunState {
    const solarElevationAngleDeg = (this.solarElevationAngle / Math.PI) * 180;
    const localSolarTime = this.localSolarTime;
    const localTime = this.localTime;
    let sunState = "";
    if (solarElevationAngleDeg >= 0) {
      sunState = LonLatDate.SUN_STATE_DAY;
    } else if (solarElevationAngleDeg <= -6) {
      sunState = LonLatDate.SUN_STATE_NIGHT;
    } else {
      sunState = this.localSolarTime < 12 ? LonLatDate.SUN_STATE_DUSK : LonLatDate.SUN_STATE_DAWN;
    }

    return {
      solarElevationAngleDeg,
      localSolarTime:
        Math.floor(localSolarTime).toFixed().padStart(2, "0") +
        ":" +
        Math.floor((localSolarTime % 1) * 60)
          .toFixed()
          .padStart(2, "0"),
      localTime:
        Math.floor(localTime).toFixed().padStart(2, "0") +
        ":" +
        Math.floor((localTime % 1) * 60)
          .toFixed()
          .padStart(2, "0"),
      sunState,
    };
  }
}
