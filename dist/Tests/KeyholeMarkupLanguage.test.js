import { MissionFactory, Mission } from "../Aerofly/Mission.js";
import { Test } from "../Cli/Test.js";
import { KeyholeMarkupLanguage } from "../Export/KeyholeMarkupLanguage.js";
import * as fs from "node:fs";
export class KeyholeMarkupLanguageTest extends Test {
    constructor(process, dieOnError = false) {
        super(process, dieOnError);
        this.process = process;
        this.dieOnError = dieOnError;
        const mission = new MissionFactory().create(fs.readFileSync("./src/Tests/fixtures/kclm_kbli.tmc", "utf8"), new Mission("", ""));
        const kml = new KeyholeMarkupLanguage().fromMission(mission, true);
        this.group(KeyholeMarkupLanguage.name + ": Import mission");
        {
            this.assert(kml.toString() !== "", "Not empty KML");
            //console.log(kml.toString());
        }
    }
}
