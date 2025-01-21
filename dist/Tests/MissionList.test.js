import { MissionListParser } from "../Aerofly/MissionsList.js";
import { Test } from "../Cli/Test.js";
import * as fs from "node:fs";
export class MissionListTest extends Test {
    constructor(process, dieOnError = false) {
        super(process, dieOnError);
        this.process = process;
        this.dieOnError = dieOnError;
        this.group(MissionListParser.name);
        {
            const fileContent = fs.readFileSync("./src/Tests/fixtures/kclm_kbli.tmc", "utf8");
            const missionListParser = new MissionListParser(fileContent);
            const missionNames = missionListParser.getMissionNames();
            this.assertEquals(missionNames.length, 2);
            this.assertEquals(missionNames[0], "From KCLM to KBLI");
            this.assertEquals(missionNames[1], "Mount Teide awaits");
            const missons = missionListParser.getMissions();
            this.assertEquals(missons.length, 2);
            let mission = missionListParser.getMissionString(0);
            this.assert(mission !== "", "Mission not empty");
            mission = missionListParser.getMissionString(1);
            this.assert(mission !== "", "Mission not empty");
            mission = missionListParser.getMissionString(2);
            this.assert(mission === "", "Mission empty");
        }
    }
}
