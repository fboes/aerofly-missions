import { LonLat } from "../World/LonLat.js";
import { LonLatDate } from "../World/LonLatDate.js";
import { Outputtable } from "./Outputtable.js";
import { SkyVector } from "./SkyVector.js";
export class Markdown extends Outputtable {
    constructor(mission) {
        super();
        this.mission = mission;
    }
    outputLine(fields) {
        return '| ' + fields.join(' | ') + " |\n";
    }
    toString() {
        const m = this.mission;
        const s = new SkyVector(m);
        const total_distance = m.distance;
        const total_time_enroute = m.time_enroute;
        const time = m.conditions.time_object;
        const sunStateOrigin = new LonLatDate(m.origin_lon_lat, time).sunState;
        time.setSeconds(time.getSeconds() + total_time_enroute * 3600);
        const sunStateDestination = new LonLatDate(m.destination_lon_lat, time).sunState;
        let markdown = `${m.title}
==================

${m.description}

Flight briefing
---------------

Check your [Sky Vector Flight Plan](${s.toString()}). You may also want to take a look at [Google Maps](https://www.google.com/maps/@?api=1&map_action=map&center=${m.origin_lon_lat.lat},${m.origin_lon_lat.lon}&zoom=12&basemap=terrain).

### Weather

| Wind | Clouds | Visibility | Flight rules |
|------|--------|------------|--------------|
| ${this.getWind(m.conditions)} kts | ${m.conditions.cloud_cover_symbol + ' ' + m.conditions.cloud_cover_code + ' @ ' + m.conditions.cloud_base_feet.toLocaleString('en') + ' ft'} | ${m.conditions.visibility.toLocaleString('en') + ' m / ' + Math.round(m.conditions.visibility_sm)} SM | ${m.conditions.getFlightCategory(m.origin_lon_lat.continent !== LonLat.CONTINENT_NORTH_AMERICA)} |

### Airports

|             | Location | Date & time | Local solar time | Sun |
|-------------|----------|-------------|------------------|-----|
| Origin      | [${m.origin_icao}](https://skyvector.com/airport/${m.origin_icao}) | ${this.outputDateTime(m.conditions.time_object)} | ${sunStateOrigin.localSolarTime} | ${this.outputSunState(sunStateOrigin)} |
| Destination | [${m.destination_icao}](https://skyvector.com/airport/${m.destination_icao}) | ${this.outputDateTime(time)} | ${sunStateDestination.localSolarTime} | ${this.outputSunState(sunStateDestination)} |

### Checkpoints

`;
        markdown += this.outputLine(['  ', 'Waypoint', 'Frequency', 'Altitude', 'DTK ', 'HDG ', ' DIS', '  ETE']);
        markdown += '|:---:|--------|-------:|-------:|-----:|-----:|-----:|------:|' + "\n";
        m.checkpoints.forEach((c, i) => {
            let frqString = '';
            if (c.frequency) {
                frqString = c.frequency_unit === 'M' ? this.pad(c.frequency_mhz, 6, 2) : ('✺ ' + c.frequency_khz.toFixed()).padStart(6);
            }
            ;
            markdown += this.outputLine([
                this.pad(i + 1, 2, 0, "0") + ".",
                c.name.padEnd(6, " "),
                (c.frequency) ? frqString : ' '.repeat(6),
                (c.altitude) ? this.pad(c.altitude_ft, 6, 0) + ' ft' : ' '.repeat(9),
                (c.direction >= 0) ? this.padThree(c.direction_magnetic) + "°" : ' '.repeat(4),
                (c.heading >= 0) ? this.padThree(c.heading_magnetic) + "°" : ' '.repeat(4),
                (c.distance >= 0) ? this.pad(c.distance, 4, 1) + ' NM' : ' '.repeat(7),
                (c.time_enroute > 0) ? this.convertHoursToMinutesString(c.time_enroute) : ' '.repeat(5),
            ]);
        });
        markdown += this.outputLine([
            '**>**', '**Total**', '  ', '   ', '   ', '   ',
            '**' + this.pad(total_distance, 4, 1) + ' NM**',
            '**' + this.convertHoursToMinutesString(total_time_enroute) + '**'
        ]);
        markdown += `----

[Previous mission](#) | [Mission overview](#) | [Next mission](#)`;
        return markdown;
    }
}
