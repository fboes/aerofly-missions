#!/usr/bin/env node

import * as fs from "node:fs/promises";
import { MainMcf } from "./Aerofly/MainMcf.js";
import { Mission } from "./Aerofly/Mission.js";
import { MissionsList } from "./Aerofly/MissionsList.js";
import { Arguments } from "./Cli/Arguments.js";
import { BashColors } from "./Cli/BashColors.js";
import { Flightplan } from "./Export/Flightplan.js";
import { GeoJson } from "./Export/GeoJson.js";
import { Markdown } from "./Export/Markdown.js";
import { SkyVector } from "./Export/SkyVector.js";
import { GarminFpl } from "./Import/GarminFpl.js";
import { SimBasePln } from "./Import/SimBasePln.js";

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
mission.fromMainMcf(aeroflyConfig, args.ils, args.magneticDeclination);
if (mission.warnings) {
  mission.warnings.forEach(w => {
    process.stderr.write("> " + w + "\n");
  })
}
if (args.garmin) {
  const fpl = new GarminFpl(args.garmin);
  try {
    fpl.read();
  } catch (err) {
    process.stderr.write(c.red + (err instanceof Error ? err.message : 'Unknown error') + c.reset);
    process.exit(1);
  }
  mission.fromGarminFpl(fpl, args.magneticDeclination);
}
if (args.msfs) {
  const fpl = new SimBasePln(args.msfs);
  try {
    fpl.read();
  } catch (err) {
    process.stderr.write(c.red + (err instanceof Error ? err.message : 'Unknown error') + c.reset);
    process.exit(1);
  }
  mission.fromGarminFpl(fpl, args.magneticDeclination);
}

const missionList = new MissionsList(args.title);
missionList.missions.push(mission);

if (args.geoJson) {
  const target = args.target.replace('.tmc', '') + '.json';
  try {
    await fs.writeFile(
      target,
      JSON.stringify(new GeoJson().fromMission(mission), null, 2)
    );
    process.stdout.write(c.green + target + " written successfully" + c.reset + "\n");
  } catch (err) {
    process.stderr.write(c.red + <string>err + c.reset);
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
    await fs.writeFile(
      target,
      new Markdown(mission).toString()
    );
    process.stdout.write(c.green + target + " written successfully" + c.reset + "\n");
  } catch (err) {
    process.stderr.write(c.red + <string>err + c.reset);
  }
}

try {
  await fs.writeFile(
    args.target,
    args.missionOnly ? mission.toString() : missionList.toString()
  );
  process.stdout.write(c.green + args.target + " written successfully" + c.reset + "\n");
  process.exit(0);
} catch (err) {
  process.stderr.write(c.red + <string>err + c.reset);
  process.exit(2);
}
