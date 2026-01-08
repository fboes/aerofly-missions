import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { assertEqualsRounded } from "../Cli/Test.js";
import { MissionConditions } from "../Aerofly/MissionConditions.js";
describe("MissionConditionsTest test", () => {
    it("should handle mission conditions percentages correctly", () => {
        const missionConditions = new MissionConditions();
        assert.equal(missionConditions.cloud.height, 0);
        assert.equal(missionConditions.cloud.cover, 0);
        assert.equal(missionConditions.wind_speed, 0);
        assert.equal(missionConditions.visibility, 20000);
        missionConditions.visibility_percent = 1;
        assert.equal(missionConditions.visibility, 15000, "Visbility percentage test");
        missionConditions.visibility_percent = 0.5;
        assert.equal(missionConditions.visibility, 15000 / 2, "Visbility percentage test");
        missionConditions.visibility_percent = 0;
        assert.equal(missionConditions.visibility, 0, "Visbility percentage test");
        missionConditions.clouds[0].height_percent = 1;
        assert.ok(missionConditions.cloud.height > 3000, "Cloud base percentage test");
        missionConditions.clouds[0].height_percent = 0;
        assert.equal(missionConditions.cloud.height, 0, "Cloud base percentage test");
        missionConditions.wind_speed_percent = 1;
        assert.equal(missionConditions.wind_speed, 16, "Wind speed percentage test");
        missionConditions.wind_speed_percent = 0.5;
        assert.equal(missionConditions.wind_speed, 6, "Wind speed percentage test");
        missionConditions.wind_speed_percent = 0;
        assert.equal(missionConditions.wind_speed, 0, "Wind speed percentage test");
    });
    /**
     * @see https://e6bx.com/e6b
     */
    it("should calculate wind correction correctly", () => {
        const missionConditions = new MissionConditions();
        missionConditions.wind_direction = 90;
        missionConditions.wind_speed = 23;
        const course = 320;
        const tas_kts = 100;
        const windCorrection = missionConditions.getWindCorrection((course / 180) * Math.PI, tas_kts);
        assertEqualsRounded(windCorrection.ground_speed, 113.22, 2);
        assertEqualsRounded(windCorrection.heading, 330.15, 2);
    });
    it("should calculate wind correction edge cases correctly", () => {
        const missionConditions = new MissionConditions();
        missionConditions.wind_direction = 90;
        missionConditions.wind_speed = 20;
        const course = 355;
        const tas_kts = 150;
        const windCorrection = missionConditions.getWindCorrection((course / 180) * Math.PI, tas_kts);
        assertEqualsRounded(windCorrection.ground_speed, 150.41, 2);
        assertEqualsRounded(windCorrection.heading, 2.63, 2);
    });
    it("should calculate wind correction edge cases correctly", () => {
        const missionConditions = new MissionConditions();
        missionConditions.wind_direction = 90;
        missionConditions.wind_speed = 20;
        const course = 90;
        const tas_kts = 150;
        const windCorrection = missionConditions.getWindCorrection((course / 180) * Math.PI, tas_kts);
        assert.equal(windCorrection.ground_speed, tas_kts - missionConditions.wind_speed);
        assert.equal(windCorrection.heading, course);
    });
    it("should calculate wind correction edge cases correctly", () => {
        const missionConditions = new MissionConditions();
        missionConditions.wind_direction = 270;
        missionConditions.wind_speed = 20;
        const course = 90;
        const tas_kts = 150;
        const windCorrection = missionConditions.getWindCorrection((course / 180) * Math.PI, tas_kts);
        assert.equal(windCorrection.ground_speed, tas_kts + missionConditions.wind_speed);
        assert.equal(windCorrection.heading, course);
    });
    it("should determine flight category correctly", () => {
        const missionConditions = new MissionConditions();
        missionConditions.visibility_percent = 1;
        assert.equal(missionConditions.getFlightCategory(), "VFR");
        missionConditions.visibility_percent = 0.5;
        assert.equal(missionConditions.getFlightCategory(), "MVFR");
        missionConditions.visibility_percent = 0.3;
        assert.equal(missionConditions.getFlightCategory(), "IFR");
        missionConditions.visibility_percent = 0.1;
        assert.equal(missionConditions.getFlightCategory(), "LIFR");
    });
    it("should determine flight category from clouds correctly", () => {
        const missionConditions = new MissionConditions();
        missionConditions.cloud.height = 0;
        missionConditions.cloud.cover = 0;
        assert.equal(missionConditions.getFlightCategory(), "VFR");
        missionConditions.cloud.height = 5000;
        missionConditions.cloud.cover = 0.1;
        assert.equal(missionConditions.getFlightCategory(), "VFR");
        missionConditions.cloud.height = 1000;
        missionConditions.cloud.cover = 0.5;
        assert.equal(missionConditions.getFlightCategory(), "VFR");
        missionConditions.cloud.height = 800;
        missionConditions.cloud.cover = 0.6;
        assert.equal(missionConditions.getFlightCategory(), "MVFR");
    });
});
