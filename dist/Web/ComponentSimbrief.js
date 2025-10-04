import { SimBrief } from "../Import/SimBrief.js";
import { StatEvent } from "./StatEvent.js";
export class ComponentSimBrief extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `\
<p>Optionally you can download <a href="https://dispatch.simbrief.com/home" target="simbrief">your last flight briefing from SimBrief</a> by supplying your <a href="https://dispatch.simbrief.com/account#settings" target="simbrief">SimBrief username</a>.</p>
<div class="col-2">
  <div>
    <label for="simbrief-username">SimBrief username</label>
    <input type="text" id="simbrief-username" pattern="[A-Za-z0-9]+" />
  </div>
  <div>
    <div class="label">SimBrief API Call</div>
    <button data-handler="simbrief-fetch" type="button" id="simbrief-fetch" class="secondary">Fetch SimBrief flight plan</button>
  </div>
  <dialog class="success" closedby="any">
    <h3>Flight plan has been imported</h3>
    <p>You flight plan has been successfully imported from SimBrief. Things left to do:</p>
    <ul>
      <li>Check if your aircraft type has been properly imported.</li>
      <li>Edit the starting position and orientation of your aircraft.</li>
      <li>Check time, date and weather. Only basic weather has been imported.</li>
    </ul>
    <p><button onclick="this.closest('dialog').close();" class="secondary">OK</button></p>
    <button onclick="this.closest('dialog').close();" class="icon">✕ <span>Close</span></button>
  </dialog>
  <dialog class="error" closedby="any">
    <h3>Error</h3>
    <p>There was an error loading your flight plan. <em class="error-details">Could not load flight plan from SimBrief.</em></p>
    <p>Please check your SimBrief username, and if there is a recently generated flight plan present in SimBrief.</p>
    <p><button onclick="this.closest('dialog').close();" class="secondary">OK</button></p>
    <button onclick="this.closest('dialog').close();" class="icon">✕ <span>Close</span></button>
  </dialog>
</div>`;
        this.elements = {
            usernameInput: this.querySelector("#simbrief-username"),
            fetchButton: this.querySelector("#simbrief-fetch"),
            successDialog: this.querySelector("dialog.success"),
            errorDialog: this.querySelector("dialog.error"),
            errorDetails: this.querySelector("dialog.error .error-details"),
        };
    }
    connectedCallback() {
        this.checkDisabled();
        this.elements.usernameInput.addEventListener("input", this);
        this.elements.usernameInput.addEventListener("keydown", (e) => {
            if (e.code === "Enter") {
                this.elements.fetchButton.dispatchEvent(new Event("click"));
            }
        });
        this.elements.fetchButton.addEventListener("click", this);
    }
    disconnectedCallback() {
        this.elements.usernameInput.removeEventListener("input", this);
        this.elements.fetchButton.removeEventListener("click", this);
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "username") {
            this.username = newValue;
        }
    }
    async handleEvent(e) {
        this.checkDisabled();
        if (this.elements.fetchButton.disabled) {
            return;
        }
        if (e.target === this.elements.fetchButton) {
            const simBrief = new SimBrief();
            this.elements.fetchButton.classList.add("is-loading");
            this.dispatchEvent(StatEvent.createEvent("Import", "Import from API", "SimBrief"));
            simBrief
                .fetch(this.username)
                .then((simbriefPayload) => {
                var _a;
                (_a = this.elements.successDialog) === null || _a === void 0 ? void 0 : _a.showModal();
                this.dispatchEvent(new CustomEvent("simbrief-payload-fetched", {
                    detail: simbriefPayload,
                }));
            })
                .catch((e) => {
                var _a, _b;
                this.elements.errorDetails.textContent = (_a = e.message) !== null && _a !== void 0 ? _a : "Could not load flight plan from SimBrief.";
                (_b = this.elements.errorDialog) === null || _b === void 0 ? void 0 : _b.showModal();
            })
                .finally(() => {
                this.elements.fetchButton.classList.remove("is-loading");
            });
        }
    }
    get username() {
        return this.elements.usernameInput.value;
    }
    set username(username) {
        this.elements.usernameInput.value = username;
        this.checkDisabled();
    }
    checkDisabled() {
        this.elements.fetchButton.toggleAttribute("disabled", this.elements.usernameInput.value === "" || !this.elements.usernameInput.validity.valid);
    }
}
ComponentSimBrief.observedAttributes = ["username"];
