
// @copyright
//   © 2016-2022 Jarosław Foksa
// @license
//   MIT License (check LICENSE.md for details)

import Xel from "../classes/xel.js";

import {getIconset} from "../utils/icon.js";
import {html, css} from "../utils/template.js";

// @element x-icon
export default class XIconElement extends HTMLElement {
  static observedAttributes = ["href", "size"];

  static #shadowTemplate = html`
    <template>
      <svg id="svg" preserveAspectRatio="none" viewBox="0 0 100 100" width="0px" height="0px"></svg>
    </template>
  `;

  static #shadowStyleSheet = css`
    :host {
      display: block;
      color: currentColor;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 17px;
      height: 17px;
    }
    :host([disabled]) {
      opacity: 0.5;
    }
    :host([hidden]) {
      display: none;
    }

    #svg {
      width: 100%;
      height: 100%;
      fill: currentColor;
      stroke: none;
      overflow: inherit;
      /* @bugfix: pointerOverEvent.relatedTarget leaks shadow DOM of <x-icon> */
      pointer-events: none;
    }
  `

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // @property
  // @attribute
  // @type string
  // @default ""
  get href() {
    return this.hasAttribute("href") ? this.getAttribute("href") : "";
  }
  set href(href) {
    this.setAttribute("href", href);
  }

  // @property
  // @attribute
  // @type boolean
  // @default false
  get disabled() {
    return this.hasAttribute("disabled");
  }
  set disabled(disabled) {
    disabled ? this.setAttribute("disabled", "") : this.removeAttribute("disabled");
  }

  // @property
  // @attribute
  // @type "small" || "medium" || "large" || "smaller" || "larger" || null
  // @default null
  get size() {
    return this.hasAttribute("size") ? this.getAttribute("size") : null;
  }
  set size(size) {
    (size === null) ? this.removeAttribute("size") : this.setAttribute("size", size);
  }

  // @property readOnly
  // @attribute
  // @type "small" || "medium" || "large"
  // @default "medium"
  // @readOnly
  get computedSize() {
    return this.hasAttribute("computedsize") ? this.getAttribute("computedsize") : "medium";
  }

  #shadowRoot = null;
  #elements = {};
  #defaultIconsetsChangeListener = null;
  #xelSizeChangeListener = null;

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  constructor() {
    super();

    this.#shadowRoot = this.attachShadow({mode: "closed"});
    this.#shadowRoot.adoptedStyleSheets = [XIconElement.#shadowStyleSheet];
    this.#shadowRoot.append(document.importNode(XIconElement.#shadowTemplate.content, true));

    for (let element of this.#shadowRoot.querySelectorAll("[id]")) {
      this.#elements[element.id] = element;
    }
  }

  connectedCallback() {
    Xel.addEventListener("iconsetschange", this.#defaultIconsetsChangeListener = () => {
      this.#update();
    });

    Xel.addEventListener("sizechange", this.#xelSizeChangeListener = () => {
      this.#updateComputedSizeAttriubte();
    });

    this.#updateComputedSizeAttriubte();
  }

  disconnectedCallback() {
    Xel.removeEventListener("iconsetschange", this.#defaultIconsetsChangeListener);
    Xel.removeEventListener("sizechange", this.#xelSizeChangeListener);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) {
      return;
    }
    else if (name === "href") {
      this.#update();
    }
    else if (name === "size") {
      this.#updateComputedSizeAttriubte();
    }
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  async #update() {
    let symbol = null;
    let href = this.href.trim();

    if (href !== "") {
      let path = null;
      let id = null;

      if (href.includes("#")) {
        let parts = href.split("#");

        if (parts[0] !== "") {
          path = parts[0];
        }
        if (parts[1] !== "") {
          id = parts[1];
        }
      }

      if (id !== null) {
        // Default iconset
        if (path === null) {
          await Xel.whenIconsetsReady;
          symbol = Xel.queryIcon("#" + CSS.escape(id));
        }
        // Custom iconset
        else {
          let iconsetElement = await getIconset(path);

          if (iconsetElement) {
            symbol = iconsetElement.querySelector("#" + CSS.escape(id));
          }
        }
      }
    }

    if (symbol) {
      this.#elements["svg"].setAttribute("viewBox", symbol.getAttribute("viewBox"));
      this.#elements["svg"].innerHTML = symbol.innerHTML;
    }
    else {
      this.#elements["svg"].innerHTML = "";
    }
  }

  #updateComputedSizeAttriubte() {
    let defaultSize = Xel.size;
    let customSize = this.size;
    let computedSize = "medium";

    if (customSize === null) {
      computedSize = defaultSize;
    }
    else if (customSize === "smaller") {
      computedSize = (defaultSize === "large") ? "medium" : "small";
    }
    else if (customSize === "larger") {
      computedSize = (defaultSize === "small") ? "medium" : "large";
    }
    else {
      computedSize = customSize;
    }

    if (computedSize === "medium") {
      this.removeAttribute("computedsize");
    }
    else {
      this.setAttribute("computedsize", computedSize);
    }
  }
}

customElements.define("x-icon", XIconElement);
