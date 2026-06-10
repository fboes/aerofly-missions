import { FileParser } from "./FileParser.js";
export class MissionsList {
    title;
    missions = [];
    constructor(title) {
        this.title = title;
    }
    toString() {
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
    configFileContent;
    constructor(configFileContent) {
        super();
        this.configFileContent = configFileContent;
    }
    getMissionNames() {
        return this.getValues(this.configFileContent, "title");
    }
    getMissions() {
        return this.getGroups(this.configFileContent, "tmmission_definition", 3);
    }
    getMissionString(index) {
        const missions = this.getMissions();
        return missions[index] ?? "";
    }
}
