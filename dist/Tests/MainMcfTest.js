import { Test } from "../Cli/Test.js";
import { MainMcfFactory } from "../Aerofly/MainMcf.js";
import * as fs from "node:fs";
export class MainMcfTest extends Test {
    constructor(process) {
        super(process);
        this.group(MainMcfFactory.name);
        {
            const mainMcf = new MainMcfFactory().create(fs.readFileSync('./src/Tests/main.mcf', 'utf8'));
            this.assertEquals(mainMcf.aircraft.name, 'q400');
            this.assertEquals(mainMcf.navigation.Route.CruiseAltitude, 304.8);
            this.assertEquals(mainMcf.navigation.Route.Ways.length, 8);
            this.assertEquals(mainMcf.navigation.Route.Ways[0].type, 'origin');
            this.assertEquals(mainMcf.navigation.Route.Ways[1].type, 'departure_runway');
            this.assertEquals(mainMcf.navigation.Route.Ways[2].type, 'departure');
            this.assertEquals(mainMcf.navigation.Route.Ways[3].type, 'waypoint');
            this.assertEquals(mainMcf.navigation.Route.Ways[4].type, 'arrival');
            this.assertEquals(mainMcf.navigation.Route.Ways[5].type, 'approach');
            this.assertEquals(mainMcf.navigation.Route.Ways[6].type, 'destination_runway');
            this.assertEquals(mainMcf.navigation.Route.Ways[7].type, 'destination');
            this.assertEquals(mainMcf.wind.direction_in_degree, 130);
        }
    }
}
