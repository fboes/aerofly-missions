import { Mission } from "../Aerofly/Mission.js";
import { MissionCheckpoint } from "../Aerofly/MissionCheckpoint.js";
import { LonLat } from "../World/LonLat.js";

export type SimBriefApiPayloadAirport = {
  icao_code: string;
  icao_region: string;
  pos_lat: string;
  pos_long: string;
  /**
   * Feet
   */
  elevation: string;
  name: string;
  plan_rwy: string;
  metar: string;
  /**
   * Meters
   */
  metar_visibility: string;
  /**
   * Feet
   */
  metar_ceiling: string;
  metar_category: string;
};
export type SimBriefApiPayloadNavlogItem = {
  ident: string;
  type: "ltlg" | "wpt" | "vor" | "apt";
  icao_region: string;
  pos_lat: string;
  pos_long: string;
  altitude_feet: string;
  /**
   * Can be in kHz or MHz
   */
  frequency: string;
};
export type SimBriefApiPayloadFmsDownload = {
  name: string;
  link: string;
};
export type SimBriefApiPayload = {
  general: {
    cruise_tas: string;
  };
  origin: SimBriefApiPayloadAirport;
  destination: SimBriefApiPayloadAirport;
  navlog: SimBriefApiPayloadNavlogItem[];
  atc: {
    callsign: string;
  };
  aircraft: {
    icaocode: string;
    reg: string;
  };
  times: {
    sched_out: string;
  };
  fms_downloads: {
    directory: string;
    mfs: SimBriefApiPayloadFmsDownload;
    mfn: SimBriefApiPayloadFmsDownload;
  };
};
export type SimBriefApiError = {
  fetch: {
    userid: string;
    static_id: string;
    status: string;
    time: string;
  };
};

export class SimBrief {
  public async fetch(username: string): Promise<SimBriefApiPayload> {
    const url = new URL("https://www.simbrief.com/api/xml.fetcher.php");
    url.searchParams.append(username.match(/^\d+$/) ? "userid" : "username", username);
    url.searchParams.append("json", "v2");

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorResponse = (await response.json()) as SimBriefApiError;
      throw new Error(errorResponse?.fetch?.status ?? `Response status: ${response.status}`);
    }

    return await (<Promise<SimBriefApiPayload>>response.json());
  }

  public async fetchMsfs(username: string): Promise<string> {
    const simbriefPayload = await this.fetch(username);
    const url = new URL(simbriefPayload.fms_downloads.directory + simbriefPayload.fms_downloads.mfs.link);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    return await response.text();
  }

  public async fetchMission(username: string, mission: Mission): Promise<object> {
    const simbriefPayload = await this.fetch(username);
    return this.convertMission(simbriefPayload, mission);
  }

  public convertMission(simbriefPayload: SimBriefApiPayload, mission: Mission, useDestinationWeather = false): Mission {
    mission.conditions.time.dateTime = new Date(simbriefPayload.times.sched_out);

    this.convertWeather(mission, !useDestinationWeather ? simbriefPayload.origin : simbriefPayload.destination);

    const departureRunwayOrientation = Number(simbriefPayload.origin.plan_rwy.replace(/\D+/, "")) * 10;
    const originPosition = new LonLat(
      Number(simbriefPayload.origin.pos_long),
      Number(simbriefPayload.origin.pos_lat),
      Number(simbriefPayload.origin.elevation)
    );

    mission.origin_icao = simbriefPayload.origin.icao_code;
    mission.origin_lon_lat = originPosition.getRelativeCoordinates(0.25, departureRunwayOrientation + 180);
    mission.origin_dir = departureRunwayOrientation;

    const destinationRunwayOrientation = Number(simbriefPayload.destination.plan_rwy.replace(/\D+/, "")) * 10;
    const destinationPosition = new LonLat(
      Number(simbriefPayload.destination.pos_long),
      Number(simbriefPayload.destination.pos_lat),
      Number(simbriefPayload.destination.elevation)
    );

    mission.destination_icao = simbriefPayload.destination.icao_code;
    mission.destination_lon_lat = destinationPosition.getRelativeCoordinates(0.25, destinationRunwayOrientation);
    mission.destination_dir = destinationRunwayOrientation;

    mission.aircraft_icao = simbriefPayload.aircraft.icaocode;
    mission.cruise_speed = Number(simbriefPayload.general.cruise_tas);
    mission.cruise_altitude = 0;
    mission.callsign = simbriefPayload.atc.callsign;
    mission.flight_setting = "taxi";

    const originCheckpoint = new MissionCheckpoint();
    originCheckpoint.name = simbriefPayload.origin.icao_code;
    originCheckpoint.lon_lat = originPosition;
    originCheckpoint.type = "origin";
    originCheckpoint.icao_region = simbriefPayload.origin.icao_region;

    const departureRunwayCheckpoint = new MissionCheckpoint();
    departureRunwayCheckpoint.name = simbriefPayload.origin.plan_rwy;
    departureRunwayCheckpoint.lon_lat = originPosition.getRelativeCoordinates(0.2, departureRunwayOrientation + 180);
    departureRunwayCheckpoint.type = "departure_runway";

    const destinationCheckpoint = new MissionCheckpoint();
    destinationCheckpoint.name = simbriefPayload.destination.icao_code;
    destinationCheckpoint.lon_lat = destinationPosition;
    destinationCheckpoint.type = "destination";
    destinationCheckpoint.icao_region = simbriefPayload.destination.icao_region;

    const destinationRunwayCheckpoint = new MissionCheckpoint();
    destinationRunwayCheckpoint.name = simbriefPayload.destination.plan_rwy;
    destinationRunwayCheckpoint.lon_lat = destinationPosition.getRelativeCoordinates(
      0.25,
      destinationRunwayOrientation + 180
    );
    destinationRunwayCheckpoint.type = "destination_runway";

    mission.checkpoints = [originCheckpoint, departureRunwayCheckpoint].concat(
      simbriefPayload.navlog
        .filter((navlogItem: SimBriefApiPayloadNavlogItem): boolean => {
          return navlogItem.type !== "ltlg";
        })
        .map((navlogItem: SimBriefApiPayloadNavlogItem): MissionCheckpoint => {
          const m = new MissionCheckpoint();
          m.name = navlogItem.ident;
          m.lon_lat = new LonLat(Number(navlogItem.pos_long), Number(navlogItem.pos_lat));
          m.lon_lat.altitude_ft = Number(navlogItem.altitude_feet);
          m.type = "waypoint";
          m.icao_region = navlogItem.icao_region;

          let frequency = Number(navlogItem.frequency);
          if (frequency > 118) {
            frequency /= 1000;
          }
          m.frequency_mhz = frequency;

          mission.cruise_altitude = Math.max(mission.cruise_altitude, m.lon_lat.altitude_m ?? 0);

          return m;
        })
    );

    mission.checkpoints.pop();
    mission.checkpoints = mission.checkpoints.concat([destinationRunwayCheckpoint, destinationCheckpoint]);
    mission.title = `${simbriefPayload.origin.name} to ${simbriefPayload.destination.name}`;
    mission.description = "";

    mission.syncCruiseSpeed();
    mission.calculateCheckpoints();
    mission.setAutoTitleDescription("");

    return mission;
  }

  protected convertWeather(mission: Mission, origin: SimBriefApiPayloadAirport) {
    mission.conditions.visibility = Number(origin.metar_visibility != "9999" ? origin.metar_visibility : 20000);

    const clouds = [...origin.metar.matchAll(/\b(FEW|SCT|BKN|OVC":)(\d{3})\b/g)];
    mission.conditions.cloud.cover_code = clouds[0] && clouds[0][1] ? clouds[0][1] : "";
    mission.conditions.cloud.height_feet = clouds[0] && clouds[0][2] ? Number(clouds[0][2]) * 100 : 0;
    mission.conditions.cloud2.cover_code = clouds[1] && clouds[1][1] ? clouds[1][1] : "";
    mission.conditions.cloud2.height_feet = clouds[1] && clouds[1][2] ? Number(clouds[1][2]) * 100 : 0;
    mission.conditions.cloud3.cover_code = clouds[2] && clouds[2][1] ? clouds[2][1] : "";
    mission.conditions.cloud3.height_feet = clouds[2] && clouds[2][2] ? Number(clouds[2][2]) * 100 : 0;
    mission.conditions.cloud3.height_feet = 0;

    const windMatch = origin.metar.match(/\b(\d{3})(\d{2})(?:G(\d{2}))?KT\b/);
    mission.conditions.wind_direction = windMatch && windMatch[1] ? Number(windMatch[1]) : 0;
    mission.conditions.wind_speed = windMatch && windMatch[2] ? Number(windMatch[2]) : 0;
    mission.conditions.wind_gusts = windMatch && windMatch[3] ? Number(windMatch[3]) : 0;
  }
}
