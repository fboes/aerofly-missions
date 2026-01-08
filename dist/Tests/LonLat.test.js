import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { assertEqualsRounded } from "../Cli/Test.js";
import { LonLat, LonLatArea } from "../World/LonLat.js";
describe("LonLatTest test", () => {
    it("should handle properties and methods correctly", () => {
        const lonLat = new LonLat(50, 100);
        assert.equal(lonLat.lon, 50, "Longitude matching");
        assert.equal(lonLat.lat, 100, "Latitude matching");
    });
    it("should calculate cardinal bearings correctly", () => {
        const lonLat = new LonLat(0, 0);
        assert.equal(lonLat.getBearingTo(new LonLat(0, 90)), 0);
        assert.equal(lonLat.getBearingTo(new LonLat(90, 0)), 90);
        assert.equal(lonLat.getBearingTo(new LonLat(0, -90)), 180);
        assert.equal(lonLat.getBearingTo(new LonLat(-90, 0)), 270);
    });
    it("should calculate distances correctly", () => {
        const lonLat = new LonLat(0, 0);
        assertEqualsRounded(lonLat.getDistanceTo(new LonLat(0, 1)), 60.1, 1);
        assertEqualsRounded(lonLat.getDistanceTo(new LonLat(1, 0)), 60.1, 1);
        assertEqualsRounded(lonLat.getDistanceTo(new LonLat(0, -1)), 60.1, 1);
        assertEqualsRounded(lonLat.getDistanceTo(new LonLat(-1, 0)), 60.1, 1);
    });
    it("should calculate bearings and distances correctly", () => {
        const lonLat = new LonLat(45, 35);
        const lonLat2 = new LonLat(135, 35);
        assertEqualsRounded(lonLat.getBearingTo(lonLat2), 60, 0, "Bearing matches");
        assertEqualsRounded(lonLat.getDistanceTo(lonLat2), 4252, 0, "Distance matches");
    });
    it("should calculate bearings and distances correctly for another set", () => {
        const lonLat = new LonLat(-80.379414, 25.489981);
        const lonLat2 = new LonLat(-80.279153, 25.320653);
        assertEqualsRounded(lonLat.getBearingTo(lonLat2), 152, 0, "Bearing matches");
        assertEqualsRounded(lonLat.getDistanceTo(lonLat2), 12, 0, "Distance matches");
    });
    it("should calculate relative coordinates correctly", () => {
        const lonLat = new LonLat(-80.379414, 25.489981);
        const lonLat2 = new LonLat(80.279153, -25.320653);
        const lonLat3 = lonLat.getRelativeCoordinates(lonLat.getDistanceTo(lonLat2), lonLat.getBearingTo(lonLat2));
        assertEqualsRounded(lonLat2.lat, lonLat3.lat, 5);
        assertEqualsRounded(lonLat2.lon, lonLat3.lon, 5);
    });
    it("should convert to nav string correctly", () => {
        const lonLat = new LonLat(-115.1159, 36.0351);
        const lat = lonLat.latMinute;
        const lon = lonLat.lonMinute;
        assert.equal(lat.degree, 36);
        assert.equal(lat.minutes, 2);
        assertEqualsRounded(lat.secondsDecimal, 6.36, 2);
        assertEqualsRounded(lat.seconds, 6, 2);
        assert.equal(lonLat.latHemisphere, "N");
        assert.equal(lon.degree, -115);
        assert.equal(lon.minutes, 6);
        assertEqualsRounded(lon.secondsDecimal, 57.24, 2);
        assertEqualsRounded(lon.seconds, 57, 2);
        assert.equal(lonLat.lonHemisphere, "W");
        assert.equal(lonLat.toNavString(), "360206N1150657W");
    });
});
describe("LonLatAreaTest test", () => {
    it("should handle properties and methods correctly", () => {
        const lla = new LonLatArea(new LonLat(0, 0));
        lla.push(new LonLat(-180, -90));
        lla.push(new LonLat(180, 90));
        lla.push(new LonLat(10, 10));
        const center = lla.center;
        assert.equal(center.lon, 0);
        assert.equal(center.lat, 0);
        assert.equal(lla.lonRange, 360);
        assert.equal(lla.latRange, 180);
        assertEqualsRounded(lla.getMaxRange(1 / 2), 720, 2);
        assertEqualsRounded(lla.getMaxRange(1 / 1), 360, 2);
        assertEqualsRounded(lla.getMaxRange(2 / 1), 360, 2);
        assert.equal(lla.getZoomLevel(), 4);
    });
    it("should handle more properties and methods correctly", () => {
        const lla = new LonLatArea(new LonLat(-4.53, 53.25));
        lla.push(new LonLat(-3.68, 52.7));
        lla.push(new LonLat(-3.85, 52.6));
        lla.push(new LonLat(-4.16, 53.22));
        const center = lla.center;
        assert.equal(center.lon, -4.105);
        assert.equal(center.lat, 52.925);
        assertEqualsRounded(lla.lonRange, 0.85, 2);
        assertEqualsRounded(lla.latRange, 0.65, 2);
        assertEqualsRounded(lla.getMaxRange(1 / 2), 1.7, 2);
        assertEqualsRounded(lla.getMaxRange(1 / 1), 0.85, 2);
        assertEqualsRounded(lla.getMaxRange(2 / 1), 1.3, 2);
        assert.equal(lla.getZoomLevel(), 9); // 9
        lla.push(new LonLat(-4.6, 53.32));
        assertEqualsRounded(lla.lonRange, 0.92, 2);
        assertEqualsRounded(lla.latRange, 0.72, 2);
        assertEqualsRounded(lla.getMaxRange(1 / 2), 1.84, 2);
        assertEqualsRounded(lla.getMaxRange(1 / 1), 0.92, 2);
        assertEqualsRounded(lla.getMaxRange(2 / 1), 1.44, 2);
        assert.equal(lla.getZoomLevel(), 9); // 9
    });
    it("should handle even more properties and methods correctly", () => {
        const lla = new LonLatArea(new LonLat(-119.86, 39.66));
        lla.push(new LonLat(-119.86, 39.68));
        lla.push(new LonLat(-119.88, 39.71));
        lla.push(new LonLat(-119.9, 39.67));
        const center = lla.center;
        assert.equal(center.lon, -119.88);
        assert.equal(center.lat, 39.685);
        assertEqualsRounded(lla.lonRange, 0.04, 2);
        assertEqualsRounded(lla.latRange, 0.05, 2);
        assertEqualsRounded(lla.getMaxRange(1 / 2), 0.08, 2);
        assertEqualsRounded(lla.getMaxRange(1 / 1), 0.05, 2);
        assertEqualsRounded(lla.getMaxRange(2 / 1), 0.1, 2);
        assert.equal(lla.getZoomLevel(), 15); // 14
    });
    it("should handle yet more properties and methods correctly", () => {
        const lla = new LonLatArea(new LonLat(-119.84, 34.42));
        lla.push(new LonLat(-119.77, 34.51));
        lla.push(new LonLat(-120.09, 34.53));
        const center = lla.center;
        assert.equal(center.lon, -119.93);
        assert.equal(center.lat, 34.475);
        assertEqualsRounded(lla.lonRange, 0.32, 2);
        assertEqualsRounded(lla.latRange, 0.11, 2);
        assertEqualsRounded(lla.getMaxRange(1 / 2), 0.64, 2);
        assertEqualsRounded(lla.getMaxRange(1 / 1), 0.32, 2);
        assertEqualsRounded(lla.getMaxRange(2 / 1), 0.32, 2);
        assert.equal(lla.getZoomLevel(), 12); // 12-11
    });
    it("should handle even yet more properties and methods correctly", () => {
        const lla = new LonLatArea(new LonLat(-2.28, 53.35));
        lla.push(new LonLat(8.54, 50.03));
        const center = lla.center;
        assert.equal(center.lon, 3.13);
        assert.equal(center.lat, 51.69);
        assertEqualsRounded(lla.lonRange, 10.82, 2);
        assertEqualsRounded(lla.latRange, 3.32, 2);
        assertEqualsRounded(lla.getMaxRange(1 / 2), 21.64, 2);
        assertEqualsRounded(lla.getMaxRange(1 / 1), 10.82, 2);
        assertEqualsRounded(lla.getMaxRange(2 / 1), 10.82, 2);
        assert.equal(lla.getZoomLevel(), 6); // 6
    });
});
