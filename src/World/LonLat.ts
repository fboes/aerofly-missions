import { Units } from "./Units.js";

type LonLatMinute = {
  degree: number;
  minutes: number;
  minutesDecimal: number;
  seconds: number;
  secondsDecimal: number;
};

export class LonLat {
  /**
   * In degrees, -180..180. Positive for East, negative for West
   */
  lon: number;
  /**
   * In degrees, -90..90. Positive for North, negative for South
   */
  lat: number;

  // In Nautical Miles
  static EARTH_MEAN_RADIUS = 3441.037;

  /**
   * Magnetic declination at this coordinate in degrees. "+" is to the East, "-" is to the West
   * @see https://en.wikipedia.org/wiki/Magnetic_declination
   */
  magnetic_declination: number = 0;

  constructor(lon: number, lat: number, public altitude_m = 0) {
    this.lon = lon % 360;
    if (lon > 180) {
      this.lon -= 360;
    }
    this.lat = lat;
  }

  get lonRad(): number {
    return (this.lon / 180) * Math.PI;
  }

  get latRad(): number {
    return (this.lat / 180) * Math.PI;
  }

  protected convertMinute(lonOrLat: number): LonLatMinute {
    let l = {
      degree: lonOrLat > 0 ? Math.floor(lonOrLat) : Math.ceil(lonOrLat),
      minutes: 0,
      minutesDecimal: (Math.abs(lonOrLat) % 1) * 60,
      seconds: 0,
      secondsDecimal: 0,
    };
    l.secondsDecimal = (l.minutesDecimal % 1) * 60;
    l.seconds = Math.floor(l.secondsDecimal);
    l.minutes = Math.floor(l.minutesDecimal);
    return l;
  }

  get lonMinute(): LonLatMinute {
    return this.convertMinute(this.lon);
  }

  get latMinute(): LonLatMinute {
    return this.convertMinute(this.lat);
  }

  /**
   * Returns E or W
   */
  get lonHemisphere(): "E" | "W" {
    return this.lon > 0 ? "E" : "W";
  }

  /**
   * Returns N or S
   */
  get latHemisphere(): "N" | "S" {
    return this.lat > 0 ? "N" : "S";
  }

  get altitude_ft(): number {
    return this.altitude_m * Units.feetPerMeter;
  }

  set altitude_ft(altitude_ft: number) {
    this.altitude_m = altitude_ft / Units.feetPerMeter;
  }

  toNavString(): string {
    // 360351N1151159W
    const lat = this.latMinute;
    const lon = this.lonMinute;

    return (
      Math.abs(lat.degree).toFixed().padStart(2, "0") +
      lat.minutes.toFixed().padStart(2, "0") +
      lat.seconds.toFixed().padStart(2, "0") +
      this.latHemisphere +
      Math.abs(lon.degree).toFixed().padStart(3, "0") +
      lon.minutes.toFixed().padStart(2, "0") +
      lon.seconds.toFixed().padStart(2, "0") +
      this.lonHemisphere
    );
  }

  toString(): string {
    return this.lon.toFixed(6) + " " + this.lat.toFixed(6);
  }

  /**
   * @returns a true bearing between coordinates in degrees
   */
  getBearingTo(lonLat: LonLat): number {
    const lat1 = this.latRad;
    const lon1 = this.lonRad;
    const lat2 = lonLat.latRad;
    const lon2 = lonLat.lonRad;

    const dLon = lon2 - lon1;

    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

    return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  }

  /**
   *
   * @param lonLat
   * @returns number in Nautical miles
   */
  getDistanceTo(lonLat: LonLat): number {
    const dLat = lonLat.latRad - this.latRad;
    const dLon = lonLat.lonRad - this.lonRad;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(this.latRad) * Math.cos(lonLat.latRad);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const averageAltInNm = (lonLat.altitude_m + this.altitude_m) / (2 * Units.meterPerNauticalMile);

    // multiply with earth's mean radius in Nautical Miles
    return (LonLat.EARTH_MEAN_RADIUS + averageAltInNm) * c;
  }

  /**
   *
   * @param d       number in nautical miles
   * @param bearing number in degree
   * @returns LonLat
   */
  getRelativeCoordinates(distance: number, bearing: number): LonLat {
    const d = distance;
    const brng = (((bearing + 360) % 360) / 180) * Math.PI;
    const lat1 = this.latRad;
    const lon1 = this.lonRad;
    const R = LonLat.EARTH_MEAN_RADIUS;

    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d / R) + Math.cos(lat1) * Math.sin(d / R) * Math.cos(brng));
    const lon2 =
      lon1 +
      Math.atan2(Math.sin(brng) * Math.sin(d / R) * Math.cos(lat1), Math.cos(d / R) - Math.sin(lat1) * Math.sin(lat2));

    return new LonLat((lon2 * 180) / Math.PI, (lat2 * 180) / Math.PI, this.altitude_m);
  }

  /**
   * @see https://www.aerofly.com/community/forum/index.php?thread/19105-custom-missions-converting-coordinates/
   */
  static fromMainMcf(coordinates: number[], altitude_m: number = 0): LonLat {
    const f = 1.0 / 298.257223563; // WGS84
    const e2 = 2 * f - f * f;

    //const lambda = VectorToAngle( coordinates[0], coordinates[1] );
    let lambda = 0;
    if (coordinates[0] > 0) {
      if (coordinates[1] < 0) {
        lambda = 2 * Math.PI + Math.atan(coordinates[1] / coordinates[0]);
      } else {
        lambda = Math.atan(coordinates[1] / coordinates[0]);
      }
    } else if (coordinates[0] < 0) {
      lambda = Math.PI + Math.atan(coordinates[1] / coordinates[0]);
    } else if (coordinates[1] > 0) {
      lambda = 0.5 * Math.PI;
    } else {
      lambda = 1.5 * Math.PI;
    }

    const rho = Math.sqrt(coordinates[0] * coordinates[0] + coordinates[1] * coordinates[1]);

    const phi = Math.atan(coordinates[2] / ((1.0 - e2) * rho));
    return new LonLat((lambda * 180) / Math.PI, (phi * 180) / Math.PI, altitude_m);
  }

  clone(): LonLat {
    const l = new LonLat(this.lon, this.lat, this.altitude_m);
    l.magnetic_declination = this.magnetic_declination;
    return l;
  }
}

export class LonLatArea {
  protected coordinates: LonLat[] = [];
  min: LonLat;
  max: LonLat;

  constructor(lonLat: LonLat) {
    this.min = new LonLat(lonLat.lon, lonLat.lat);
    this.max = new LonLat(lonLat.lon, lonLat.lat);
  }

  push(lonLat: LonLat) {
    this.min.lon = Math.min(this.min.lon, lonLat.lon);
    this.min.lat = Math.min(this.min.lat, lonLat.lat);
    this.max.lon = Math.max(this.max.lon, lonLat.lon);
    this.max.lat = Math.max(this.max.lat, lonLat.lat);
  }

  get maxDistance(): number {
    return this.min.getDistanceTo(this.max);
  }

  get center(): LonLat {
    return new LonLat((this.min.lon + this.max.lon) / 2, (this.min.lat + this.max.lat) / 2);
  }

  get lonRange(): number {
    return this.max.lon - this.min.lon;
  }

  get latRange(): number {
    return this.max.lat - this.min.lat;
  }

  /**
   * @param aspectRatio to fit lonRange & latRange into
   * @returns a lon/latRange to fit into
   */
  getMaxRange(aspectRatio = 2 / 1): number {
    let x = this.lonRange,
      y = this.latRange;
    const rangeAspectRatio = x / y; // 0.5
    if (aspectRatio > rangeAspectRatio) {
      x *= aspectRatio / rangeAspectRatio;
    } else {
      y *= rangeAspectRatio / aspectRatio;
    }

    return Math.max(x, y); // 0..360
  }

  getZoomLevel(aspectRatio = 2 / 1, factor = 1, fraction = false): number {
    let zoom = 3 + Math.pow(360 / this.getMaxRange(aspectRatio), 0.3) * factor;

    return fraction ? zoom : Math.ceil(zoom);
  }
}
