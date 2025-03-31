export class ComponentUploadField extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `\
<div>
  <label for="upload">Import file</label>
  <input type="file" id="upload" accept=".mcf,.tmc,.fpl,.pln,.fms,.json,.gpx,.geojson" />
</div>
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
                var _a, _b;
                this.dispatchEvent(new CustomEvent("file-uploaded", {
                    detail: {
                        filename: file.name,
                        filecontent: (_b = (_a = e.target) === null || _a === void 0 ? void 0 : _a.result) !== null && _b !== void 0 ? _b : "",
                    },
                }));
            };
            reader.readAsText(file);
        }
    }
}
