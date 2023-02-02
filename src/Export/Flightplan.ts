import { LonLat } from "../World/LonLat.js";
import { LonLatDate, LonLateDateSunState } from "../World/LonLatDate.js";
import { Mission } from "../Aerofly/Mission.js";
import { MissionConditions } from "../Aerofly/MissionConditions.js";
import { BashColors } from "../Cli/BashColors.js";
import { Outputtable } from "./Outputtable.js";

export class Flightplan extends Outputtable {
  constructor(protected mission: Mission, protected clr: BashColors) {
    super();
  }

  outputFourColumn(fields: string[]): string {
    return this.outputLine(
      fields.map((l, i) => {
        const colorsLength = this.clr.getColorsLength(l);
        return i % 2 ? l.padEnd(17 + colorsLength, " ") : this.clr.lightGray + l.padEnd(4) + this.clr.reset;
      })
    );
  }

  /**
   * @see https://aviation.stackexchange.com/questions/13280/what-do-the-different-colors-of-weather-stations-indicate-on-skyvector
   */
  getConditionColored(conditions: MissionConditions, lonLat: LonLat) {
    const flight_category = conditions.getFlightCategory(lonLat.continent !== LonLat.CONTINENT_NORTH_AMERICA);
    if (!this.clr.useColors) {
      return flight_category;
    }
    let color = this.clr.lightRed; // IFR
    switch (flight_category) {
      case MissionConditions.CONDITION_VFR:
        color = this.clr.lightGreen;
        break;
      case MissionConditions.CONDITION_MVFR:
        color = this.clr.lightBlue;
        break;
      case MissionConditions.CONDITION_LIFR:
        color = this.clr.lightMagenta;
        break;
    }

    return color + flight_category + this.clr.reset;
  }

  getWind(conditions: MissionConditions): string {
    return super.getWind(conditions).replace(/(G)/, this.clr.lightGray + "$1" + this.clr.reset) + "KTS";
  }

  outputDashes(length: number, char: string = "-") {
    return this.clr.lightGray + char.repeat(length) + this.clr.reset + "\n";
  }

  outputSunState(sunState: LonLateDateSunState): string {
    let sunColor = this.clr.lightBlue; // Dusk / Dawn
    if (sunState.sunState === LonLatDate.SUN_STATE_DAY) {
      sunColor = this.clr.lightGreen;
    } else if (sunState.sunState === LonLatDate.SUN_STATE_NIGHT) {
      sunColor = this.clr.lightRed;
    }
    return sunColor + super.outputSunState(sunState).toUpperCase() + this.clr.reset;
  }

  outputDateTime(date: Date) {
    return super.outputDateTime(date).replace(/(T)/, this.clr.lightGray + "$1" + this.clr.reset);
  }

  toString(): string {
    const m = this.mission;
    const lineLength = 55;
    const total_distance = m.distance;
    const total_time_enroute = m.time_enroute;
    const time = new Date(m.conditions.time.dateTime);
    const sunStateOrigin = new LonLatDate(m.origin_lon_lat, time).sunState;
    time.setSeconds(time.getSeconds() + total_time_enroute * 3600);
    const sunStateDestination = new LonLatDate(m.destination_lon_lat, time).sunState;
    let output = "";

    // Origin
    output += this.outputFourColumn([
      "ORIG",
      m.origin_icao,
      "DEP", // Departure date & time
      this.outputDateTime(m.conditions.time.dateTime),
    ]);
    output += this.outputFourColumn([
      "DSUN",
      this.outputSunState(sunStateOrigin),
      "DLST", // Local Solar Time
      sunStateOrigin.localSolarTime,
    ]);

    output += this.outputDashes(lineLength);

    // Desitination
    output += this.outputFourColumn([
      "DEST",
      m.destination_icao,
      "ARR", // Arrival date & time
      this.outputDateTime(time),
    ]);
    output += this.outputFourColumn([
      "ASUN",
      this.outputSunState(sunStateDestination),
      "ALST", // Local Solar Time
      sunStateDestination.localSolarTime,
    ]);

    // Weather table
    output += this.outputDashes(lineLength);
    output += this.outputFourColumn([
      "WIND", // Wind
      this.getWind(m.conditions),
      "CLD", // Clouds
      m.conditions.cloud.cover_symbol +
        " " +
        m.conditions.cloud.cover_code +
        " @ " +
        m.conditions.cloud.height_feet.toLocaleString("en") +
        "FT",
    ]);
    output += this.outputFourColumn([
      "VIS", // Visbility
      m.conditions.visibility.toLocaleString("en") + "M / " + Math.round(m.conditions.visibility_sm) + "SM",
      "FR", // Flight rules
      this.getConditionColored(m.conditions, m.origin_lon_lat),
    ]);
    output += this.outputDashes(lineLength);

    output += this.outputFourColumn([
      "ARCT", // Aircraft type
      m.aircraft_icao,
      "TAIL",
      m.callsign,
    ]);
    output += this.outputFourColumn([
      "TAS", // True Air Speed
      Outputtable.padThree(m.cruise_speed) + "KTS",
      "ALT",
      m.cruise_altitude_ft.toLocaleString("en") + "FT",
    ]);

    if (m.checkpoints.length) {
      output += this.outputDashes(lineLength, "=");

      // Waypoint table
      output +=
        this.clr.lightGray +
        this.outputLine([">   ", "WPT   ", "FREQ  ", "   ALT", "DTK ", "HDG ", "  DIS", "   ETE"]) +
        this.clr.reset;

      m.checkpoints.forEach((c, i) => {
        let frqString = "";
        if (c.frequency) {
          frqString =
            c.frequency_unit === "M"
              ? Outputtable.pad(c.frequency_mhz, 6, 2)
              : ("✺ " + c.frequency_khz.toFixed()).padStart(6);
        }

        output += this.outputLine([
          this.clr.lightGray + Outputtable.pad(i + 1, 2, 0, "0") + ". " + this.clr.reset,
          this.clr.lightCyan + c.name.padEnd(6, " ") + this.clr.reset,
          c.frequency ? frqString : " ".repeat(6),
          c.lon_lat.altitude_m ? Outputtable.pad(c.lon_lat.altitude_ft, 6, 0) : " ".repeat(6),
          c.direction >= 0 ? Outputtable.padThree(c.direction_magnetic) + "°" : " ".repeat(4),
          c.heading >= 0 ? Outputtable.padThree(c.heading_magnetic) + "°" : " ".repeat(4),
          c.distance >= 0 ? Outputtable.pad(c.distance, 5, 1) : " ".repeat(5),
          c.time_enroute > 0 ? Outputtable.convertHoursToMinutesString(c.time_enroute).padStart(6) : " ".repeat(6),
        ]);
      });
      output += this.outputDashes(lineLength);
      output += this.outputLine([
        this.clr.lightGray + ">   " + this.clr.reset,
        "TOT   ",
        "      ",
        "      ",
        "    ",
        "    ",
        Outputtable.pad(total_distance, 5, 1),
        Outputtable.convertHoursToMinutesString(total_time_enroute).padStart(6),
      ]);
    }

    return output;
  }
}
