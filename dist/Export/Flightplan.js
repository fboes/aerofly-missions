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
    toString() {
        const m = this.mission;
        let output = `${m.origin_icao} → ${m.destination_icao}
==============================================
WND  ${this.padThree(m.conditions.wind_direction)}° @ ${this.padThree(m.conditions.wind_speed)}KTS
CLD  ${m.conditions.cloud_cover_code} (${Math.round(m.conditions.cloud_cover * 8)}/8) @ ${m.conditions.cloud_base_feet.toLocaleString('en')}FT
VIS  ${m.conditions.visibility.toLocaleString('en')}M / ${Math.round(m.conditions.visibility_sm)}SM
----------------------------------------------
`;
        output += this.lineOutput(['>  ', 'WPT   ', 'FREQ  ', '   ALT', 'DTK ', ' DIS', '  ETE']);
        let totalDistance = 0, totalTime = 0;
        m.checkpoints.forEach((c, i) => {
            totalDistance += c.distance;
            if (c.time > 0) {
                totalTime += c.time;
            }
            output += this.lineOutput([
                this.pad(i + 1, 2, 0, "0") + ".",
                c.name.padEnd(6, " "),
                (c.frequency) ? this.pad(c.rawFrequency, 6, 2) : ' '.repeat(6),
                (c.altitude) ? this.pad(c.altitude_ft, 6, 0) : ' '.repeat(6),
                (c.direction >= 0) ? this.padThree(c.direction) + "°" : ' '.repeat(4),
                (c.distance >= 0) ? this.pad(c.distance, 4, 1) : ' '.repeat(5),
                (c.time > 0) ? this.convertHoursToMinutesString(c.time) : ' '.repeat(5),
            ]);
        });
        output += `----------------------------------------------
>    TOT                           `;
        output += this.lineOutput([
            this.pad(totalDistance, 4, 1),
            this.convertHoursToMinutesString(totalTime)
        ]);
        return output;
    }
}