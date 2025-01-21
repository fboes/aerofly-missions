import { Tests } from "./Cli/Test.js";
import { LonLatDateTest } from "./Tests/LonLatDate.test.js";
import { LonLatAreaTest, LonLatTest } from "./Tests/LonLat.test.js";
import { MissionCheckpointTest } from "./Tests/MissionCheckpoint.test.js";
import { MissionConditionsTest } from "./Tests/MissionConditions.test.js";
import { MissionTest } from "./Tests/Mission.test.js";
import { GarminFplTest } from "./Tests/GarminFpl.test.js";
import { MsfsPlnTest } from "./Tests/MsfsPln.test.js";
import { XplaneFmsTest } from "./Tests/XplaneFms.test.js";
import { MainMcfTest } from "./Tests/MainMcf.test.js";
import { GpxTest } from "./Tests/Gpx.test.js";
import { GeoJsonImportTest } from "./Tests/GeoJsonImport.test.js";
import { QuoteTest } from "./Tests/Quote.test.js";
import { MissionListTest } from "./Tests/MissionList.test.js";
import { SimBriefTest } from "./Tests/SimBrief.test.js";

const dieOnError = false;
const tests = new Tests(process);
tests.add(new LonLatTest(process, dieOnError));
tests.add(new LonLatAreaTest(process, dieOnError));
tests.add(new MainMcfTest(process, dieOnError));
tests.add(new MissionTest(process, dieOnError));
tests.add(new MissionListTest(process, dieOnError));
tests.add(new MissionCheckpointTest(process, dieOnError));
tests.add(new MissionConditionsTest(process, dieOnError));
tests.add(new LonLatDateTest(process, dieOnError));
tests.add(new GarminFplTest(process, dieOnError));
tests.add(new MsfsPlnTest(process, dieOnError));
tests.add(new XplaneFmsTest(process, dieOnError));
tests.add(new GpxTest(process, dieOnError));
tests.add(new GeoJsonImportTest(process, dieOnError));
tests.add(new QuoteTest(process, dieOnError));
tests.add(new SimBriefTest(process, dieOnError));
tests.exit();
