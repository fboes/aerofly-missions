import { LonLat } from "../World/LonLat.js";
import { LonLatDate } from "../World/LonLatDate.js";
import { MissionConditions } from "../Aerofly/MissionConditions.js";
export class Flightplan {
    constructor(mission, clr) {
        this.mission = mission;
        this.clr = clr;
    }
    /**
     * @param hours number
     * @returns string MINUTES:SECONDS
     */
    convertHoursToMinutesString(hours) {
        const seconds = Math.ceil(hours * 60 * 60);
        return Math.floor(seconds / 60).toFixed().padStart(2, "0") + ':' + Math.ceil(seconds % 60).toFixed().padStart(2, "0");
    }
    pad(number, maxLength = 3, fractionDigits = 0, fillString = " ") {
        return number.toLocaleString('en', {
            minimumFractionDigits: fractionDigits,
            maximumFractionDigits: fractionDigits
        }).padStart(maxLength, fillString);
    }
    padThree(number, maxLength = 3) {
        return this.pad(number, maxLength, 0, "0");
    }
    outputLine(fields) {
        return fields.join('  ') + "\n";
    }
    outputFourColumn(fields) {
        return this.outputLine(fields.map((l, i) => {
            const colorsLength = this.clr.getColorsLength(l);
            return i % 2
                ? l.padEnd(17 + colorsLength, ' ')
                : this.clr.lightGray + l.padEnd(4) + this.clr.reset;
        }));
    }
    /**
     * @see https://aviation.stackexchange.com/questions/13280/what-do-the-different-colors-of-weather-stations-indicate-on-skyvector
     */
    getConditionColored(conditions, lonLat) {
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
    getWindColored(conditions) {
        let wind_speed = conditions.wind_speed.toFixed();
        const gust_type = conditions.wind_gusts_type;
        if (gust_type) {
            wind_speed += '-' + conditions.wind_gusts.toFixed();
        }
        return this.padThree(conditions.wind_direction) + '° @ ' + wind_speed + 'KTS';
    }
    outputDashes(length, char = '-') {
        return this.clr.lightGray + char.repeat(length) + this.clr.reset + "\n";
    }
    outputSunState(sunState) {
        let sunSymbol = this.clr.lightBlue + '☼'; // Dusk / Dawn
        if (sunState.sunState === LonLatDate.SUN_STATE_DAY) {
            sunSymbol = this.clr.lightGreen + '☀';
        }
        else if (sunState.sunState === LonLatDate.SUN_STATE_NIGHT) {
            sunSymbol = this.clr.lightRed + '☾';
        }
        return sunSymbol + ' ' + sunState.sunState.toUpperCase() + ' @ ' + sunState.solarElevationAngleDeg.toFixed() + '°' + this.clr.reset;
    }
    outputDateTime(date) {
        return date.toISOString().replace(/:\d+\.\d+/, '').replace(/(T)/, this.clr.lightGray + "$1" + this.clr.reset);
    }
    toString() {
        const m = this.mission;
        const lineLength = 53;
        const total_distance = m.distance;
        const total_time_enroute = m.time_enroute;
        const time = m.conditions.time_object;
        const sunStateOrigin = new LonLatDate(m.origin_lon_lat, time).sunState;
        time.setSeconds(time.getSeconds() + total_time_enroute * 3600);
        const sunStateDestination = new LonLatDate(m.destination_lon_lat, time).sunState;
        let output = '';
        // Origin
        output += this.outputFourColumn([
            'ORIG',
            m.origin_icao,
            'DEP',
            this.outputDateTime(m.conditions.time_object),
        ]);
        output += this.outputFourColumn([
            'DSUN',
            this.outputSunState(sunStateOrigin),
            'DLST',
            sunStateOrigin.localSolarTime
        ]);
        output += this.outputDashes(lineLength);
        // Desitination
        output += this.outputFourColumn([
            'DEST',
            m.destination_icao,
            'ARR',
            this.outputDateTime(time),
        ]);
        output += this.outputFourColumn([
            'ASUN',
            this.outputSunState(sunStateDestination),
            'ALST',
            sunStateDestination.localSolarTime
        ]);
        // Weather table
        output += this.outputDashes(lineLength);
        output += this.outputFourColumn([
            'WIND',
            this.getWindColored(m.conditions),
            'CLD',
            m.conditions.cloud_cover_symbol + ' ' + m.conditions.cloud_cover_code + ' @ ' + m.conditions.cloud_base_feet.toLocaleString('en') + 'FT'
        ]);
        output += this.outputFourColumn([
            'VIS',
            m.conditions.visibility.toLocaleString('en') + 'M / ' + Math.round(m.conditions.visibility_sm) + 'SM',
            'FR',
            this.getConditionColored(m.conditions, m.origin_lon_lat)
        ]);
        output += this.outputDashes(lineLength);
        output += this.outputFourColumn([
            'ARCT',
            m.aircraft_icao,
            'TAIL',
            m.callsign
        ]);
        output += this.outputFourColumn([
            'TAS',
            this.padThree(m.cruise_speed) + 'KTS',
            'ALT',
            m.cruise_altitude_ft.toLocaleString('en') + 'FT'
        ]);
        output += this.outputDashes(lineLength, '=');
        // Waypoint table
        output += this.clr.lightGray + this.outputLine(['>   ', 'WPT   ', 'FREQ  ', '   ALT', 'DTK ', 'HDG ', ' DIS', '  ETE']) + this.clr.reset;
        m.checkpoints.forEach((c, i) => {
            let frqString = '';
            if (c.frequency) {
                frqString = c.frequency_unit === 'M' ? this.pad(c.frequency_mhz, 6, 2) : ('✺ ' + c.frequency_khz.toFixed()).padStart(6);
            }
            ;
            output += this.outputLine([
                this.clr.lightGray + this.pad(i + 1, 2, 0, "0") + ". ",
                this.clr.lightCyan + c.name.padEnd(6, " ") + this.clr.reset,
                (c.frequency) ? frqString : ' '.repeat(6),
                (c.altitude) ? this.pad(c.altitude_ft, 6, 0) : ' '.repeat(6),
                (c.direction >= 0) ? this.padThree(c.direction_magnetic) + "°" : ' '.repeat(4),
                (c.heading >= 0) ? this.padThree(c.heading_magnetic) + "°" : ' '.repeat(4),
                (c.distance >= 0) ? this.pad(c.distance, 4, 1) : ' '.repeat(4),
                (c.time_enroute > 0) ? this.convertHoursToMinutesString(c.time_enroute) : ' '.repeat(5),
            ]);
        });
        output += this.outputDashes(lineLength);
        output += this.outputLine([
            this.clr.lightGray + '>   ' + this.clr.reset, 'TOT   ', '      ', '      ', '    ', '    ',
            this.pad(total_distance, 4, 1),
            this.convertHoursToMinutesString(total_time_enroute)
        ]);
        return output;
    }
}
