import * as fs from "node:fs";
import { Mission } from "../Aerofly/Mission.js";
import { Test } from "../Cli/Test.js";
import { MsfsPln } from "../Import/MsfsPln.js";
import { SimBrief } from "../Import/SimBrief.js";
export class SimBriefTest extends Test {
    constructor(process, dieOnError = false) {
        super(process, dieOnError);
        this.process = process;
        this.dieOnError = dieOnError;
        this.testMsfsStatic();
        this.testAeroflyStatic();
        this.testAeroflyStatic2();
    }
    static async init(process, dieOnError = false) {
        const self = new SimBriefTest(process, dieOnError);
        await self.testMsfsLive("fjboes");
        await self.testMsfsLive("746243");
        await self.testAeroflyLive("fjboes");
        await self.testAeroflyLive("746243");
        return self;
    }
    async testMsfsLive(username) {
        this.group(SimBrief.name + ".testMsfsLive(" + username + ")");
        const simBrief = new SimBrief();
        const msfsPln = await simBrief.fetchMsfs(username);
        this.assert(msfsPln !== "", "Response not empty");
        const pln = new MsfsPln(msfsPln);
        this.assert(pln !== null, "is valid MSFS PLN");
    }
    testMsfsStatic() {
        this.group(SimBrief.name + ".testMsfsStatic()");
        const msfsPln = fs.readFileSync("./src/Tests/fixtures/simbrief-mfs.pln", "utf8");
        this.assert(msfsPln !== "", "Response not empty");
        const pln = new MsfsPln(msfsPln);
        this.assert(pln !== null, "is valid MSFS PLN");
        const mission = new Mission("TEST", "TEST");
        mission.fromGarminFpl(pln);
        this.assertEquals(mission.checkpoints.length, 11);
        this.assertEquals(mission.origin_icao, "KEYW");
        this.assertEquals(mission.destination_icao, "KMIA");
        this.assertEquals(mission.checkpoints[0].name, mission.origin_icao);
        this.assertEquals(mission.checkpoints[mission.checkpoints.length - 1].name, mission.destination_icao);
    }
    async testAeroflyLive(username) {
        this.group(SimBrief.name + ".testAeroflyLive(" + username + ")");
        const simBrief = new SimBrief();
        const mission = await simBrief.fetchMission(username, new Mission("TEST", "TEST"));
        this.assert(mission !== null, "Response not empty");
    }
    testAeroflyStatic() {
        this.group(SimBrief.name + ".testAeroflyStatic()");
        const simBrief = new SimBrief();
        const simbriefPayload = fs.readFileSync("./src/Tests/fixtures/simbrief-api.json", "utf8");
        const simbriefPayloadJson = JSON.parse(simbriefPayload);
        const mission = simBrief.convertMission(simbriefPayloadJson, new Mission("TEST", "TEST"));
        this.assert(mission !== null, "Response not empty");
        //console.log(mission);
        this.assertEquals(mission.checkpoints.length, 13);
        this.assertEquals(mission.origin_icao, "KEYW");
        this.assertEquals(mission.destination_icao, "KMIA");
        this.assertEquals(mission.checkpoints[0].name, mission.origin_icao);
        this.assertEquals(mission.checkpoints[mission.checkpoints.length - 1].name, mission.destination_icao);
        this.assertEquals(mission.conditions.wind_speed, 5);
        this.assertEquals(mission.conditions.wind_gusts, 0);
        this.assertEquals(mission.conditions.wind_direction, 190);
        this.assertEquals(mission.conditions.cloud.cover, 0);
        this.assertEquals(mission.conditions.cloud.height, 0);
    }
    testAeroflyStatic2() {
        this.group(SimBrief.name + ".testAeroflyStatic2()");
        const simBrief = new SimBrief();
        const simbriefPayload = fs.readFileSync("./src/Tests/fixtures/simbrief-api2.json", "utf8");
        const simbriefPayloadJson = JSON.parse(simbriefPayload);
        const mission = simBrief.convertMission(simbriefPayloadJson, new Mission("TEST", "TEST"));
        this.assert(mission !== null, "Response not empty");
        this.assertEquals(mission.checkpoints.length, 9);
        this.assertEquals(mission.origin_icao, "KEYW");
        this.assertEquals(mission.destination_icao, "KMIA");
        this.assertEquals(mission.checkpoints[0].name, mission.origin_icao);
        this.assertEquals(mission.checkpoints[mission.checkpoints.length - 1].name, mission.destination_icao);
        this.assertEquals(mission.conditions.wind_speed, 10);
        this.assertEquals(mission.conditions.wind_gusts, 20);
        this.assertEquals(mission.conditions.wind_direction, 80);
        this.assertEquals(mission.conditions.cloud.cover, 0.125);
        this.assertEqualsRounded(mission.conditions.cloud.height, 1036, 0);
    }
}
