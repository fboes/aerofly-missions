import { Mission } from "../Aerofly/Mission.js";
import { MissionConditionsCloud } from "../Aerofly/MissionConditions.js";

type CheckWxApiPayload = {
  data: CheckWxApiPayloadItem[];
};

type CheckWxApiPayloadItem = {
  clouds?: {
    code: string;
    feet: number;
  }[];
  visibility?: {
    meters_float?: number;
  };
  wind?: {
    degrees?: number;
    speed_kts?: number;
    gust_kts?: number;
  };
  temperature?: {
    celsius?: number;
  };
};

export class CheckWx {
  constructor(private metarApiKey: string) {}

  public async fetch(icao: string): Promise<CheckWxApiPayload> {
    const url = new URL(`https://api.checkwx.com/metar/${encodeURIComponent(icao)}/decoded`);

    const response = await fetch(url, {
      headers: {
        "X-API-Key": this.metarApiKey,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    return await (<Promise<CheckWxApiPayload>>response.json());
  }

  public addToMission(checkWxPayload: CheckWxApiPayload, mission: Mission): Mission {
    const metar = checkWxPayload.data.at(0);
    if (!metar) {
      throw new Error("No METAR data found");
    }

    mission.conditions.wind_direction = metar.wind?.degrees ?? 0;
    mission.conditions.wind_gusts = metar.wind?.gust_kts ?? 0;
    mission.conditions.wind_speed = metar.wind?.speed_kts ?? 0;

    let visibility = metar.visibility?.meters_float ?? 0;
    if (visibility === 9999) {
      visibility = 20000;
    }
    mission.conditions.visibility = Math.round(visibility / 500) * 500;
    mission.conditions.clouds =
      metar.clouds?.map((c) => {
        const cloud = new MissionConditionsCloud();
        cloud.cover_code = c.code;
        cloud.height_feet = c.feet ?? 0;
        return cloud;
      }) ?? [];

    // @see https://github.com/fboes/aerofly-wettergeraet/blob/main/src/WettergeraetLib/AeroflyWeather.cpp#L89
    mission.conditions.thermal_strength = ((metar.temperature?.celsius ?? 14) - 5) / 25;
    mission.conditions.makeTurbulence();
    return mission;
  }
}
