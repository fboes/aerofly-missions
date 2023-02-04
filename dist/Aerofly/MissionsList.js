import { FileParser } from "./FileParser.js";
export class MissionsList {
    constructor(title) {
        this.title = title;
        this.missions = [];
    }
    toString() {
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
export class MissionListParser extends FileParser {
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
        var _a;
        const missions = this.getMissions();
        return (_a = missions[index]) !== null && _a !== void 0 ? _a : "";
    }
}
