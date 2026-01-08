import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { assertEqualsRounded } from "../Cli/Test.js";

import * as fs from "node:fs";
import { Mission } from "../Aerofly/Mission.js";
import { MsfsPln } from "../Import/MsfsPln.js";
import { SimBrief } from "../Import/SimBrief.js";

describe("SimBriefTest test", () => {
  it("should fetch MSFS PLN", { skip: "Can only be executed after filing a flight plan" }, async () => {
    for (const username of ["fjboes", "746243"]) {
      const simBrief = new SimBrief();
      const msfsPln = await simBrief.fetchMsfs(username);
      assert.notEqual(msfsPln, "", "Response not empty");

      const pln = new MsfsPln(msfsPln);
      assert.notEqual(pln, null, "is valid MSFS PLN");
    }
  });

  it("should fetch JSON", { skip: "Can only be executed after filing a flight plan" }, async () => {
    for (const username of ["fjboes", "746243"]) {
      const simBrief = new SimBrief();
      const mission = await simBrief.fetchMission(username, new Mission("TEST", "TEST"));
      assert.notEqual(mission, null, "Response not empty");
    }
  });

  it("should parse MSFS PLN correctly", () => {
    const msfsPln = fs.readFileSync("./src/Tests/fixtures/simbrief-mfs.pln", "utf8");
    assert.notEqual(msfsPln, "", "Response not empty");

    const pln = new MsfsPln(msfsPln);
    assert.notEqual(pln, null, "is valid MSFS PLN");

    const mission = new Mission("TEST", "TEST");
    mission.fromGarminFpl(pln);

    assert.equal(mission.checkpoints.length, 11);
    assert.equal(mission.origin_icao, "KEYW");
    assert.equal(mission.destination_icao, "KMIA");
    assert.equal(mission.checkpoints[0].name, mission.origin_icao);
    assert.equal(mission.checkpoints[mission.checkpoints.length - 1].name, mission.destination_icao);
  });

  it("should parse Aerofly static mission correctly", () => {
    const simBrief = new SimBrief();
    const simbriefPayload = fs.readFileSync("./src/Tests/fixtures/simbrief-api.json", "utf8");
    const simbriefPayloadJson = JSON.parse(simbriefPayload);

    const mission = simBrief.convertMission(simbriefPayloadJson, new Mission("TEST", "TEST"));
    assert.notEqual(mission, null, "Response not empty");
    //console.log(mission);

    assert.equal(mission.checkpoints.length, 13);
    assert.equal(mission.origin_icao, "KEYW");
    assert.equal(mission.destination_icao, "KMIA");
    assert.equal(mission.checkpoints[0].name, mission.origin_icao);
    assert.equal(mission.checkpoints[0].icao_region, "K7");
    assert.equal(mission.checkpoints[2].name, "CARNU");
    assert.equal(mission.checkpoints[2].icao_region, "K7");
    assert.equal(mission.checkpoints[3].name, "SNDBR");
    assert.equal(mission.checkpoints[3].icao_region, "K7");
    assert.equal(mission.checkpoints[mission.checkpoints.length - 1].name, mission.destination_icao);
    assert.equal(mission.conditions.wind_speed, 5);
    assert.equal(mission.conditions.wind_gusts, 0);
    assert.equal(mission.conditions.wind_direction, 190);
    assert.equal(mission.conditions.cloud.cover, 0);
    assert.equal(mission.conditions.cloud.height, 0);
  });

  it("should parse Aerofly static mission with destination override correctly", () => {
    const simBrief = new SimBrief();
    const simbriefPayload = fs.readFileSync("./src/Tests/fixtures/simbrief-api.json", "utf8");
    const simbriefPayloadJson = JSON.parse(simbriefPayload);

    const mission = simBrief.convertMission(simbriefPayloadJson, new Mission("TEST", "TEST"), true);
    assert.equal(mission.conditions.wind_speed, 8);
    assert.equal(mission.conditions.wind_gusts, 0);
    assert.equal(mission.conditions.wind_direction, 190);
    assert.equal(mission.conditions.cloud.cover, 0);
    assert.equal(mission.conditions.cloud.height, 0);
  });

  it("should parse Aerofly static mission 2 correctly", () => {
    const simBrief = new SimBrief();
    const simbriefPayload = fs.readFileSync("./src/Tests/fixtures/simbrief-api2.json", "utf8");
    const simbriefPayloadJson = JSON.parse(simbriefPayload);

    const mission = simBrief.convertMission(simbriefPayloadJson, new Mission("TEST", "TEST"));
    assert.notEqual(mission, null, "Response not empty");

    assert.equal(mission.checkpoints.length, 9);
    assert.equal(mission.origin_icao, "KEYW");
    assert.equal(mission.destination_icao, "KMIA");
    assert.equal(mission.checkpoints[0].name, mission.origin_icao);
    assert.equal(mission.checkpoints[mission.checkpoints.length - 1].name, mission.destination_icao);
    assert.equal(mission.conditions.wind_speed, 10);
    assert.equal(mission.conditions.wind_gusts, 20);
    assert.equal(mission.conditions.wind_direction, 80);
    assert.equal(mission.conditions.cloud.cover, 0.125);
    assertEqualsRounded(mission.conditions.cloud.height, 1036, 0);
  });

  it("should parse Aerofly static mission 2 with destination override correctly", () => {
    const simBrief = new SimBrief();
    const simbriefPayload = fs.readFileSync("./src/Tests/fixtures/simbrief-api2.json", "utf8");
    const simbriefPayloadJson = JSON.parse(simbriefPayload);

    const mission = simBrief.convertMission(simbriefPayloadJson, new Mission("TEST", "TEST"), true);
    assert.equal(mission.conditions.wind_speed, 9);
    assert.equal(mission.conditions.wind_gusts, 0);
    assert.equal(mission.conditions.wind_direction, 100);
    assert.equal(mission.conditions.cloud.cover, 0.125);
    assertEqualsRounded(mission.conditions.cloud.height, 762, 0);
  });
});
