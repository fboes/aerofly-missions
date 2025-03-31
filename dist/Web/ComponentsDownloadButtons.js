import { MissionsList } from "../Aerofly/MissionsList.js";
import { asciify } from "../Cli/Arguments.js";
import { GeoJson } from "../Export/GeoJson.js";
import { Markdown } from "../Export/Markdown.js";
import { GarminExport } from "../Import/GarminFpl.js";
import { GeoFsExport } from "../Import/GeoFs.js";
import { Msfs2024Export, MsfsPlnExport } from "../Import/MsfsPln.js";
import { XplaneFmsExport } from "../Import/XplaneFms.js";
import { StatEvent } from "./StatEvent.js";
export class ComponentsDownloadButtons extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `\
<button type="button" class="primary" data-filesuffix=".tmc">Download Aerofly FS <code>custom_missions_user.tmc</code> flight plan</button>
<button type="button" data-filesuffix=".pln">Download Microsoft FS 2020 <code>custom_missions.pln</code> flight plan</button>
<details>
  <summary>More download options…</summary>
  <button type="button" data-filesuffix=".2024.pln">Download Microsoft FS 2024 <code>custom_missions.2024.pln</code> flight plan</button>
  <button type="button" data-filesuffix=".fms">Download X-Plane <code>custom_missions.fms</code> flight plan</button>
  <button type="button" data-filesuffix=".geofs.json">Download GeoFS <code>custom_missions.geofs.json</code> flight plan</button>
  <button type="button" data-filesuffix=".fpl">Download Garmin / Infinite Flight <code>custom_missions.fpl</code> flight plan</button>
  <button type="button" class="expert-mode" data-filesuffix=".md">Download <code>custom_missions.md</code> documentation</button>
  <button type="button" class="expert-mode" data-filesuffix=".geojson">Download <code>custom_missions.geojson</code></button>
</details>
`;
    }
    connectedCallback() {
        this.draw();
        this.addEventListener("click", this);
    }
    disconnectedCallback() {
        this.removeEventListener("click", this);
    }
    get slug() {
        var _a;
        return ((_a = this.mission) === null || _a === void 0 ? void 0 : _a.title)
            ? asciify(this.mission.title.replace(/^(?:From )?(\S+) to (\S+)$/i, "$1-$2"))
            : "custom_missions";
    }
    handleEvent(e) {
        var _a;
        e.stopPropagation();
        if (!this.mission) {
            return;
        }
        const fileSuffix = (_a = e.target.closest("button").dataset.filesuffix) !== null && _a !== void 0 ? _a : ".tmc";
        const filename = this.slug + fileSuffix;
        switch (fileSuffix) {
            case ".geojson":
                this.download(filename, JSON.stringify(new GeoJson().fromMission(this.mission, true), null, 2), "application/geo+json");
                break;
            case ".md":
                this.download(filename, new Markdown(this.mission).toString(filename), "text/markdown");
                break;
            case ".pln":
                this.download(filename, new MsfsPlnExport(this.mission).toString());
                break;
            case ".2024.pln":
                this.download(filename, new Msfs2024Export(this.mission).toString());
                break;
            case ".fms":
                this.download(filename, new XplaneFmsExport(this.mission).toString());
                break;
            case ".geofs.json":
                this.download(filename, new GeoFsExport(this.mission).toString(), "application/json");
                break;
            case ".fpl":
                this.download(filename, new GarminExport(this.mission).toString());
                break;
            case ".tmc":
                const m = new MissionsList("");
                m.missions.push(this.mission);
                this.download(filename, m.toString());
                break;
        }
        document.body.dispatchEvent(StatEvent.createEvent("Export", "Download " + fileSuffix + " file"));
        document.body.dispatchEvent(StatEvent.createEvent("Mission", "Aircraft", this.mission.aircraft_name));
        document.body.dispatchEvent(StatEvent.createEvent("Mission", "Airport", this.mission.origin_icao));
        document.body.dispatchEvent(StatEvent.createEvent("Mission", "Airport", this.mission.destination_icao));
    }
    draw() {
        const filename = this.slug;
        this.querySelectorAll("button").forEach((b) => {
            b.disabled = !this.mission || this.mission.checkpoints.length <= 0;
        });
        this.querySelectorAll("code").forEach((el) => {
            const fileSuffix = el.closest("button").dataset.filesuffix;
            el.innerText = filename + fileSuffix;
        });
    }
    download(filename, content, type = "application/octet-stream") {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new File([content], filename, {
            type,
        }));
        a.download = filename;
        a.click();
    }
}
