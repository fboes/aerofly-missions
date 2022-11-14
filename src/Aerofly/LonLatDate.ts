import { LonLat } from "./LonLat.js";

export class LonLatDate {
  constructor(protected lonLat: LonLat, protected date: Date) {
    this.date.set
  }

  get solarTimeZoneOffset(): number {
    return Math.round(this.lonLat.lon / 180 * 12)
  }

  /**
   *@see https://stackoverflow.com/questions/8619879/javascript-calculate-the-day-of-the-year-1-366
   */
  get dayOfYear(): number {
    return (
      Date.UTC(this.date.getFullYear(), this.date.getMonth(), this.date.getDate())
      - Date.UTC(this.date.getFullYear(), 0, 0)
    ) / 24 / 60 / 60 / 1000;
  }

  /**
   * In hours
   */
  get localTime(): number {
    return (this.date.getUTCHours() + this.solarTimeZoneOffset + 24) % 24 + this.date.getUTCMinutes() / 60;
  }

  /**
   * In degrees
   */
  get localSolarTimeMeridian() : number {
    return Math.round(this.lonLat.lon / 15) * 15;
  }

  /**
   * In minutes
   */
  get equationOfTime(): number {
    const b = (2 * Math.PI / 365) * (this.dayOfYear - 81);
    return 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
  }

  /**
   * In minutes
   */
  get timeCorrectionFactor() : number {
    return 4 * (this.lonLat.lon - this.localSolarTimeMeridian) + this.equationOfTime;
  }

  /**
   * In hours
   */
  get localSolarTime(): number {
    return this.localTime + (this.timeCorrectionFactor / 60);
  }

  /**
   * In radians
   */
  get hourAngle(): number {
    return 2 / 24 * Math.PI * (this.localSolarTime - 12);
  }

  /**
   * In radians
   */
  get sunDeclination(): number {
    const delta = 23.45 * Math.sin(
      (2 * Math.PI / 365) * (this.dayOfYear - 81)
    );
    return delta / 180 * Math.PI;
  }

  /**
   * In radians
   * @see https://www.pveducation.org/pvcdrom/properties-of-sunlight/the-suns-position
   */
  get solarElevationAngle(): number {
    const delta = this.sunDeclination;
    const phi = this.lonLat.latRad;

    return Math.asin(
      Math.sin(delta) * Math.sin(phi)
      + Math.cos(delta) * Math.cos(phi) * Math.cos(this.hourAngle)
    );
  }
}
