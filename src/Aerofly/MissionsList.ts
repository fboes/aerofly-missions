import { Mission } from "./Mission.js";

export class MissionsList {
  missions: Mission[] = [];

  constructor(public title: string) {}

  toString(): string {
    return `<[file][][]
    <[tmmissions_list][][]
        <[list_tmmission_definition][missions][]
// -----------------------------------------------------------------------------
${this.missions.join("")}        >
    >
>
`;
  }
}
