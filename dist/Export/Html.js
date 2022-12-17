import { LonLat, LonLatArea } from "../World/LonLat.js";
import { LonLatDate } from "../World/LonLatDate.js";
import { Outputtable } from "./Outputtable.js";
import { SkyVector } from "./SkyVector.js";
export default class Html extends Outputtable {
    constructor(mission) {
        super();
        this.mission = mission;
    }
    /**
     * @param fields Table cell contents
     * @param join `td` or `th`; to supress a `th` at the beginnining of a `tr` with `td`s set it to `ttd`, which will be converted to `td`
     * @returns string
     */
    outputLine(fields, join = 'td') {
        const tag = join === 'ttd' ? 'td' : join;
        return join === 'td'
            ? `<tr><th scope="row">` + fields[0] + `</th><${tag}>` + fields.slice(1).join(`</${tag}><${tag}>`) + `</${tag}></tr>`
            : `<tr><${tag}>` + fields.join(`</${tag}><${tag}>`) + `</${tag}></tr>`;
    }
    outputSunState(sunState) {
        return super.outputSunState(sunState).replace(/\s/g, "&nbsp;");
    }
    outputDateTime(date) {
        return super.outputDateTime(date).replace(/(T|Z)/g, "<small>$1</small>");
    }
    /**
     * @returns string without proper HTML quoting, so go hack yourself ;)
     */
    toString() {
        const m = this.mission;
        const s = new SkyVector(m);
        const lonLatArea = new LonLatArea(this.mission.origin_lon_lat);
        this.mission.checkpoints.forEach((c) => {
            lonLatArea.push(c.lon_lat);
        });
        const total_distance = m.distance;
        const total_time_enroute = m.time_enroute;
        const time = m.conditions.time_object;
        const sunStateOrigin = new LonLatDate(m.origin_lon_lat, time).sunState;
        time.setSeconds(time.getSeconds() + total_time_enroute * 3600);
        const sunStateDestination = new LonLatDate(m.destination_lon_lat, time).sunState;
        const zoomLevel = lonLatArea.zoomLevel;
        const center = lonLatArea.center;
        let html = '';
        html += `<p class="no-print">Check your <a href="${s.toString()}" target="skyvector">current flight plan on Sky Vector</a>.
    You may also want to take a look at <a href="https://www.google.com/maps/@?api=1&amp;map_action=map&amp;center=${center.lat},${center.lon}&amp;zoom=${zoomLevel}&amp;basemap=terrain" target="gmap">Google Maps</a> / <a href="https://www.openstreetmap.org/#map=${zoomLevel}/${center.lat}/${center.lon}" target="osm">OpenStreetMap</a>.</p>`;
        html += `<div class="table table-weather"><table>
    <caption>Weather</caption>
    <thead>`;
        html += this.outputLine(["Wind ", "Clouds", "Visibility", " Flight rules"], 'th');
        html += '</thead><tbody>';
        html += this.outputLine([
            this.getWind(m.conditions) + '&nbsp;kts',
            m.conditions.cloud_cover_symbol + "&nbsp;" + m.conditions.cloud_cover_code + " @ " + m.conditions.cloud_base_feet.toLocaleString("en") + "&nbsp;ft",
            m.conditions.visibility.toLocaleString("en") + "&nbsp;m / " + Math.round(m.conditions.visibility_sm) + "&nbsp;SM",
            m.conditions.getFlightCategory(m.origin_lon_lat.continent !== LonLat.CONTINENT_NORTH_AMERICA)
        ], 'ttd');
        html += '</tbody></table></div>';
        html += `<div class="table table-airports"><table>
    <caption>Airports</caption>
    <thead>`;
        html += this.outputLine(["Type", "Location ", "Date &amp; time ", "<abbr title=\"Local solar time\">LST</abbr>", " Sun"], 'th');
        html += '</thead><tbody>';
        html += this.outputLine([
            "Departure",
            `<a target="skyvector" href="https://skyvector.com/airport/${m.origin_icao}">${m.origin_icao}</a>`,
            this.outputDateTime(m.conditions.time_object),
            sunStateOrigin.localSolarTime,
            this.outputSunState(sunStateOrigin)
        ]);
        html += this.outputLine([
            "Destination",
            `<a target="skyvector" href="https://skyvector.com/airport/${m.destination_icao}">${m.destination_icao}</a>`,
            this.outputDateTime(time),
            sunStateDestination.localSolarTime,
            this.outputSunState(sunStateDestination)
        ]);
        html += '</tbody></table></div>';
        if (m.checkpoints.length < 1) {
            return html;
        }
        html += `<div class="table table-checkpoints"><table>
    <caption>Checkpoints</caption>
    <thead>`;
        html += this.outputLine([
            "#",
            "Waypoint ",
            "<abbr title=\"Frequency\">FRQ</abbr>",
            "Altitude ",
            "<abbr title=\"Desired track magnetic\">DTK</abbr>",
            "<abbr title=\"Heading magnetic\">HDG</abbr> ",
            "Distance",
            "<abbr title=\"Estimated time enroute\">ETE</abbr>"
        ], 'th');
        html += '</thead><tbody>';
        m.checkpoints.forEach((c, i) => {
            let frqString = "";
            if (c.frequency) {
                frqString = c.frequency_unit === "M" ? this.pad(c.frequency_mhz, 6, 2) : c.frequency_khz.toFixed().padStart(6);
                frqString += "&nbsp;" + c.frequency_unit + "Hz";
            }
            html += this.outputLine([
                this.pad(i + 1, 2, 0, "0") + ".",
                c.name,
                (c.frequency ? frqString : ""),
                (c.altitude ? this.pad(c.altitude_ft, 6, 0) + '&nbsp;ft' : ''),
                c.direction >= 0 ? this.padThree(c.direction_magnetic) + "°" : " ".repeat(4),
                c.heading >= 0 ? this.padThree(c.heading_magnetic) + "°" : " ".repeat(4),
                c.distance >= 0 ? this.pad(c.distance, 5, 1) + "&nbsp;NM" : " ".repeat(8),
                c.time_enroute > 0 ? this.convertHoursToMinutesString(c.time_enroute) : " ".repeat(5),
            ]);
        });
        html += '</tbody><tfoot>';
        html += this.outputLine([
            "",
            "Total",
            "",
            "",
            "",
            "",
            this.pad(total_distance, 4, 1) + "&nbsp;NM",
            this.convertHoursToMinutesString(total_time_enroute),
        ]);
        html += '</tfoot></table></div>';
        return html;
    }
}
