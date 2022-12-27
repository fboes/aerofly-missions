import { Mission } from "../Aerofly/Mission.js";
import { MissionCheckpoint } from "../Aerofly/MissionCheckpoint.js";

export class SkyVector {
  constructor(protected mission: Mission) { }

  deg(deg: number): number {
    deg = Math.abs(deg);
    return Math.floor(deg) + ((deg % 1) / 100) * 60;
  }

  /**
   * @returns string like 'https://skyvector.com/?ll=58.64732108,16.32458497&chart=301&zoom=4&fpl=N0122A025%20ESSL%205831N01558E%20ESVE%20ESKN'
   */
  toString(filterRunway = true): string {
    const checkpoints = this.mission.checkpoints
      .filter((c) => {
        return (
          !filterRunway ||
          (c.type !== MissionCheckpoint.TYPE_DEPARTURE_RUNWAY && c.type !== MissionCheckpoint.TYPE_DESTINATION_RUNWAY)
        );
      })
      .map((c) => {
        if (c.type === MissionCheckpoint.TYPE_ORIGIN || c.type === MissionCheckpoint.TYPE_DESTINATION) {
          return c.name;
        }

        // 5831N01558E
        return (
          (this.deg(c.lon_lat.lat) * 100)
            .toFixed()
            .padStart(4, "0") +
          c.lon_lat.latHemisphere +
          (this.deg(c.lon_lat.lon) * 100)
            .toFixed()
            .padStart(5, "0") +
          c.lon_lat.lonHemisphere
        );
      });

    let parameters: string[] = [
      "ll=" + this.mission.origin_lon_lat.lat.toString() + "," + this.mission.origin_lon_lat.lon.toString(),
      "chart=301",
      "zoom=3",
    ];

    const cruise = this.mission.cruise_speed.toFixed().padStart(4, "0");
    const alt = (this.mission.cruise_altitude_ft / 100).toFixed().padStart(3, "0");

    parameters.push("fpl=" + encodeURIComponent("N" + cruise + "A" + alt + " " + checkpoints.join(" ")));

    return "https://skyvector.com/?" + parameters.join("&");
  }
}
