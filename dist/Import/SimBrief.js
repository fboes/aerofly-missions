import { MissionCheckpoint } from "../Aerofly/MissionCheckpoint.js";
import { LonLat } from "../World/LonLat.js";
export class SimBrief {
    async fetch(username) {
        const parameterName = username.match(/^\d+$/) ? "userid" : "username";
        const url = `https://www.simbrief.com/api/xml.fetcher.php?${encodeURIComponent(parameterName)}=${encodeURIComponent(username)}&json=v2`;
        console.log(url);
        const response = await fetch(url, {
            headers: {
                Accept: "application/json",
            },
        });
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }
        return await response.json();
    }
    async fetchMsfs(username) {
        const simbriefPayload = await this.fetch(username);
        const url = simbriefPayload.fms_downloads.directory + simbriefPayload.fms_downloads.mfs.link;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }
        return await response.text();
    }
    async fetchMission(username, mission) {
        const simbriefPayload = await this.fetch(username);
        return this.convertMission(simbriefPayload, mission);
    }
    convertMission(simbriefPayload, mission) {
        mission.conditions.time.dateTime = new Date(simbriefPayload.times.sched_out);
        mission.conditions.visibility = Number(simbriefPayload.origin.metar_visibility != "9999" ? simbriefPayload.origin.metar_visibility : 20000);
        const clouds = [...simbriefPayload.origin.metar.matchAll(/\b(FEW|SCT|BKN|OVC":)(\d{3})\b/g)];
        mission.conditions.cloud.cover_code = clouds[0] && clouds[0][1] ? clouds[0][1] : "";
        mission.conditions.cloud.height_feet = clouds[0] && clouds[0][2] ? Number(clouds[0][2]) * 100 : 0;
        mission.conditions.cloud2.cover_code = clouds[1] && clouds[1][1] ? clouds[1][1] : "";
        mission.conditions.cloud2.height_feet = clouds[1] && clouds[1][2] ? Number(clouds[1][2]) * 100 : 0;
        mission.conditions.cloud3.cover_code = clouds[2] && clouds[2][1] ? clouds[2][1] : "";
        mission.conditions.cloud3.height_feet = clouds[2] && clouds[2][2] ? Number(clouds[2][2]) * 100 : 0;
        mission.conditions.cloud3.height_feet = 0;
        const windMatch = simbriefPayload.origin.metar.match(/\b(\d{3})(\d{2})(?:G(\d{2}))?KT\b/);
        mission.conditions.wind_direction = windMatch && windMatch[1] ? Number(windMatch[1]) : 0;
        mission.conditions.wind_speed = windMatch && windMatch[2] ? Number(windMatch[2]) : 0;
        mission.conditions.wind_gusts = windMatch && windMatch[3] ? Number(windMatch[3]) : 0;
        const departureRunwayOrientation = Number(simbriefPayload.origin.plan_rwy.replace(/\D+/, "")) * 10;
        const originPosition = new LonLat(Number(simbriefPayload.origin.pos_long), Number(simbriefPayload.origin.pos_lat), Number(simbriefPayload.origin.elevation));
        mission.origin_icao = simbriefPayload.origin.icao_code;
        mission.origin_lon_lat = originPosition.getRelativeCoordinates(0.25, departureRunwayOrientation + 180);
        mission.origin_dir = departureRunwayOrientation;
        const destinationRunwayOrientation = Number(simbriefPayload.destination.plan_rwy.replace(/\D+/, "")) * 10;
        const destinationPosition = new LonLat(Number(simbriefPayload.destination.pos_long), Number(simbriefPayload.destination.pos_lat), Number(simbriefPayload.destination.elevation));
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
        destinationRunwayCheckpoint.lon_lat = destinationPosition.getRelativeCoordinates(0.25, destinationRunwayOrientation + 180);
        destinationRunwayCheckpoint.type = "destination_runway";
        mission.checkpoints = [originCheckpoint, departureRunwayCheckpoint].concat(simbriefPayload.navlog
            .filter((navlogItem) => {
            return navlogItem.type !== "ltlg";
        })
            .map((navlogItem) => {
            const m = new MissionCheckpoint();
            m.name = navlogItem.ident;
            m.lon_lat = new LonLat(Number(navlogItem.pos_long), Number(navlogItem.pos_lat));
            m.lon_lat.altitude_ft = Number(navlogItem.altitude_feet);
            m.type = "waypoint";
            m.frequency_mhz = Number(navlogItem.frequency);
            mission.cruise_altitude = Math.max(mission.cruise_altitude, m.lon_lat.altitude_m);
            return m;
        }));
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
