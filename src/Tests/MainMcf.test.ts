import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

import { MainMcfFactory } from "../Aerofly/MainMcf.js";
import * as fs from "node:fs";

describe("MainMcfTest test", () => {
  it("should load main.mcf correctly", () => {
    const mainMcf = new MainMcfFactory().create(fs.readFileSync("./src/Tests/fixtures/main.mcf", "utf8"));
    assert.equal(mainMcf.aircraft.name, "q400");
    assert.equal(mainMcf.navigation.Route.CruiseAltitude, 304.8);
    assert.equal(mainMcf.navigation.Route.Ways.length, 8);
    assert.equal(mainMcf.navigation.Route.Ways[0].type, "origin");
    assert.equal(mainMcf.navigation.Route.Ways[1].type, "departure_runway");
    assert.equal(mainMcf.navigation.Route.Ways[2].type, "departure");
    assert.equal(mainMcf.navigation.Route.Ways[3].type, "waypoint");
    assert.equal(mainMcf.navigation.Route.Ways[4].type, "arrival");
    assert.equal(mainMcf.navigation.Route.Ways[5].type, "approach");
    assert.equal(mainMcf.navigation.Route.Ways[6].type, "destination_runway");
    assert.equal(mainMcf.navigation.Route.Ways[7].type, "destination");

    assert.equal(mainMcf.wind.direction_in_degree, 130);
  });
});
