export class ComponentsHelp extends HTMLElement {
    constructor() {
        super();
        this.elements = {
            button: document.createElement('button'),
            dialog: document.createElement('dialog')
        };
    }
    connectedCallback() {
        var _a, _b;
        this.elements.button.innerText = (_a = this.getAttribute('title')) !== null && _a !== void 0 ? _a : 'Help';
        this.elements.button.className = (_b = this.getAttribute('class')) !== null && _b !== void 0 ? _b : '';
        this.elements.dialog.innerHTML = this.innerHTML;
        this.innerHTML = '';
        this.appendChild(this.elements.button);
        this.appendChild(this.elements.dialog);
        this.addEventListener('click', this);
    }
    disconnectedCallback() {
        this.removeEventListener('click', this);
    }
    handleEvent(e) {
        e.stopPropagation();
    }
}
