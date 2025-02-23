import { LonLatDate } from "../World/LonLatDate.js";
export class Outputtable {
    /**
     * @param hours number
     * @returns string HOURS:MINUTES:SECONDS
     */
    static convertHoursToMinutesString(hours) {
        const hoursFloor = Math.floor(hours);
        const seconds = Math.ceil((hours - hoursFloor) * 60 * 60);
        return (Math.floor(hoursFloor).toFixed() +
            ":" +
            Math.floor(seconds / 60)
                .toFixed()
                .padStart(2, "0") +
            ":" +
            Math.ceil(seconds % 60)
                .toFixed()
                .padStart(2, "0"));
    }
    static pad(number, maxLength = 3, fractionDigits = 0, fillString = " ") {
        return number
            .toLocaleString("en", {
            minimumFractionDigits: fractionDigits,
            maximumFractionDigits: fractionDigits,
        })
            .padStart(maxLength, fillString);
    }
    static padThree(number, maxLength = 3) {
        return Outputtable.pad(number, maxLength, 0, "0");
    }
    // ---------------------------------------------------------------------------
    outputLine(fields) {
        return fields.join("  ") + "\n";
    }
    outputDateTime(date) {
        return date.toISOString().replace(/:\d+\.\d+/, "");
    }
    outputSunState(sunState) {
        let sunSymbol = "☼"; // Dusk / Dawn
        if (sunState.sunState === LonLatDate.SUN_STATE_DAY) {
            sunSymbol = "☀";
        }
        else if (sunState.sunState === LonLatDate.SUN_STATE_NIGHT) {
            sunSymbol = "☾";
        }
        return sunSymbol + " " + sunState.sunState + " @ " + sunState.solarElevationAngleDeg.toFixed() + "°";
    }
    outputCodes(m, join = " ") {
        return m.checkpoints
            .map((cp) => {
            return cp.isExportable() ? cp.name : cp.lon_lat.toNavString();
        })
            .join(join);
    }
    getWind(conditions) {
        let wind_speed = conditions.wind_speed.toFixed();
        const gust_type = conditions.wind_gusts_type;
        if (gust_type) {
            wind_speed += "G" + conditions.wind_gusts.toFixed();
        }
        return Outputtable.padThree(conditions.wind_direction) + "° @ " + wind_speed;
    }
}
