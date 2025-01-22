import { SimBrief, SimBriefApiPayload } from "../Import/SimBrief.js";

export class ComponentSimBrief extends HTMLElement {
  static observedAttributes = ["username"];

  elements: {
    usernameInput: HTMLInputElement;
    fetchButton: HTMLButtonElement;
    successDialog: HTMLDialogElement;
    errorDialog: HTMLDialogElement;
  };

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
    <label for="simbrief-fetch">SimBrief API Call</label>
    <button data-handler="simbrief-fetch" type="button" id="simbrief-fetch" class="secondary">Fetch SimBrief flight plan</button>
  </div>
  <dialog class="success">
    <h4>Flight plan has been imported</h4>
    <p>You flight plan has been successfully imported from SimBrief. Things left to do:</p>
    <ul>
      <li>Check if your aircraft type has been properly imported.</li>
      <li>Edit the starting position and orientation of your aircraft.</li>
      <li>Check time, date and weather. Only basic weather has been imported.</li>
    </ul>
    <button onclick="this.closest('dialog').close();" class="icon" title="Close flight plan help">✕ <span>Close</span></button>
  </dialog>
  <dialog class="error">
    <h4>Error</h4>
    <p>There was an error loading your flight plan. Please check your SimBrief username, and if there is an active flight plan in SimBrief.</p>
    <button onclick="this.closest('dialog').close();" class="icon" title="Close flight plan help">✕ <span>Close</span></button>
  </dialog>
</div>`;

    this.elements = {
      usernameInput: this.querySelector("#simbrief-username") as HTMLInputElement,
      fetchButton: this.querySelector("#simbrief-fetch") as HTMLButtonElement,
      successDialog: this.querySelector("dialog.success") as HTMLDialogElement,
      errorDialog: this.querySelector("dialog.error") as HTMLDialogElement,
    };
  }

  connectedCallback() {
    this.checkDisabled();
    this.elements.usernameInput.addEventListener("input", this);
    this.elements.fetchButton.addEventListener("click", this);
  }

  disconnectedCallback(): void {
    this.elements.usernameInput.removeEventListener("input", this);
    this.elements.fetchButton.removeEventListener("click", this);
  }

  attributeChangedCallback(name: string, oldValue: any, newValue: any) {
    if (name === "username") {
      this.username = String(newValue);
    }
  }

  async handleEvent(e: Event): Promise<void> {
    this.checkDisabled();
    if (this.elements.fetchButton.disabled) {
      return;
    }

    if ((e.target as HTMLElement) === this.elements.fetchButton) {
      const simBrief = new SimBrief();
      this.elements.fetchButton.classList.add("is-loading");
      simBrief
        .fetch(this.username)
        .then((simbriefPayload: SimBriefApiPayload) => {
          this.elements.successDialog?.showModal();
          this.dispatchEvent(
            new CustomEvent("simbrief-payload-fetched", {
              detail: simbriefPayload,
            })
          );
        })
        .catch(() => {
          this.elements.errorDialog?.showModal();
        })
        .finally(() => {
          this.elements.fetchButton.classList.remove("is-loading");
        });
    }
  }

  get username(): string {
    return this.elements.usernameInput.value;
  }

  set username(username: string) {
    this.elements.usernameInput.value = username;
    this.checkDisabled();
  }

  checkDisabled() {
    this.elements.fetchButton.toggleAttribute(
      "disabled",
      this.elements.usernameInput.value === "" || !this.elements.usernameInput.validity.valid
    );
  }
}
