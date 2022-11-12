import { Mission } from "../Aerofly/Mission";
import { MissionConditions } from "../Aerofly/MissionConditions.js";
import { BashColors } from "../Cli/BashColors.js";

export class Flightplan {
  constructor(protected mission: Mission, protected clr: BashColors) {
  }

  /**
   * @param hours number
   * @returns string MINUTES:SECONDS
   */
  convertHoursToMinutesString(hours: number): string {
    const seconds = Math.ceil(hours * 60 * 60);

    return Math.floor(seconds / 60).toFixed().padStart(2, "0") + ':' + Math.ceil(seconds % 60).toFixed().padStart(2, "0");
  }

  pad(number: number, maxLength: number = 3, fractionDigits: number = 0, fillString: string = " "): string {
    return number.toLocaleString('en', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits
    }).padStart(maxLength, fillString);
  }

  padThree(number: number, maxLength: number = 3): string {
    return this.pad(number, maxLength, 0, "0");
  }

  outputLine(fields: string[]): string {
    return fields.join('  ') + "\n";
  }

  outputFourColumn(fields: string[]): string {
    return this.outputLine(fields.map((l, i) => {
      const colorsLength = this.clr.getColorsLength(l);
      return i % 2
        ? l.padEnd(19 + colorsLength, ' ')
        : this.clr.lightGray + l.padEnd(4) + this.clr.reset
    }));
  }

  /**
   * @see https://aviation.stackexchange.com/questions/13280/what-do-the-different-colors-of-weather-stations-indicate-on-skyvector
   */
  getConditionColored(conditions: MissionConditions) {
    const flight_category = conditions.flight_category;
    const symbol = conditions.cloud_cover_symbol + ' ' + flight_category;
    if (!this.clr.useColors) {
      return symbol;
    }
    let color = this.clr.lightMagenta; // LIFR
    switch (flight_category) {
      case MissionConditions.CONDITION_VFR: color = this.clr.lightGreen; break;
      case MissionConditions.CONDITION_MVFR: color = this.clr.lightBlue; break;
      case MissionConditions.CONDITION_IFR: color = this.clr.lightRed; break;
    }

    return color + symbol + this.clr.reset;
  }

  outputDashes(length: number, char: string = '-') {
    return this.clr.lightGray + char.repeat(length) + this.clr.reset + "\n";
  }

  toString(): string {
    const m = this.mission;
    const lineLength = 52;

    let output = this.outputFourColumn([
      'FPLN',
      `${this.clr.lightCyan + m.origin_icao + this.clr.reset} → ${this.clr.lightCyan + m.destination_icao + this.clr.reset}`,
      'DATE',
      m.conditions.time_object.toISOString().replace(/:\d+\.\d+/, ''),
    ]);
    output += this.outputFourColumn([
      'ARCT',
      m.aircraft_icao,
      'IAS',
      this.padThree(m.cruise_speed) + 'KTS'
    ]);
    output += this.outputDashes(lineLength, '=');

    output += this.outputFourColumn([
      'WIND', `${this.padThree(m.conditions.wind_direction)}° @ ${this.padThree(m.conditions.wind_speed)}KTS`,
      'CLD', `${m.conditions.cloud_cover_symbol} ${m.conditions.cloud_cover_code} @ ${m.conditions.cloud_base_feet.toLocaleString('en')}FT`
    ]);
    output += this.outputFourColumn([
      'VISI', `${m.conditions.visibility.toLocaleString('en')}M / ${Math.round(m.conditions.visibility_sm)}SM`,
      'FR', `${this.getConditionColored(m.conditions)}`
    ]);

    output += this.outputDashes(lineLength);
    output += this.clr.lightGray + this.outputLine(['>  ', 'WPT   ', 'FREQ  ', '   ALT', 'DTK ', 'HDG ', ' DIS', '  ETE']) + this.clr.reset;

    let totalDistance = 0, totalTime = 0;
    m.checkpoints.forEach((c, i) => {
      totalDistance += c.distance;
      if (c.time > 0) { totalTime += c.time }

      let frqString = '';
      if (c.frequency) {
        frqString = c.frequency_unit === 'M' ? this.pad(c.frequency_mhz, 6, 2) : ('✺ ' + c.frequency_khz.toFixed()).padStart(6)
      };

      output += this.outputLine([
        this.clr.lightGray + this.pad(i + 1, 2, 0, "0") + ".",
        this.clr.lightCyan + c.name.padEnd(6, " ") + this.clr.reset,
        (c.frequency) ? frqString : ' '.repeat(6),
        (c.altitude) ? this.pad(c.altitude_ft, 6, 0) : ' '.repeat(6),
        (c.direction >= 0) ? this.padThree(c.direction_magnetic) + "°" : ' '.repeat(4),
        (c.heading >= 0) ? this.padThree(c.heading_magnetic) + "°" : ' '.repeat(4),
        (c.distance >= 0) ? this.pad(c.distance, 4, 1) : ' '.repeat(4),
        (c.time > 0) ? this.convertHoursToMinutesString(c.time) : ' '.repeat(5),
      ]);
    })

    output += this.outputDashes(lineLength);
    output += this.outputLine([
      this.clr.lightGray + '>  ' + this.clr.reset, 'TOT   ', '      ', '      ', '    ', '    ',
      this.pad(totalDistance, 4, 1),
      this.convertHoursToMinutesString(totalTime)
    ]);

    return output;
  }
}
