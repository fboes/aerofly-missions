#!/usr/bin/env node

import * as fs from "node:fs/promises";
import { MainMcf } from "./Aerofly/MainMcf.js";
import { Mission } from "./Aerofly/Mission.js";
import { MissionsList } from "./Aerofly/MissionsList.js";
import { Arguments } from "./Cli/Arguments.js";
//import {GeoJson} from "./Export/GeoJson.js";

const args = new Arguments(process);

if (args.help) {
  process.stderr.write(args.helpText());
  process.exit(0);
}

const aeroflyConfig = new MainMcf(args.source);
const mission = new Mission(args.title, args.description).fromMainMcf(
  aeroflyConfig
);
mission.origin_dir = args.direction;

const missionList = new MissionsList(args.title);
missionList.missions.push(mission);

//console.log(JSON.stringify(new GeoJson(aeroflyConfig)));

try {
  await fs.writeFile(args.target, args.onlyMission ? mission.toString() : missionList.toString());
  process.stdout.write(args.target + " written successfully\n");
  process.exit(0);
} catch (err) {
  process.stderr.write(<string>err);
  process.exit(1);
}
