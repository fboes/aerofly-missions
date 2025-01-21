import * as fs from "node:fs";
import { Mission } from "../Aerofly/Mission.js";
import { Test } from "../Cli/Test.js";
import { MsfsPln } from "../Import/MsfsPln.js";
import { SimBrief } from "../Import/SimBrief.js";

export class SimBriefTest extends Test {
  constructor(protected process: NodeJS.Process, protected dieOnError = false) {
    super(process, dieOnError);
    this.testMsfsStatic();
    this.testAeroflyStatic();
  }

  static async init(process: NodeJS.Process, dieOnError = false): Promise<SimBriefTest> {
    const self = new SimBriefTest(process, dieOnError);
    await self.testMsfsLive();
    await self.testAeroflyLive();
    return self;
  }

  async testMsfsLive(): Promise<void> {
    this.group(SimBrief.name + ".testMsfsLive");
    const simBrief = new SimBrief();
    const msfsPln = await simBrief.fetchMsfs("fjboes");
    this.assert(msfsPln !== "", "Response not empty");

    const pln = new MsfsPln(msfsPln);
    this.assert(pln !== null, "is valid MSFS PLN");
  }

  testMsfsStatic(): void {
    this.group(SimBrief.name + ".testMsfsStatic");

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

  async testAeroflyLive(): Promise<void> {
    this.group(SimBrief.name + ".testAeroflyLive");

    const simBrief = new SimBrief();
    const mission = await simBrief.fetchMission("fjboes", new Mission("TEST", "TEST"));
    this.assert(mission !== null, "Response not empty");
  }

  testAeroflyStatic(): void {
    this.group(SimBrief.name + ".testAeroflyStatic");
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
  }
}
