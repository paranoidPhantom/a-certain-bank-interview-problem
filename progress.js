const mapAttributes = (node, attributes) => {
  for (const attribute of attributes) node.setAttribute(...attribute);
}

// Абстрактный класс для энкапсуляции противных действий с отрисовкой
class Graphic {
  static DEFAULT_SIZE = 120;
  static DEFAULT_WIDTH = 10;
  static DEFAULT_FILL_COLOR = "#005DFF";
  static DEFAULT_SHADOW_COLOR = "#EEF3F6";
  static DEFAULT_PROGRESS = 0;
  static DEFAULT_ORIENATION = -90; // Градусов от 'на 3-часа'

  static SVG_NS = 'http://www.w3.org/2000/svg';
  static SVG_ATTRIBUTES = (size) => [
    ["width", size],
    ["height", size],
    ["viewbox", `0 0 ${size} ${size}`],
    ["overflow", "visible"],
  ];
  static TRACK_ATTRIBUTES = (width) => [
    ["cx", "50%"],
    ["cy", "50%"],
    ["fill", "none"],
    ["stroke-width", width],
  ];
  node;
  #fill;
  #shadow;

  #orientation = Graphic.DEFAULT_ORIENATION;
  set orientation(value) {
    const parsedValue = Number(value);
    this.#orientation = Number.isNaN(parsedValue) ? Graphic.DEFAULT_ORIENATION : parsedValue - Graphic.DEFAULT_ORIENATION;
    this.freshOrientation();
  }

  freshOrientation() {
    this.node.style.rotate = this.#animate ? 'unset' : `${this.#orientation}deg`;
  }

  #progress = Graphic.DEFAULT_PROGRESS;
  set value(value) {
    const parsedValue = Number(value);
    this.#progress = Number.isNaN(parsedValue) ? Graphic.DEFAULT_PROGRESS : parsedValue;
    this.freshProgress();
  }

  #color_fill = Graphic.DEFAULT_FILL_COLOR;
  set 'fill-color'(value) {
    this.#color_fill = value ?? Graphic.DEFAULT_FILL_COLOR;
    this.freshColors();
  }
  #color_shadow = Graphic.DEFAULT_SHADOW_COLOR;
  set 'shadow-color'(value) {
    this.#color_shadow = value ?? Graphic.DEFAULT_SHADOW_COLOR;
    this.freshColors();
  }

  freshColors() {
    this.#fill.setAttribute("stroke", this.#color_fill);
    this.#shadow.setAttribute("stroke", this.#color_shadow);
  }

  #size = Graphic.DEFAULT_SIZE;
  set size(value) {
    this.#size = value ?? Graphic.DEFAULT_SIZE;
    this.freshDimensions();
  }
  #width = Graphic.DEFAULT_WIDTH;
  set thickness(value) {
    this.#width = value ?? Graphic.DEFAULT_WIDTH;
    this.freshDimensions();
  }

  #animate;
  set animate(value) {
    let rawAnimation = "";
    if (value === "on") {
      rawAnimation = "progress 1s linear infinite both"
    } else {
      const parsedValue = Number(value);
      if (!(Number.isNaN(parsedValue) || parsedValue === 0)) {
        rawAnimation = `progress ${parsedValue}s linear infinite both`
      }
    }
    this.#animate = rawAnimation !== "";
    this.node.style.animation = rawAnimation;
    this.freshOrientation();
  }

  set hide(value) {
    let rawDisplay = "unset";
    if (value === "on") {
      rawDisplay = "none";
    }
    this.node.style.display = rawDisplay;
  }

  // Урезаем радиус, чтобы circle помещался с ненулевым stroke-width
  get #adjustedRadius () { return (this.#size - this.#width) / 2; }

  freshDimensions() {
    mapAttributes(this.node, Graphic.SVG_ATTRIBUTES(this.#size));
    
    this.#shadow.setAttribute("r", this.#adjustedRadius);
    mapAttributes(this.#shadow, Graphic.TRACK_ATTRIBUTES(this.#width));

    this.#fill.setAttribute("r", this.#adjustedRadius);
    mapAttributes(this.#fill, Graphic.TRACK_ATTRIBUTES(this.#width));

    this.freshProgress();
  }

  freshProgress() {
    const circumference = Math.PI * this.#adjustedRadius * 2; // 2πr
    this.#fill.setAttribute("stroke-dasharray", `${circumference}`);
    this.#fill.style.transition = "stroke-dashoffset 0.2s ease";
    this.#fill.setAttribute("stroke-dashoffset", `${circumference * (100 - this.#progress) / 100}`);
  }

  constructor() {
    this.node = document.createElementNS(Graphic.SVG_NS, "svg");

    this.#shadow = document.createElementNS(Graphic.SVG_NS, "circle");
    this.node.appendChild(this.#shadow);

    this.#fill = document.createElementNS(Graphic.SVG_NS, "circle");
    this.node.appendChild(this.#fill);
    
    this.freshDimensions();
    this.freshColors();
    this.freshOrientation();
  }
}

export class Progress extends HTMLElement {
  static observedAttributes = ["value", "orientation", "animate", "hide", "size", "thickness", "fill-color", "shadow-color"];
  static ANIMATION = "@keyframes progress { from { rotate: 0; } to { rotate: 360deg; } }";

  shadow;
  graphic;

  constructor() {
    super();
  }
  connectedCallback() {
    this.shadow = this.attachShadow({ mode: 'open' });

    const graphic = new Graphic();
    this.graphic = graphic;
    this.shadow.appendChild(graphic.node);
    
    const style = document.createElement("style");
    style.innerHTML = Progress.ANIMATION;
    this.shadow.appendChild(style);
  }

  attributeChangedCallback(name, _oldValue, newValue) {
    this.graphic[name] = newValue;
  }
}
