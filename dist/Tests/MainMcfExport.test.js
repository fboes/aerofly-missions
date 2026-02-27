import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { MainMcfFactory } from "../Aerofly/MainMcf.js";
import { Mission } from "../Aerofly/Mission.js";
import { MainMcfExport } from "../Export/MainMcfExport.js";
import * as fs from "node:fs";
describe("MainMcfExportTest test", () => {
    it("should export main.mcf correctly", () => {
        const mainMcf = new MainMcfFactory().create(fs.readFileSync("./src/Tests/fixtures/main.mcf", "utf8"));
        const mission = new Mission("", "").fromMainMcf(mainMcf);
        assert.equal(mission.aircraft_livery, "icelandair");
        const exportMcf = new MainMcfExport(mission);
        {
            const mcfString = exportMcf.toString();
            assert.ok(mcfString.includes("<[pointer_list_tmnav_route_way][Ways][]"), "Ways list is present");
            assert.ok(mcfString.includes("<[float64][CruiseAltitude][304.8]>"), "Cruise altitude is present");
            assert.ok(mcfString.includes("<[tmnav_route_origin][EGGP][0]"), "Origin is present");
            assert.ok(mcfString.includes("<[vector3_float64][Position][3812258.1479555396 -189766.92490388086 5092820.672905484]>"), "Origin position is correct");
            assert.ok(mcfString.includes("icelandair"));
            //console.log(mcfString);
        }
    });
});
