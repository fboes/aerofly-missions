import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { MissionListParser } from "../Aerofly/MissionsList.js";
import * as fs from "node:fs";
describe("MissionListTest test", () => {
    it("should parse mission list correctly", () => {
        const fileContent = fs.readFileSync("./src/Tests/fixtures/kclm_kbli.tmc", "utf8");
        const missionListParser = new MissionListParser(fileContent);
        const missionNames = missionListParser.getMissionNames();
        assert.equal(missionNames.length, 2);
        assert.equal(missionNames[0], "From KCLM to KBLI");
        assert.equal(missionNames[1], "Mount Teide awaits");
        const missons = missionListParser.getMissions();
        assert.equal(missons.length, 2);
        let mission = missionListParser.getMissionString(0);
        assert.notEqual(mission, "", "Mission not empty");
        mission = missionListParser.getMissionString(1);
        assert.notEqual(mission, "", "Mission not empty");
        mission = missionListParser.getMissionString(2);
        assert.equal(mission, "", "Mission empty");
    });
});
