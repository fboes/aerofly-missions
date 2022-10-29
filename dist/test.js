import { Tests } from "./Cli/Test.js";
import { LonLatTest } from "./Tests/LonLatTest.js";
import { MissionCheckpointTest } from "./Tests/MissionCheckpointTest.js";
import { MissionConditionsTest } from "./Tests/MissionConditionsTest.js";
import { MissionTest } from "./Tests/MissionTest.js";
const tests = new Tests(process);
tests.add(new LonLatTest(process));
tests.add(new MissionTest(process));
tests.add(new MissionCheckpointTest(process));
tests.add(new MissionConditionsTest(process));
tests.exit();
