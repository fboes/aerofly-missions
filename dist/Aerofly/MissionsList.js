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
