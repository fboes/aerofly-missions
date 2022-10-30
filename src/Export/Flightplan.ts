import { Mission } from "../Aerofly/Mission";

export class Flightplan {
  constructor(protected mission: Mission) {
  }

  convertTimeToString(hours: number): string {
    const minutes = Math.ceil(hours * 60);

    return Math.floor(minutes / 60).toFixed() + ':' + Math.ceil(minutes % 60).toFixed().padStart(2, "0");
  }

  toString(): string {
    const m = this.mission;
    let output = `${m.origin_icao} → ${m.destination_icao}
==============================
> WND: ${m.conditions.wind_direction.toFixed().padStart(3, "0")}° @ ${m.conditions.wind_speed.toFixed().padStart(3, "0")}kts
> CLD: ${(m.conditions.cloud_cover * 100).toFixed().padStart(3, "0")}% @ ${(m.conditions.cloud_base).toFixed().padStart(5, "0")}ft
------------------------------
`;

    let totalDistance = 0, totalTime = 0;
    m.checkpoints.forEach((c, i) => {
      output += `${i + 1}. ${c.name}`.padEnd(9, " ")

      if (c.direction >= 0) {
        output += "  " + c.direction.toFixed().padStart(3, "0") + "°"
      }
      if (c.distance > 0) {
        totalDistance += c.distance;
        totalTime += c.time;
        output += "  " + c.distance.toFixed(1).padStart(4, "0") + "NM";
        output += "  " + this.convertTimeToString(c.time) + "h";
      }

      output += "\n";
    })

    output += `------------------------------
Total:         `;
    output += "  " + totalDistance.toFixed(1).padStart(4, "0") + "NM";
    output += "  " + this.convertTimeToString(totalTime) + "h";
    output += "\n";

    return output;
  }
}
