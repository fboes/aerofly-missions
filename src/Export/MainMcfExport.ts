import { MissionCheckpoint } from "../Aerofly/MissionCheckpoint.js";
import { GarminExportAbstract } from "../Import/GarminFpl.js";
import { LonLat } from "../World/LonLat.js";

export class MainMcfExport extends GarminExportAbstract {
  toString(): string {
    let mcf = `\
// -----------------------------------------------------------------------------
            <[tmnav_route][Route][]
                <[float64][CruiseAltitude][${this.mission.cruise_altitude ?? -1}]>
                <[pointer_list_tmnav_route_way][Ways][]
`;
    mcf += this.mission.checkpoints
      .map((wp, id) => {
        let additional = "";
        if (wp.type === MissionCheckpoint.TYPE_WAYPOINT) {
          additional += `\
                        <[bool][FlyOver][${wp.flyOver ? "true" : "false"}]>
`;
          additional += `\
                        <[bool][Altitude][${wp.lon_lat.altitude_m || -1001} ${wp.lon_lat.altitude_m || 100001}]>
`;
        }
        return `\
                    <[tmnav_route_${wp.type}][${wp.name}][${id}]
                        <[string8u][Identifier][${wp.name}]>
                        <[vector3_float64][Position][${this.convertCoordinates(wp.lon_lat).join(" ")}]>
${additional}\
                    >
`;
      })
      .join("");
    mcf += `\
                >
            >
// -----------------------------------------------------------------------------
`;
    return mcf;
  }

  protected convertCoordinates(lonLat: LonLat): [number, number, number] {
    const a = 6378137.0;
    const f = 1.0 / 298.257223563;
    const e2 = f * (2 - f);

    const lon = lonLat.lonRad;
    const lat = lonLat.latRad;
    const h = lonLat.altitude_m;

    const sinLat = Math.sin(lat);
    const cosLat = Math.cos(lat);
    const cosLon = Math.cos(lon);
    const sinLon = Math.sin(lon);

    const N = a / Math.sqrt(1 - e2 * sinLat * sinLat);
    const x = (N + h) * cosLat * cosLon;
    const y = (N + h) * cosLat * sinLon;
    const z = (N * (1 - e2) + h) * sinLat;

    return [x, y, z];
  }
}
