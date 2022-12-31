import { Test } from "../Cli/Test.js";
import { MainMcfFactory } from "../Aerofly/MainMcf.js";
import * as fs from "node:fs";
export class MainMcfTest extends Test {
    constructor(process) {
        super(process);
        this.group(MainMcfFactory.name);
        {
            const mainMcf = new MainMcfFactory().create(fs.readFileSync('./src/Tests/main.mcf', 'utf8'));
            this.assertEquals(mainMcf.aircraft.name, 'p38');
            this.assertEquals(mainMcf.navigation.Route.Ways.length, 13);
        }
    }
}
