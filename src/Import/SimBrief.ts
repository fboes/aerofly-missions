import { Mission } from "../Aerofly/Mission.js";
import { MissionCheckpoint } from "../Aerofly/MissionCheckpoint.js";
import { LonLat } from "../World/LonLat.js";

export type SimBriefApiPayloadAirport = {
  icao_code: string;
  pos_lat: string;
  pos_long: string;
  elevation: string; // ft
  name: string;
  plan_rwy: string;
  metar: string;
  metar_visibility: string; // meters
  metar_ceiling: string; // ft
  metar_category: string;
};
export type SimBriefApiPayloadNavlogItem = {
  ident: string;
  type: "ltlg" | "wpt" | "vor" | "apt";
  pos_lat: string;
  pos_long: string;
  altitude_feet: string;
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

export class SimBrief {
  public async fetch(username: string): Promise<SimBriefApiPayload> {
    const parameterName = username.match(/^\d+$/) ? "userid" : "username";
    const url = `https://www.simbrief.com/api/xml.fetcher.php?${encodeURIComponent(parameterName)}=${encodeURIComponent(
      username
    )}&json=v2`;
    console.log(url);

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    return await (<Promise<SimBriefApiPayload>>response.json());
  }

  public async fetchMsfs(username: string): Promise<string> {
    const simbriefPayload = await this.fetch(username);
    const url = simbriefPayload.fms_downloads.directory + simbriefPayload.fms_downloads.mfs.link;
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

  public convertMission(simbriefPayload: SimBriefApiPayload, mission: Mission): Mission {
    mission.conditions.time.dateTime = new Date(simbriefPayload.times.sched_out);
    mission.conditions.visibility = Number(
      simbriefPayload.origin.metar_visibility != "9999" ? simbriefPayload.origin.metar_visibility : 20_000
    );
    mission.conditions.cloud.height_feet = Number(
      simbriefPayload.origin.metar_ceiling != "9999" ? simbriefPayload.origin.metar_ceiling : 0
    );
    mission.conditions.cloud.cover = Number(simbriefPayload.origin.metar_ceiling != "9999" ? 0.5 : 0);
    mission.conditions.cloud2.height_feet = 0;
    mission.conditions.cloud2.cover = 0;
    mission.conditions.cloud3.height_feet = 0;
    mission.conditions.cloud3.cover = 0;

    const windMatch = simbriefPayload.origin.metar.match(/\s(\d{3})(\d{2})KT\s/);
    mission.conditions.wind_direction = windMatch && windMatch[1] ? Number(windMatch[1]) : 0;
    mission.conditions.wind_speed = windMatch && windMatch[2] ? Number(windMatch[2]) : 0;

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

    const departureRunwayCheckpoint = new MissionCheckpoint();
    departureRunwayCheckpoint.name = simbriefPayload.origin.plan_rwy;
    departureRunwayCheckpoint.lon_lat = originPosition.getRelativeCoordinates(0.2, departureRunwayOrientation + 180);
    departureRunwayCheckpoint.type = "departure_runway";

    const destinationCheckpoint = new MissionCheckpoint();
    destinationCheckpoint.name = simbriefPayload.destination.icao_code;
    destinationCheckpoint.lon_lat = destinationPosition;
    destinationCheckpoint.type = "destination";

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
          m.frequency_mhz = Number(navlogItem.frequency);

          mission.cruise_altitude = Math.max(mission.cruise_altitude, m.lon_lat.altitude_m);

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
}
