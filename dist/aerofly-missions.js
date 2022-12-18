#!/usr/bin/env node
import * as fs from "node:fs";
import { MainMcf } from "./Aerofly/MainMcf.js";
import { Mission, MissionParsed } from "./Aerofly/Mission.js";
import { MissionsList } from "./Aerofly/MissionsList.js";
import { Arguments } from "./Cli/Arguments.js";
import { BashColors } from "./Cli/BashColors.js";
import { Flightplan } from "./Export/Flightplan.js";
import { GeoJson } from "./Export/GeoJson.js";
import { Markdown } from "./Export/Markdown.js";
import { SkyVector } from "./Export/SkyVector.js";
import { GarminFpl } from "./Import/GarminFpl.js";
import { MsfsPln } from "./Import/MsfsPln.js";
import { XplaneFms } from "./Import/XplaneFms.js";
const args = new Arguments(process);
const c = new BashColors(args.useColors);
if (args.help) {
    process.stdout.write(args.helpText(c));
    process.exit(0);
}
const aeroflyConfig = new MainMcf(fs.readFileSync(args.source, "utf8"));
const mission = new Mission(args.title, args.description);
mission.origin_dir = args.direction;
mission.fromMainMcf(aeroflyConfig, args.ils, args.magneticDeclination);
if (mission.warnings) {
    mission.warnings.forEach(w => {
        process.stderr.write("> " + w + "\n");
    });
}
if (args.garmin) {
    const fpl = new GarminFpl(fs.readFileSync(args.garmin, "utf8"));
    mission.fromGarminFpl(fpl, args.magneticDeclination);
}
if (args.msfs) {
    const fpl = new MsfsPln(fs.readFileSync(args.msfs, "utf8"));
    mission.fromGarminFpl(fpl, args.magneticDeclination);
}
if (args.xplane) {
    const fpl = new XplaneFms(fs.readFileSync(args.xplane, "utf8"));
    mission.fromGarminFpl(fpl, args.magneticDeclination);
}
if (args.tmc) {
    new MissionParsed(fs.readFileSync(args.tmc, "utf8"), mission);
}
const missionList = new MissionsList(args.title);
missionList.missions.push(mission);
if (args.geoJson) {
    const target = args.target.replace('.tmc', '') + '.json';
    try {
        fs.writeFileSync(target, JSON.stringify(new GeoJson().fromMission(mission), null, 2));
        process.stdout.write(c.green + target + " written successfully" + c.reset + "\n");
    }
    catch (err) {
        process.stderr.write(c.red + err + c.reset);
    }
}
if (args.flightplan) {
    process.stdout.write("\n" + new Flightplan(mission, c).toString() + "\n");
}
if (args.skyVector) {
    process.stdout.write("\n" + new SkyVector(mission).toString() + "\n");
}
if (args.markdown) {
    const target = args.target.replace('.tmc', '') + '.md';
    try {
        fs.writeFileSync(target, new Markdown(mission).toString());
        process.stdout.write(c.green + target + " written successfully" + c.reset + "\n");
    }
    catch (err) {
        process.stderr.write(c.red + err + c.reset);
    }
}
try {
    fs.writeFileSync(args.target, args.missionOnly ? mission.toString() : missionList.toString());
    process.stdout.write(c.green + args.target + " written successfully" + c.reset + "\n");
    process.exit(0);
}
catch (err) {
    process.stderr.write(c.red + err + c.reset);
    process.exit(2);
}
