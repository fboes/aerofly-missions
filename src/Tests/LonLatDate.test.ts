import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { assertEqualsRounded } from "../Cli/Test.js";

import { LonLat } from "../World/LonLat.js";
import { LonLatDate } from "../World/LonLatDate.js";

describe("LonLatDate Tests", () => {
  it("should do the basic calculations right", () => {
    const lonLat = new LonLat(0, 0);

    let lonLatDate = new LonLatDate(lonLat, new Date(Date.UTC(2022, 0, 1, 0, 0)));
    assert.equal(lonLatDate.dayOfYear, 1);

    lonLatDate = new LonLatDate(lonLat, new Date(Date.UTC(2016, 2, 1, 0, 0)));
    assert.equal(lonLatDate.dayOfYear, 61);

    lonLatDate = new LonLatDate(lonLat, new Date(Date.UTC(2016, 5, 1, 0, 0)));
    assert.equal(lonLatDate.dayOfYear, 153);
  });

  it("should do Sydney calculations correctly", () => {
    const lonLat = new LonLat(150 + 15, 30);
    const date = new Date(Date.UTC(2022, 0, 12, 12 - 11, 0));

    const lonLatDate = new LonLatDate(lonLat, date);

    assert.equal(lonLatDate.dayOfYear, 12);
    assert.equal(lonLatDate.solarTimeZoneOffset, 11);
    assertEqualsRounded(lonLatDate.localTime, 12, 2);
    assertEqualsRounded(lonLatDate.localSolarTimeMeridian, 165, 2);
    assertEqualsRounded((lonLatDate.sunDeclination * 180) / Math.PI, -21.75, 2);
    assertEqualsRounded(lonLatDate.equationOfTime, -8.27, 2);
    assertEqualsRounded(lonLatDate.timeCorrectionFactor, -8.27, 2);
    assertEqualsRounded(lonLatDate.localSolarTime, 11.86, 2);
    assertEqualsRounded((lonLatDate.hourAngle * 180) / Math.PI, -2.07, 2);
    assertEqualsRounded((lonLatDate.solarElevationAngle * 180) / Math.PI, 38.21, 2);
    assert.equal(lonLatDate.sunState.sunState, "Day");
  });

  it("should do New York calculations correctly", () => {
    const lonLat = new LonLat(-75, 40);
    const date = new Date(Date.UTC(2022, 6, 4, 12 + 5, 0));

    const lonLatDate = new LonLatDate(lonLat, date);

    assert.equal(lonLatDate.dayOfYear, 185);
    assert.equal(lonLatDate.solarTimeZoneOffset, -5);
    assertEqualsRounded(lonLatDate.localTime, 12, 2);
    assertEqualsRounded(lonLatDate.localSolarTimeMeridian, -75, 2);
    assertEqualsRounded((lonLatDate.sunDeclination * 180) / Math.PI, 22.89, 2);
    assertEqualsRounded(lonLatDate.equationOfTime, -4.02, 2);
    assertEqualsRounded(lonLatDate.timeCorrectionFactor, -4.02, 2);
    assertEqualsRounded(lonLatDate.localSolarTime, 11.93, 2); // ?
    assertEqualsRounded((lonLatDate.hourAngle * 180) / Math.PI, -1, 2);
    assertEqualsRounded((lonLatDate.solarElevationAngle * 180) / Math.PI, 72.87, 2);
    assert.equal(lonLatDate.sunState.sunState, "Day");
  });

  it("should calculate dusk till dawn", () => {
    const lonLat = new LonLat(-75, 40);

    const date = new Date(Date.UTC(2022, 6, 4, 2 + 5, 0));
    const lonLatDate = new LonLatDate(lonLat, date);
    assert.equal(lonLatDate.sunState.sunState, "Night");
    assert.equal(lonLatDate.sunState.localSolarTime, "01:55");
    assert.equal(lonLatDate.sunState.localTime, "02:00");

    lonLatDate.date = new Date(Date.UTC(2022, 6, 4, 3 + 5, 0));
    assert.equal(lonLatDate.sunState.sunState, "Night");

    lonLatDate.date = new Date(Date.UTC(2022, 6, 4, 4 + 5, 0));
    assert.equal(lonLatDate.sunState.sunState, "Night");

    lonLatDate.date = new Date(Date.UTC(2022, 6, 4, 4 + 5, 30));
    assert.equal(lonLatDate.sunState.sunState, "Dusk");

    lonLatDate.date = new Date(Date.UTC(2022, 6, 4, 5 + 5, 0));
    assert.equal(lonLatDate.sunState.sunState, "Day");

    lonLatDate.date = new Date(Date.UTC(2022, 6, 4, 19 + 5, 0));
    assert.equal(lonLatDate.sunState.sunState, "Day");

    lonLatDate.date = new Date(Date.UTC(2022, 6, 4, 19 + 5, 40));
    assert.equal(lonLatDate.sunState.sunState, "Dawn");

    lonLatDate.date = new Date(Date.UTC(2022, 6, 4, 20 + 5, 15));
    assert.equal(lonLatDate.sunState.sunState, "Night");
  });
});
