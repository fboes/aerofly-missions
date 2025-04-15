import { MissionConditionsCloud } from "../Aerofly/MissionConditions.js";
export class CheckWx {
    constructor(metarApiKey) {
        this.metarApiKey = metarApiKey;
    }
    async fetch(icao) {
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
        return await response.json();
    }
    addToMission(checkWxPayload, mission) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        const metar = checkWxPayload.data.at(0);
        if (!metar) {
            throw new Error("No METAR data found");
        }
        mission.conditions.wind_direction = (_b = (_a = metar.wind) === null || _a === void 0 ? void 0 : _a.degrees) !== null && _b !== void 0 ? _b : 0;
        mission.conditions.wind_gusts = (_d = (_c = metar.wind) === null || _c === void 0 ? void 0 : _c.gust_kts) !== null && _d !== void 0 ? _d : 0;
        mission.conditions.wind_speed = (_f = (_e = metar.wind) === null || _e === void 0 ? void 0 : _e.speed_kts) !== null && _f !== void 0 ? _f : 0;
        let visibility = (_h = (_g = metar.visibility) === null || _g === void 0 ? void 0 : _g.meters_float) !== null && _h !== void 0 ? _h : 0;
        if (visibility === 9999) {
            visibility = 20000;
        }
        mission.conditions.visibility = Math.round(visibility / 500) * 500;
        mission.conditions.clouds =
            (_k = (_j = metar.clouds) === null || _j === void 0 ? void 0 : _j.map((c) => {
                var _a;
                const cloud = new MissionConditionsCloud();
                cloud.cover_code = c.code;
                cloud.height_feet = (_a = c.feet) !== null && _a !== void 0 ? _a : 0;
                return cloud;
            })) !== null && _k !== void 0 ? _k : [];
        // @see https://github.com/fboes/aerofly-wettergeraet/blob/main/src/WettergeraetLib/AeroflyWeather.cpp#L89
        mission.conditions.thermal_strength = (((_m = (_l = metar.temperature) === null || _l === void 0 ? void 0 : _l.celsius) !== null && _m !== void 0 ? _m : 14) - 5) / 25;
        mission.conditions.makeTurbulence();
        return mission;
    }
}
