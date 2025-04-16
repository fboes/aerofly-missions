import { MainMcfFactory } from "../Aerofly/MainMcf.js";
import { MissionFactory } from "../Aerofly/Mission.js";
import { MissionListParser } from "../Aerofly/MissionsList.js";
import { GarminFpl } from "../Import/GarminFpl.js";
import { GeoFs } from "../Import/GeoFs.js";
import { GeoJsonImport } from "../Import/GeoJson.js";
import { Gpx } from "../Import/Gpx.js";
import { MsfsPln } from "../Import/MsfsPln.js";
import { SeeYouCup } from "../Import/SeeYouCup.js";
import { XplaneFms } from "../Import/XplaneFms.js";
export class ComponentUploadField extends HTMLElement {
    constructor() {
        super();
        this.mission = null;
        this.innerHTML = `\
<div>
  <label for="upload">Import file</label>
  <input type="file" id="upload" accept=".mcf,.tmc,.fpl,.pln,.fms,.json,.gpx,.geojson,.cup" />
</div>

<dialog>
  <h3>Choose mission</h3>
  <p>The file you have selected contains multiple missions. Please choose one.</p>
  <div>
    <label for="select-mission">Mission to import</label>
    <select id="select-mission">
      <option>None</option>
    </select>
  </div>
  <button>Select mission</button>
</dialog>
`;
        this.input = this.querySelector("input");
    }
    connectedCallback() {
        this.addEventListener("input", this);
    }
    disconnectedCallback() {
        this.removeEventListener("input", this);
    }
    async handleEvent(e) {
        var _a;
        for (const file of (_a = this.input.files) !== null && _a !== void 0 ? _a : []) {
            const reader = new FileReader();
            reader.onload = (e) => {
                var _a;
                this.uploadFile(file.name, (_a = e.target) === null || _a === void 0 ? void 0 : _a.result);
            };
            reader.readAsText(file);
        }
    }
    uploadFile(filename, filecontent) {
        const fileEnding = filename.replace(/^.*(\.[^.]+)$/, "$1");
        try {
            if (this.mission === null) {
                throw new Error("Mission is not set");
            }
            switch (fileEnding) {
                case ".mcf":
                    const mainMcf = new MainMcfFactory().create(filecontent);
                    this.mission.fromMainMcf(mainMcf);
                    break;
                case ".tmc":
                    const mlp = new MissionListParser(filecontent);
                    const missionNames = mlp.getMissionNames();
                    if (missionNames.length > 1) {
                        this.chooseMission(mlp, filename, fileEnding);
                        return;
                    }
                    new MissionFactory().create(filecontent, this.mission);
                    break;
                case ".fpl":
                    const fpl = new GarminFpl(filecontent);
                    this.mission.fromGarminFpl(fpl);
                    break;
                case ".pln":
                    const msfs = new MsfsPln(filecontent);
                    this.mission.fromGarminFpl(msfs);
                    break;
                case ".fms":
                    const xplane = new XplaneFms(filecontent);
                    this.mission.fromGarminFpl(xplane);
                    break;
                case ".json":
                    const geoFs = new GeoFs(filecontent);
                    this.mission.fromGarminFpl(geoFs);
                    break;
                case ".gpx":
                    const gpx = new Gpx(filecontent);
                    this.mission.fromGarminFpl(gpx);
                    break;
                case ".geojson":
                    const geojson = new GeoJsonImport(filecontent);
                    this.mission.fromGarminFpl(geojson);
                    break;
                case ".cup":
                    const cup = new SeeYouCup(filecontent);
                    this.mission.fromGarminFpl(cup);
                    break;
                default:
                    throw new Error("Unsupported file: " + fileEnding);
            }
            this.dispatchUploadEvent(filename, fileEnding);
        }
        catch (e) {
            alert(e.toString());
        }
    }
    chooseMission(mlp, filename, fileEnding) {
        const missionNames = mlp.getMissionNames();
        const modal = document.querySelector("dialog");
        const select = modal.querySelector("select");
        select.innerHTML = "";
        missionNames.forEach((m, i) => {
            const opt = document.createElement("option");
            opt.value = String(i);
            opt.innerText = m;
            select.appendChild(opt);
        });
        modal.showModal();
        modal.querySelector("button").addEventListener("click", (e) => {
            if (this.mission === null) {
                throw new Error("Mission is not set");
            }
            e.stopPropagation();
            e.preventDefault();
            new MissionFactory().create(mlp.getMissionString(Number(select.value)), this.mission);
            modal.close();
            this.dispatchUploadEvent(filename, fileEnding);
        }, { once: true });
    }
    dispatchUploadEvent(filename, fileEnding) {
        this.dispatchEvent(new CustomEvent("file-uploaded", {
            detail: {
                filename,
                fileEnding,
            },
        }));
    }
}
