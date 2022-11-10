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

  constructor(public useColors = true) {
    if (!useColors) {
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
    }
  }

  getStringLength(string: string): number {
    return string.length - this.getColorsLength(string);
  }

  getColorsLength(string: string): number {
    let length = 0;
    if (!this.useColors) {
      return length;
    }

    const matches = string.match(/\x1b.+?m/g);
    if (matches) {
      matches.forEach(l => {
        length += l.length;
      })
    }
    return length
  }
}
