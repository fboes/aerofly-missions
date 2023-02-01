import { Mission } from "../Aerofly/Mission.js";
import { MissionCheckpoint } from "../Aerofly/MissionCheckpoint.js";
import { MissionConditions } from "../Aerofly/MissionConditions.js";
import { LonLatDate, LonLateDateSunState } from "../World/LonLatDate.js";

export class Outputtable {
  /**
   * @param hours number
   * @returns string MINUTES:SECONDS
   */
  static convertHoursToMinutesString(hours: number): string {
    const seconds = Math.ceil(hours * 60 * 60);

    return Math.floor(seconds / 60).toFixed().padStart(2, "0") + ':' + Math.ceil(seconds % 60).toFixed().padStart(2, "0");
  }

  static pad(number: number, maxLength: number = 3, fractionDigits: number = 0, fillString: string = " "): string {
    return number.toLocaleString('en', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits
    }).padStart(maxLength, fillString);
  }

  static padThree(number: number, maxLength: number = 3): string {
    return Outputtable.pad(number, maxLength, 0, "0");
  }

  // ---------------------------------------------------------------------------

  outputLine(fields: string[]): string {
    return fields.join('  ') + "\n";
  }

  outputDateTime(date: Date) {
    return date.toISOString().replace(/:\d+\.\d+/, '');
  }

  outputSunState(sunState: LonLateDateSunState): string {
    let sunSymbol = '☼'; // Dusk / Dawn
    if (sunState.sunState === LonLatDate.SUN_STATE_DAY) {
      sunSymbol = '☀';
    } else if (sunState.sunState === LonLatDate.SUN_STATE_NIGHT) {
      sunSymbol = '☾';
    }
    return sunSymbol + ' ' + sunState.sunState + ' @ ' + sunState.solarElevationAngleDeg.toFixed() + '°';
  }


  outputCodes(m: Mission, join = ' '): string {
    const lastIndex = m.checkpoints.length - 1;
    return m.checkpoints.map((cp) => {
      const type = cp.type_extended;
      return (cp.isExportable())
        ? cp.name
        : cp.lon_lat.toNavString()
    }).join(join);
  }

  getWind(conditions: MissionConditions): string {
    let wind_speed = conditions.wind_speed.toFixed();
    const gust_type = conditions.wind_gusts_type;
    if (gust_type) {
      wind_speed += 'G' + conditions.wind_gusts.toFixed();
    }
    return Outputtable.padThree(conditions.wind_direction) + '° @ ' + wind_speed;
  }
}
