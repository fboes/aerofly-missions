import { MainMcfFactory } from "../Aerofly/MainMcf.js";
import { Mission, } from "../Aerofly/Mission.js";
import { Test } from "../Cli/Test.js";
import { MainMcfExport } from "../Export/MainMcfExport.js";
import * as fs from "node:fs";
export class MainMcfExportTest extends Test {
    constructor(process, dieOnError = false) {
        super(process, dieOnError);
        this.process = process;
        this.dieOnError = dieOnError;
        this.testMainMcfExport();
    }
    testMainMcfExport() {
        const mainMcf = new MainMcfFactory().create(fs.readFileSync("./src/Tests/fixtures/main.mcf", "utf8"));
        const mission = new Mission("", "").fromMainMcf(mainMcf);
        const exportMcf = new MainMcfExport(mission);
        this.group(MainMcfExport.name + ": Basic export");
        {
            const mcfString = exportMcf.toString();
            this.assert(mcfString.includes("<[pointer_list_tmnav_route_way][Ways][]"), "Ways list is present");
            this.assert(mcfString.includes("<[float64][CruiseAltitude][304.8]>"), "Cruise altitude is present");
            this.assert(mcfString.includes("<[tmnav_route_origin][EGGP][0]"), "Origin is present");
            this.assert(mcfString.includes("<[vector3_float64][Position][3812258.1479555396 -189766.92490388086 5092820.672905484]>"), "Origin position is correct");
        }
    }
}
