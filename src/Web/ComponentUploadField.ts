import { MainMcfFactory } from "../Aerofly/MainMcf.js";
import { Mission, MissionFactory } from "../Aerofly/Mission.js";
import { MissionListParser } from "../Aerofly/MissionsList.js";
import { GarminFpl } from "../Import/GarminFpl.js";
import { GeoFs } from "../Import/GeoFs.js";
import { GeoJsonImport } from "../Import/GeoJson.js";
import { Gpx } from "../Import/Gpx.js";
import { MsfsPln } from "../Import/MsfsPln.js";
import { SeeYouCup } from "../Import/SeeYouCup.js";
import { XplaneFms } from "../Import/XplaneFms.js";

export type ComponentUploadFieldDetail = {
  filename: string;
  fileEnding: string;
};

export class ComponentUploadField extends HTMLElement {
  input: HTMLInputElement;
  mission: Mission | null = null;

  constructor() {
    super();
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

    this.input = this.querySelector("input") as HTMLInputElement;
  }

  connectedCallback() {
    this.input.addEventListener("input", this);

    // TODO: Not yet valid in all browsers
    /*if ('launchQueue' in window && 'files' in LaunchParams.prototype) {
      launchQueue.setConsumer(async (launchParams) => {
        for (const file of launchParams.files as FileSystemHandle[]) {
          await file.getFile();
        }
      });
    }*/
  }

  disconnectedCallback() {
    this.input.removeEventListener("input", this);
  }

  async handleEvent(): Promise<void> {
    for (const file of this.input.files ?? []) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.uploadFile(file.name, e.target?.result as string);
      };
      reader.readAsText(file);
    }
  }

  protected uploadFile(filename: string, filecontent: string) {
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
    } catch (e) {
      if (e instanceof Error) {
        alert(e.message);
      } else {
        alert("Error: " + e);
      }
    }
  }

  protected chooseMission(mlp: MissionListParser, filename: string, fileEnding: string) {
    const missionNames = mlp.getMissionNames();

    const modal = document.querySelector("dialog") as HTMLDialogElement;
    const select = modal.querySelector("select") as HTMLSelectElement;
    select.innerHTML = "";
    missionNames.forEach((m, i) => {
      const opt = document.createElement("option");
      opt.value = String(i);
      opt.innerText = m;
      select.appendChild(opt);
    });
    modal.showModal();

    (modal.querySelector("button") as HTMLButtonElement).addEventListener(
      "click",
      (e) => {
        if (this.mission === null) {
          throw new Error("Mission is not set");
        }

        e.stopPropagation();
        e.preventDefault();
        new MissionFactory().create(mlp.getMissionString(Number(select.value)), this.mission);

        modal.close();
        this.dispatchUploadEvent(filename, fileEnding);
      },
      { once: true }
    );
  }

  protected dispatchUploadEvent(filename: string, fileEnding: string) {
    this.dispatchEvent(
      new CustomEvent("file-uploaded", {
        detail: {
          filename,
          fileEnding,
        } as ComponentUploadFieldDetail,
      })
    );
  }
}
