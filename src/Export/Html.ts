import { Mission } from "../Aerofly/Mission.js";
import { MissionConditions, MissionConditionsCloud } from "../Aerofly/MissionConditions.js";
import { LonLat, LonLatArea } from "../World/LonLat.js";
import { LonLatDate, LonLateDateSunState } from "../World/LonLatDate.js";
import { Outputtable } from "./Outputtable.js";
import { SkyVector } from "./SkyVector.js";

export default class Html extends Outputtable {

  constructor(protected mission: Mission) {
    super();
  }

  /**
   * @param fields Table cell contents
   * @param join `td` or `th`; to supress a `th` at the beginnining of a `tr`
   *              with `td`s set it to `ttd`, which will be converted to `td`
   * @returns string
   */
  outputLine(fields: string[], join = 'td'): string {
    const tag = join === 'ttd' ? 'td' : join;
    return join === 'td'
      ? `<tr><th scope="row">` + fields[0] + `</th><${tag}>` + fields.slice(1).join(`</${tag}><${tag}>`) + `</${tag}></tr>`
      : `<tr><${tag}>` + fields.join(`</${tag}><${tag}>`) + `</${tag}></tr>`;
  }

  outputSunState(sunState: LonLateDateSunState): string {
    const deg = sunState.solarElevationAngleDeg / 6 * 5;
    const degX = Math.max(0, Math.min(18, 12 - deg));

    return `<svg width="20" height="20" version="1.1" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <title>${deg.toFixed()}°</title>
    <style>
      rect, circle, line { stroke-width: 1px; stroke: currentColor; fill: none; stroke-linecap: round; stroke-linejoin: round; }
    </style>
    <rect x="1" y="1" width="18" height="18" />
    <circle cx="10" cy="10" r="3" />
    <line x1="3" y1="10" x2="5" y2="10" />
    <line x1="3" y1="10" x2="5" y2="10" transform="rotate(45, 10, 10)" />
    <line x1="3" y1="10" x2="5" y2="10" transform="rotate(90, 10, 10)" />
    <line x1="3" y1="10" x2="5" y2="10" transform="rotate(135, 10, 10)" />
    <line x1="3" y1="10" x2="5" y2="10" transform="rotate(180, 10, 10)" />
    <line x1="3" y1="10" x2="5" y2="10" transform="rotate(225, 10, 10)" />
    <line x1="3" y1="10" x2="5" y2="10" transform="rotate(270, 10, 10)" />
    <line x1="3" y1="10" x2="5" y2="10" transform="rotate(315, 10, 10)" />
    <rect x="1" y="${19 - degX}" width="18" height="${degX}" style="fill: currentColor" />
  </svg> ${sunState.sunState}`
    //return super.outputSunState(sunState).replace(/\s/g, "&nbsp;");
  }

  outputDateTime(date: Date) {
    return super.outputDateTime(date).replace(/(T|Z)/g, "<small>$1</small>");
  }

  outputCover(cloud: MissionConditionsCloud): string {
    const octas = Math.round(cloud.cover * 8);
    let svg = `<svg width="20" height="20" version="1.1" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <style>
      circle, line, path { stroke-width: 1px; stroke: currentColor; fill: none; stroke-linecap: round; stroke-linejoin: round; }
      path { fill: currentColor; stroke: none; }
    </style>
    <title>${octas}/8</title>
    <circle cx="10" cy="10" r="9" />`;

    const middle = octas === 7 ? 0.5 : 0;
    if (octas > 0) {
      if (octas === 1 || octas === 3) {
        svg += '<line x1="10" y1="1" x2="10" y2="19" />';
      }
      if (octas === 5) {
        svg += '<line x1="1" y1="10" x2="19" y2="10" />';
      }
      if (octas >= 2) {
        svg += `<path d="m ${10+middle},1 a ${9-middle},${9-middle} 0 0 1 9,9 h -9 z" />`;
      }
      if (octas >= 4) {
        svg += `<path d="m ${10+middle},1 a ${9-middle},${9-middle} 0 0 1 9,9 h -9 z" transform="scale(1,-1) translate(0,-20)" />`;
      }
      if (octas >= 6) {
        svg += `<path d="m ${10+middle},1 a ${9-middle},${9-middle} 0 0 1 9,9 h -9 z" transform="scale(-1,-1) translate(-20,-20)" />`;
      }
      if (octas >= 7) {
        svg += `<path d="m ${10+middle},1 a ${9-middle},${9-middle} 0 0 1 9,9 h -9 z" transform="scale(-1,1) translate(-20, 0)" />`;
      }
    }

    svg += '</svg>';
    return svg;
  }

  /**
   * @returns string without proper HTML quoting, so go hack yourself ;)
   */
  toString(): string {
    const m = this.mission;
    const s = new SkyVector(m);
    const lonLatArea = new LonLatArea(this.mission.origin_lon_lat);
    this.mission.checkpoints.forEach((c) => {
      lonLatArea.push(c.lon_lat);
    });

    const total_distance = m.distance;
    const total_time_enroute = m.time_enroute;
    const time = new Date(m.conditions.time.dateTime);
    const sunStateOrigin = new LonLatDate(m.origin_lon_lat, time).sunState;
    time.setSeconds(time.getSeconds() + total_time_enroute * 3600);
    const sunStateDestination = new LonLatDate(m.destination_lon_lat, time).sunState;
    const zoomLevel = lonLatArea.zoomLevel
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
      this.outputCover(m.conditions.cloud) + "&nbsp;" + m.conditions.cloud.cover_code + " @ " + m.conditions.cloud.height_feet.toLocaleString("en") + "&nbsp;ft",
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
      this.outputDateTime(m.conditions.time.dateTime),
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
      return html
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
      html += this.outputLine([
        this.pad(i + 1, 2, 0, "0") + ".",
        (i !== 0 && i !== m.checkpoints.length - 1) ? `<input data-cp-id="${i}" data-cp-prop="name" type="text" value="${c.name}" pattern="[A-Z0-9]+" maxlength="5" />` : c.name,
        `<input data-cp-id="${i}" data-cp-prop="frequency_mhz" type="number" min="0.19" step="0.01" max="113" value="${c.frequency ? c.frequency_mhz : ''}" />&nbsp;MHz`,
        `<input data-cp-id="${i}" data-cp-prop="altitude_ft" type="number" min="0" step="${(i !== 0 && i !== m.checkpoints.length - 1) ? 100 : 1}" value="${c.altitude_ft ?Math.round(c.altitude_ft) : ''}" />&nbsp;ft`,
        this.padThree(c.direction_magnetic) + "°",
        this.padThree(c.heading_magnetic) + "°",
        c.distance >= 0 ? this.pad(c.distance, 5, 1) + "&nbsp;NM" : "",
        c.time_enroute > 0 ? this.convertHoursToMinutesString(c.time_enroute) : "",
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
