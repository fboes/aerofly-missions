import { Mission } from "../Aerofly/Mission.js";
import { MissionCheckpoint } from "../Aerofly/MissionCheckpoint.js";

export class SkyVector {
  constructor(protected mission: Mission) {}

  getCheckpoints(filterRunway = true): string[] {
    return this.mission.checkpoints
      .filter((c) => {
        return (
          !filterRunway ||
          (c.type !== MissionCheckpoint.TYPE_DEPARTURE_RUNWAY && c.type !== MissionCheckpoint.TYPE_DESTINATION_RUNWAY)
        );
      })
      .map((c) => {
        return c.isExportable() ? c.name : c.lon_lat.toNavString();
      });
  }

  /**
   * @returns string like 'https://skyvector.com/?ll=58.64732108,16.32458497&chart=301&zoom=4&fpl=N0122A025%20ESSL%205831N01558E%20ESVE%20ESKN'
   */
  toString(filterRunway = true): string {
    const parameters: string[] = [
      "ll=" + this.mission.origin_lon_lat.lat.toString() + "," + this.mission.origin_lon_lat.lon.toString(),
      "chart=301",
      "zoom=3",
    ];

    const cruise = this.mission.cruise_speed.toFixed().padStart(4, "0");
    const alt = (this.mission.cruise_altitude_ft / 100).toFixed().padStart(3, "0");

    parameters.push(
      "fpl=" + encodeURIComponent("N" + cruise + "A" + alt + " " + this.getCheckpoints(filterRunway).join(" "))
    );

    return "https://skyvector.com/?" + parameters.join("&");
  }

  /**
   * @param icaoCode of airport
   * @returns URL to airport procedures and information
   */
  static airportLink(icaoCode: string): string {
    switch (icaoCode.slice(0, 2)) {
      case "ED":
        return "https://aip.aero/de/en/vfr/?" + encodeURIComponent(icaoCode); // ifr
      case "EG":
        return "https://aip.aero/uk/vfr/?" + encodeURIComponent(icaoCode);
      case "EH":
        return "https://aip.aero/nl/en/vfr/?" + encodeURIComponent(icaoCode);
      case "LF":
        return "https://aip.aero/fr/vfr/?" + encodeURIComponent(icaoCode); // ifr
      case "LO":
        return "https://aip.aero/at/en/vfr/?" + encodeURIComponent(icaoCode);
      default:
        return "https://skyvector.com/airport/" + encodeURIComponent(icaoCode);
    }
  }
}
