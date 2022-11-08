#!/usr/bin/env node

import * as fs from "node:fs/promises";
import { MainMcf } from "./Aerofly/MainMcf.js";
import { Mission } from "./Aerofly/Mission.js";
import { MissionsList } from "./Aerofly/MissionsList.js";
import { Arguments } from "./Cli/Arguments.js";
import { BashColors } from "./Cli/BashColors.js";
import { Flightplan } from "./Export/Flightplan.js";
import { GeoJson } from "./Export/GeoJson.js";

const args = new Arguments(process);
const c = new BashColors(args.useColors);

if (args.help) {
  process.stdout.write(args.helpText(c));
  process.exit(0);
}

const aeroflyConfig = new MainMcf(args.source);
try {
  aeroflyConfig.read();
} catch (err) {
  process.stderr.write(c.red + (err instanceof Error ? err.message : 'Unknown error') + c.reset);
  process.exit(1);
}

const mission = new Mission(args.title, args.description);
mission.origin_dir = args.direction;
mission.fromMainMcf(aeroflyConfig, args.ils);
if (mission.warnings) {
  mission.warnings.forEach(w => {
    process.stderr.write("> " + w + "\n");
  })
}


const missionList = new MissionsList(args.title);
missionList.missions.push(mission);

if (args.geoJson) {
  //console.log(JSON.stringify(new GeoJson().fromMainMcf(aeroflyConfig)));
  process.stdout.write(JSON.stringify(new GeoJson().fromMission(mission)));
}
if (args.flightplan) {
  process.stdout.write(new Flightplan(mission).toString(c));
}

try {
  await fs.writeFile(
    args.target,
    args.append ? mission.toString() : missionList.toString(), {
    flag: args.append ? 'a' : 'w'
  });
  process.stdout.write(c.green + args.target + " written successfully" + c.reset);
  process.exit(0);
} catch (err) {
  process.stderr.write(c.red + <string>err + c.reset);
  process.exit(2);
}
