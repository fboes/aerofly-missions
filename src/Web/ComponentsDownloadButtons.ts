import { Mission } from "../Aerofly/Mission.js";
import { MissionsList } from "../Aerofly/MissionsList.js";
import { asciify } from "../Cli/Arguments.js";
import { GeoJson } from "../Export/GeoJson.js";
import { KeyholeMarkupLanguage } from "../Export/KeyholeMarkupLanguage.js";
import { Markdown } from "../Export/Markdown.js";
import { GarminExport } from "../Import/GarminFpl.js";
import { GeoFsExport } from "../Import/GeoFs.js";
import { Msfs2024Export, MsfsPlnExport } from "../Import/MsfsPln.js";
import { XplaneFmsExport } from "../Import/XplaneFms.js";
import { StatEvent } from "./StatEvent.js";

export class ComponentsDownloadButtons extends HTMLElement {
  mission?: Mission;

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
  <button type="button" class="expert-mode" data-filesuffix=".kml">Download <code>custom_missions.kml</code></button>
  <button type="button" class="expert-mode" data-filesuffix=".geojson">Download <code>custom_missions.geojson</code></button>
</details>
`;
  }

  connectedCallback(): void {
    this.draw();
    this.addEventListener("click", this);
  }

  disconnectedCallback(): void {
    this.removeEventListener("click", this);
  }

  get slug(): string {
    return this.mission?.title
      ? asciify(this.mission.title.replace(/^(?:From )?(\S+) to (\S+)$/i, "$1-$2"))
      : "custom_missions";
  }

  handleEvent(e: PointerEvent | KeyboardEvent) {
    e.stopPropagation();
    if (!this.mission) {
      return;
    }

    const button = (e.target as HTMLElement).closest("button");
    if (!button) {
      return;
    }

    const fileSuffix = (button as HTMLButtonElement).dataset.filesuffix ?? ".tmc";
    const filename = this.slug + fileSuffix;
    switch (fileSuffix) {
      case ".geojson":
        this.download(
          filename,
          JSON.stringify(new GeoJson().fromMission(this.mission, true), null, 2),
          "application/geo+json"
        );
        break;
      case ".kml":
        this.download(
          filename,
          new KeyholeMarkupLanguage().fromMission(this.mission).toString(),
          "application/vnd.google-earth.kml+xml"
        );
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
    document.body.dispatchEvent(
      StatEvent.createEvent("Mission", "Airport", this.mission.origin_icao.substring(0, 2) + "..")
    );
    document.body.dispatchEvent(
      StatEvent.createEvent("Mission", "Airport", this.mission.destination_icao.substring(0, 2) + "..")
    );
  }

  draw() {
    const filename = this.slug;

    this.querySelectorAll("button").forEach((b) => {
      (b as HTMLButtonElement).disabled = !this.mission || this.mission.checkpoints.length <= 0;
    });
    this.querySelectorAll("code").forEach((el) => {
      const fileSuffix = (el.closest("button") as HTMLButtonElement).dataset.filesuffix;
      el.innerText = filename + fileSuffix;
    });
  }

  protected download(filename: string, content: string, type = "application/octet-stream") {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new File([content], filename, {
        type,
      })
    );
    a.download = filename;
    a.click();
  }
}
