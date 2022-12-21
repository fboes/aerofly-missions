import { Tests } from "./Cli/Test.js";
import { LonLatDateTest } from "./Tests/LonLatDateTest.js";
import { LonLatTest } from "./Tests/LonLatTest.js";
import { MissionCheckpointTest } from "./Tests/MissionCheckpointTest.js";
import { MissionConditionsTest } from "./Tests/MissionConditionsTest.js";
import { MissionTest } from "./Tests/MissionTest.js";
import { GarminFplTest } from "./Tests/GarminFplTest.js";
import { MsfsPlnTest } from "./Tests/MsfsPlnTest.js";
import { XplaneFmsTest } from "./Tests/XplaneFmsTest.js";
import { MainMcfTest } from "./Tests/MainMcfTest.js";
import { GpxTest } from "./Tests/GpxTest.js";
import { GeoJsonTest } from "./Tests/GeoJsonTest.js";

const tests = new Tests(process);
tests.add(new LonLatTest(process));
tests.add(new MainMcfTest(process));
tests.add(new MissionTest(process));
tests.add(new MissionCheckpointTest(process));
tests.add(new MissionConditionsTest(process));
tests.add(new LonLatDateTest(process));
tests.add(new GarminFplTest(process));
tests.add(new MsfsPlnTest(process));
tests.add(new XplaneFmsTest(process));
tests.add(new GpxTest(process));
tests.add(new GeoJsonTest(process));
tests.exit();
