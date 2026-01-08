import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { MissionFactory, Mission } from "../Aerofly/Mission.js";
import { KeyholeMarkupLanguage } from "../Export/KeyholeMarkupLanguage.js";
import * as fs from "node:fs";
describe("KeyholeMarkupLanguageTest test", () => {
    it("should export to KML correctly", () => {
        const mission = new MissionFactory().create(fs.readFileSync("./src/Tests/fixtures/kclm_kbli.tmc", "utf8"), new Mission("", ""));
        const kml = new KeyholeMarkupLanguage().fromMission(mission, true);
        assert.notEqual(kml.toString(), "", "Not empty KML");
        //console.log(kml.toString());
    });
});
