import { MissionConditions } from "../Aerofly/MissionConditions.js";
export class Flightplan {
    constructor(mission) {
        this.mission = mission;
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
    lineOutput(fields) {
        return fields.join('  ') + "\n";
    }
    weatherLineOutput(fields, clr) {
        return this.lineOutput(fields.map((l, i) => {
            return i % 2
                ? l.padEnd(17)
                : clr.lightGray + l.padEnd(3) + clr.reset;
        }));
    }
    /**
     * @see https://aviation.stackexchange.com/questions/13280/what-do-the-different-colors-of-weather-stations-indicate-on-skyvector
     */
    getConditionColored(conditions, clr) {
        const flight_category = conditions.flight_category;
        const symbol = conditions.cloud_cover_symbol + ' ' + flight_category;
        if (!clr.useColors) {
            return symbol;
        }
        let color = clr.lightMagenta; // LIFR
        switch (flight_category) {
            case MissionConditions.CONDITION_VFR:
                color = clr.lightGreen;
                break;
            case MissionConditions.CONDITION_MVFR:
                color = clr.lightBlue;
                break;
            case MissionConditions.CONDITION_IFR:
                color = clr.lightRed;
                break;
        }
        return color + symbol + clr.reset;
    }
    toString(clr) {
        const m = this.mission;
        let output = `${clr.lightCyan + m.origin_icao + clr.reset} → ${clr.lightCyan + m.destination_icao + clr.reset}
${clr.lightGray}====================================================${clr.reset}` + "\n";
        output += this.weatherLineOutput([
            'WND', `${this.padThree(m.conditions.wind_direction)}° @ ${this.padThree(m.conditions.wind_speed)}KTS`,
            'CLD', `${m.conditions.cloud_cover_symbol} ${m.conditions.cloud_cover_code} @ ${m.conditions.cloud_base_feet.toLocaleString('en')}FT`
        ], clr);
        output += this.weatherLineOutput([
            'VIS', `${m.conditions.visibility.toLocaleString('en')}M / ${Math.round(m.conditions.visibility_sm)}SM`,
            'FCT', `${this.getConditionColored(m.conditions, clr)}`
        ], clr);
        output += `${clr.lightGray}----------------------------------------------------${clr.reset}` + "\n";
        output += clr.lightGray + this.lineOutput(['>  ', 'WPT   ', 'FREQ  ', '   ALT', 'DTK ', 'HDG ', ' DIS', '  ETE']) + clr.reset;
        let totalDistance = 0, totalTime = 0;
        m.checkpoints.forEach((c, i) => {
            totalDistance += c.distance;
            if (c.time > 0) {
                totalTime += c.time;
            }
            let frqString = '';
            if (c.frequency) {
                frqString = c.frequency_unit === 'M' ? this.pad(c.frequency_mhz, 6, 2) : (this.pad(c.frequency_khz, 4) + ' ♢');
            }
            ;
            output += this.lineOutput([
                clr.lightGray + this.pad(i + 1, 2, 0, "0") + ".",
                clr.lightCyan + c.name.padEnd(6, " ") + clr.reset,
                (c.frequency) ? frqString : ' '.repeat(6),
                (c.altitude) ? this.pad(c.altitude_ft, 6, 0) : ' '.repeat(6),
                (c.direction >= 0) ? this.padThree(c.direction) + "°" : ' '.repeat(4),
                (c.heading >= 0) ? this.padThree(c.heading) + "°" : ' '.repeat(4),
                (c.distance >= 0) ? this.pad(c.distance, 4, 1) : ' '.repeat(4),
                //(c.ground_speed >= 0) ? this.pad(c.ground_speed) : ' '.repeat(3),
                (c.time > 0) ? this.convertHoursToMinutesString(c.time) : ' '.repeat(5),
            ]);
        });
        output += `${clr.lightGray}----------------------------------------------------${clr.reset}` + "\n";
        output += this.lineOutput([
            clr.lightGray + '>  ' + clr.reset, 'TOT   ', '      ', '      ', '    ', '    ',
            this.pad(totalDistance, 4, 1),
            this.convertHoursToMinutesString(totalTime)
        ]);
        return output;
    }
}
