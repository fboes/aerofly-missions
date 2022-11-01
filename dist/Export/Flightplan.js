export class Flightplan {
    constructor(mission) {
        this.mission = mission;
    }
    convertTimeToString(hours) {
        const minutes = Math.ceil(hours * 60);
        return Math.floor(minutes / 60).toFixed() + ':' + Math.ceil(minutes % 60).toFixed().padStart(2, "0");
    }
    pad(number, maxLength = 3, fractionDigits = 0, fillString = "0") {
        return number.toFixed(fractionDigits).padStart(maxLength, fillString);
    }
    toString() {
        const m = this.mission;
        let output = `${m.origin_icao} → ${m.destination_icao}
====================================
> WND: ${this.pad(m.conditions.wind_direction)}° @ ${this.pad(m.conditions.wind_speed)}kts
> CLD: ${m.conditions.cloud_cover_code} @ ${this.pad(m.conditions.cloud_base_feet, 5)}ft
------------------------------------
>   WPT     FREQ    TRK   DIST  TIME
`;
        let totalDistance = 0, totalTime = 0;
        m.checkpoints.forEach((c, i) => {
            output += this.pad(i + 1, 2) + ". " + c.name.padEnd(6, " ") + "  ";
            output += (c.frequency) ? this.pad(c.rawFrequency, 6, 2) : '      ';
            if (c.direction >= 0) {
                output += "  " + this.pad(c.direction) + "°";
            }
            if (c.distance > 0) {
                totalDistance += c.distance;
                totalTime += c.time;
                output += "  " + this.pad(c.distance, 4, 1);
                output += "  " + this.convertTimeToString(c.time);
            }
            output += "\n";
        });
        output += `------------------------------------
Total:                  `;
        output += "  " + this.pad(totalDistance, 4, 1);
        output += "  " + this.convertTimeToString(totalTime);
        output += "\n";
        return output;
    }
}
