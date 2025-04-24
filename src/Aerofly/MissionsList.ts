import { FileParser } from "./FileParser.js";
import { Mission } from "./Mission.js";

export class MissionsList {
  missions: Mission[] = [];

  constructor(public title: string) {}

  toString(): string {
    return `\
<[file][][]
    <[tmmissions_list][][]
        <[list_tmmission_definition][missions][]
// -----------------------------------------------------------------------------
${this.missions.join("")}\
        >
    >
>
`;
  }
}

export class MissionListParser extends FileParser {
  constructor(protected configFileContent: string) {
    super();
  }

  getMissionNames(): string[] {
    return this.getValues(this.configFileContent, "title");
  }

  getMissions(): string[] {
    return this.getGroups(this.configFileContent, "tmmission_definition", 3);
  }

  getMissionString(index: number): string {
    const missions = this.getMissions();
    return missions[index] ?? "";
  }
}
