/**
 * @see https://talyian.github.io/ansicolors/
 */
export class BashColors {
  reset: string = `\x1b[0m`;

  red: string = `\x1b[31m`;
  green: string = `\x1b[32m`;

  lightGray: string = `\x1b[90m`;
  lightRed: string = `\x1b[91m`;
  lightGreen: string = `\x1b[92m`;
  lightYellow: string = `\x1b[93m`;
  lightBlue: string = `\x1b[94m`;
  lightMagenta: string = `\x1b[95m`;
  lightCyan: string = `\x1b[96m`;
  lightWhite: string = `\x1b[97m`;

  static COLOR_NONE = 0;
  static COLOR_BASH = 1;
  static COLOR_HTML = 2;

  constructor(public colorType = BashColors.COLOR_BASH) {
    switch (colorType) {
      case BashColors.COLOR_NONE:
        this.reset = ``;
        this.red = ``;
        this.green = ``;
        this.lightGray = ``;
        this.lightRed = ``;
        this.lightGreen = ``;
        this.lightYellow = ``;
        this.lightBlue = ``;
        this.lightMagenta = ``;
        this.lightCyan = ``;
        this.lightWhite = ``;
        break;
      case BashColors.COLOR_HTML:
        this.reset = `</span>`;
        this.red = `<span style="color:crimson">`;
        this.green = `<span style="color:chartreuse">`;
        this.lightGray = `<span style="color:gray">`;
        this.lightRed = `<span style="color:deeppink">`;
        this.lightGreen = `<span style="color:greenyellow">`;
        this.lightYellow = `<span style="color:gold">`;
        this.lightBlue = `<span style="color:deepskyblue">`;
        this.lightMagenta = `<span style="color:magenta">`;
        this.lightCyan = `<span style="color:cyan">`;
        this.lightWhite = `<span style="color:gainsboro">`;
        break;
    }
  }

  get useColors(): boolean {
    return this.colorType !== BashColors.COLOR_NONE;
  }

  getStringLength(string: string): number {
    return string.length - this.getColorsLength(string);
  }

  getColorsLength(string: string): number {
    let length = 0;
    if (this.colorType === BashColors.COLOR_NONE) {
      return length;
    }

    const matches =
      this.colorType === BashColors.COLOR_BASH ? string.match(/\x1b.+?m/g) : string.match(/<\/?span[^>]*>/g);
    if (matches) {
      matches.forEach((l) => {
        length += l.length;
      });
    }
    return length;
  }
}
