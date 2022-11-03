#!/usr/bin/env node
import * as fs from "node:fs/promises";
import { MainMcf } from "./Aerofly/MainMcf.js";
import { Mission } from "./Aerofly/Mission.js";
import { MissionsList } from "./Aerofly/MissionsList.js";
import { Arguments } from "./Cli/Arguments.js";
import { Flightplan } from "./Export/Flightplan.js";
import { GeoJson } from "./Export/GeoJson.js";
const args = new Arguments(process);
if (args.help) {
    process.stderr.write(args.helpText());
    process.exit(0);
}
const aeroflyConfig = new MainMcf(args.source);
try {
    aeroflyConfig.read();
}
catch (err) {
    process.stderr.write('\x1b[31m');
    process.stderr.write(err instanceof Error ? err.message : 'Unknown error');
    process.stderr.write('\x1b[0m\n');
    process.exit(1);
}
const mission = new Mission(args.title, args.description);
mission.origin_dir = args.direction;
mission.fromMainMcf(aeroflyConfig, args.ils);
if (mission.warnings) {
    mission.warnings.forEach(w => {
        process.stderr.write("> " + w + "\n");
    });
}
const missionList = new MissionsList(args.title);
missionList.missions.push(mission);
if (args.geoJson) {
    //console.log(JSON.stringify(new GeoJson().fromMainMcf(aeroflyConfig)));
    process.stdout.write(JSON.stringify(new GeoJson().fromMission(mission)));
}
if (args.flightplan) {
    process.stdout.write(new Flightplan(mission).toString());
}
try {
    await fs.writeFile(args.target, args.append ? mission.toString() : missionList.toString(), {
        flag: args.append ? 'a' : 'w'
    });
    process.stdout.write('\x1b[32m');
    process.stdout.write(args.target + " written successfully");
    process.stdout.write('\x1b[0m\n');
    process.exit(0);
}
catch (err) {
    process.stderr.write('\x1b[31m');
    process.stderr.write(err);
    process.stderr.write('\x1b[0m\n');
    process.exit(2);
}
