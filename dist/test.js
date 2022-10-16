import { Tests } from "./Cli/Test.js";
import { LonLatTest } from "./Tests/LonLatTest.js";
import { MissionCheckpointTest } from "./Tests/MissionCheckpointTest.js";
import { MissionConditionsTest } from "./Tests/MissionConditionsTest.js";
import { MissionTest } from "./Tests/MissionTest.js";
const tests = new Tests(process);
tests.tests = [
    new LonLatTest(process),
    new MissionTest(process),
    new MissionCheckpointTest(process),
    new MissionConditionsTest(process)
];
tests.exit();
