export type ComponentUploadFieldDetail = {
  filename: string;
  filecontent: string;
};

export class ComponentUploadField extends HTMLElement {
  input: HTMLInputElement;

  constructor() {
    super();
    this.innerHTML = `\
<div>
  <label for="upload">Import file</label>
  <input type="file" id="upload" accept=".mcf,.tmc,.fpl,.pln,.fms,.json,.gpx,.geojson" />
</div>
`;

    this.input = this.querySelector("input") as HTMLInputElement;
  }

  connectedCallback() {
    this.addEventListener("input", this);
  }

  disconnectedCallback() {
    this.removeEventListener("input", this);
  }

  async handleEvent(e: InputEvent): Promise<void> {
    for (const file of this.input.files ?? []) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.dispatchEvent(
          new CustomEvent("file-uploaded", {
            detail: {
              filename: file.name,
              filecontent: e.target?.result ?? "",
            } as ComponentUploadFieldDetail,
          })
        );
      };
      reader.readAsText(file);
    }
  }
}
