import { LonLatArea } from "../World/LonLat.js";
import { LonLatDate } from "../World/LonLatDate.js";
import { Outputtable } from "./Outputtable.js";
import { SkyVector } from "./SkyVector.js";
export class Markdown extends Outputtable {
    constructor(mission) {
        super();
        this.mission = mission;
        this.lonLatArea = new LonLatArea(mission.origin_lon_lat);
        this.mission.checkpoints.forEach((c) => {
            this.lonLatArea.push(c.lon_lat);
        });
    }
    outputLine(fields) {
        return "| " + fields.join(" | ") + " |\n";
    }
    removeFrequencies(fields, hasFrequencies) {
        if (!hasFrequencies) {
            fields.splice(2, 1);
        }
        return fields;
    }
    toString(filename = "custom_missions_user.tmc") {
        const m = this.mission;
        const s = new SkyVector(m);
        const total_distance = m.distance;
        const total_time_enroute = m.time_enroute;
        const time = new Date(m.conditions.time.dateTime);
        const sunStateOrigin = new LonLatDate(m.origin_lon_lat, time).sunState;
        time.setSeconds(time.getSeconds() + total_time_enroute * 3600);
        const sunStateDestination = new LonLatDate(m.destination_lon_lat, time).sunState;
        const zoomLevel = this.lonLatArea.getZoomLevel();
        const center = this.lonLatArea.center;
        const hasFrequencies = m.hasFrequencies;
        let markdown = `# ${m.title}

${m.description}

> This is a custom missions file for [Aerofly FS 4](https://www.aerofly.com/). Download [\`${filename}\`](./${filename}) and see [installation instructions](https://fboes.github.io/aerofly-missions/docs/generic-installation.html) on how to get started.

## Flight briefing

Check your [Sky Vector Flight Plan](${s.toString()}). You may also want to take a look at [Google Maps](https://www.google.com/maps/@?api=1&map_action=map&center=${center.lat},${center.lon}&zoom=${zoomLevel}&basemap=terrain) / [OpenStreetMap](https://www.openstreetmap.org/#map=${zoomLevel}/${center.lat}/${center.lon}).

### Aircraft

| Aircraft type | Identification | Cruising Speed | Cruising Altitude |
| ------------- | -------------- | -------------: | ----------------: |
| ${m.aircraft_icao.padEnd(13)} | ${m.callsign.padEnd(14)} |        ${Outputtable.padThree(m.cruise_speed)} kts | ${m.cruise_altitude_ft.toLocaleString("en").padStart(14)} ft |

### Weather

| Wind         | Clouds           | Visibility       | Flight rules |
| ------------ | ---------------- | ---------------- | ------------ |
| ${this.getWind(m.conditions)} kts | ${m.conditions.cloud.cover_symbol +
            " " +
            m.conditions.cloud.cover_code +
            " @ " +
            m.conditions.cloud.height_feet.toLocaleString("en") +
            " ft"} | ${m.conditions.visibility.toLocaleString("en") + " m / " + Math.round(m.conditions.visibility_sm)} SM | ${m.conditions.getFlightCategory(m.origin_country !== "US")} |

### Airports

|             | Location                                      | Country | Date & time       | Local solar time | Sun |
| ----------- | --------------------------------------------- | ------- | ----------------- | ---------------- | --- |
| Departure   | [${m.origin_icao}](https://www.pilotnav.com/airport/${m.origin_icao}) | ${m.origin_country}      | ${this.outputDateTime(m.conditions.time.dateTime)} | ${sunStateOrigin.localSolarTime} | ${this.outputSunState(sunStateOrigin)} |
| Destination | [${m.destination_icao}](https://www.pilotnav.com/airport/${m.destination_icao}) | ${m.destination_country}      | ${this.outputDateTime(time)} | ${sunStateDestination.localSolarTime} | ${this.outputSunState(sunStateDestination)} |

### Checkpoints

`;
        markdown += this.outputLine(this.removeFrequencies(["#  ", "Waypoint ", "Frequency ", "Altitude ", "DTK ", "HDG ", "Distance", "  ETE"], hasFrequencies));
        markdown += this.outputLine(this.removeFrequencies([":-:", "---------", "---------:", "--------:", "---:", "---:", "-------:", "----:"], hasFrequencies));
        m.checkpoints.forEach((c, i) => {
            let frqString = "";
            if (c.frequency) {
                frqString =
                    c.frequency_unit === "M" ? Outputtable.pad(c.frequency_mhz, 6, 2) : c.frequency_khz.toFixed().padStart(6);
                frqString += " " + c.frequency_unit + "Hz";
            }
            markdown += this.outputLine(this.removeFrequencies([
                Outputtable.pad(i + 1, 2, 0, "0") + ".",
                c.name.padEnd(9, " "),
                c.frequency ? frqString : " ".repeat(10),
                c.lon_lat.altitude_m ? Outputtable.pad(c.lon_lat.altitude_ft, 6, 0) + " ft" : " ".repeat(9),
                c.direction >= 0 ? Outputtable.padThree(c.direction_magnetic) + "°" : " ".repeat(4),
                c.heading >= 0 ? Outputtable.padThree(c.heading_magnetic) + "°" : " ".repeat(4),
                c.distance >= 0 ? Outputtable.pad(c.distance, 5, 1) + " NM" : " ".repeat(8),
                c.time_enroute > 0 ? Outputtable.convertHoursToMinutesString(c.time_enroute) : " ".repeat(5),
            ], hasFrequencies));
        });
        markdown += this.outputLine(this.removeFrequencies([
            "   ",
            "**Total**",
            "          ",
            "         ",
            "    ",
            "    ",
            "**" + Outputtable.pad(total_distance, 4, 1) + " NM**",
            "**" + Outputtable.convertHoursToMinutesString(total_time_enroute) + "**",
        ], hasFrequencies));
        markdown += `
---

[Previous mission](#) • [Mission overview](#) • [Next mission](#)

Generated via [Aerofly Missionsgerät](https://github.com/fboes/aerofly-missions)
`;
        return markdown;
    }
}
