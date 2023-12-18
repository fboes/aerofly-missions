import { MissionsList } from "../Aerofly/MissionsList.js";
import { asciify } from "../Cli/Arguments.js";
import { GeoJson } from "../Export/GeoJson.js";
import { Markdown } from "../Export/Markdown.js";
import { MsfsPlnExport } from "../Import/MsfsPln.js";
import { XplaneFmsExport } from "../Import/XplaneFms.js";
export class ComponentsDownloadButtons extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `<button type="button" class="primary" id="download-tmc">Download Aerofly FS <code>custom_missions_user.tmc</code> flight plan</button>
    <button type="button" id="download-pln">Download Microsoft FS <code>custom_missions.pln</code> flight plan</button>
    <button type="button" id="download-fms">Download X-Plane <code>custom_missions.fms</code> flight plan</button>
    <button type="button" class="expert-mode" id="download-md">Download <code>custom_missions.md</code> documentation</button>
    <button type="button" class="expert-mode" id="download-json">Download <code>custom_missions.geojson</code></button>`;
    }
    connectedCallback() {
        this.draw();
        this.addEventListener("click", this);
    }
    disconnectedCallback() {
        this.removeEventListener("click", this);
    }
    get filename() {
        var _a;
        return ((_a = this.mission) === null || _a === void 0 ? void 0 : _a.title)
            ? asciify(this.mission.title.replace(/^(?:From )?(\S+) to (\S+)$/i, "$1-$2"))
            : "custom_missions";
    }
    handleEvent(e) {
        e.stopPropagation();
        if (!this.mission) {
            return;
        }
        const filename = this.filename;
        switch (e.target.closest("button").id) {
            case "download-json":
                this.download(filename, JSON.stringify(new GeoJson().fromMission(this.mission), null, 2), "application/geo+json");
                break;
            case "download-md":
                this.download(filename + ".md", new Markdown(this.mission).toString(filename + ".tmc"), "text/markdown");
                break;
            case "download-pln":
                this.download(filename + ".pln", new MsfsPlnExport(this.mission).toString());
                break;
            case "download-fms":
                this.download(filename + ".fms", new XplaneFmsExport(this.mission).toString());
                break;
            case "download-tmc":
                const m = new MissionsList("");
                m.missions.push(this.mission);
                this.download(filename + ".tmc", m.toString());
                break;
        }
    }
    draw() {
        const slug = this.filename;
        this.querySelectorAll("button").forEach((b) => {
            b.disabled = !this.mission || this.mission.checkpoints.length <= 0;
        });
        this.querySelectorAll("code").forEach((el) => {
            el.innerText = slug + el.innerText.replace(/^.+\./, ".");
        });
    }
    download(filename, content, type = "text/plain") {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new File([content], filename, {
            type,
        }));
        a.download = filename;
        a.click();
    }
}
