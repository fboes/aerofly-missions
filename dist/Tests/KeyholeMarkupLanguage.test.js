import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { MissionFactory, Mission } from "../Aerofly/Mission.js";
import { KeyholeMarkupLanguage } from "../Export/KeyholeMarkupLanguage.js";
import { readFileFromRoot } from "./getRootDir.js";
describe("KeyholeMarkupLanguageTest test", () => {
    it("should export to KML correctly", () => {
        const mission = new MissionFactory().create(readFileFromRoot("./src/Tests/fixtures/kclm_kbli.tmc"), new Mission("", ""));
        const kml = new KeyholeMarkupLanguage().fromMission(mission, true);
        assert.notEqual(kml.toString(), "", "Not empty KML");
        //console.log(kml.toString());
    });
});
