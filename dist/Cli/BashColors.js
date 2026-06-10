/**
 * @see https://talyian.github.io/ansicolors/
 */
export class BashColors {
    colorType;
    reset = `\x1b[0m`;
    red = `\x1b[31m`;
    green = `\x1b[32m`;
    lightGray = `\x1b[90m`;
    lightRed = `\x1b[91m`;
    lightGreen = `\x1b[92m`;
    lightYellow = `\x1b[93m`;
    lightBlue = `\x1b[94m`;
    lightMagenta = `\x1b[95m`;
    lightCyan = `\x1b[96m`;
    lightWhite = `\x1b[97m`;
    static COLOR_NONE = 0;
    static COLOR_BASH = 1;
    static COLOR_HTML = 2;
    constructor(colorType = BashColors.COLOR_BASH) {
        this.colorType = colorType;
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
    get useColors() {
        return this.colorType !== BashColors.COLOR_NONE;
    }
    getStringLength(string) {
        return string.length - this.getColorsLength(string);
    }
    getColorsLength(string) {
        let length = 0;
        if (this.colorType === BashColors.COLOR_NONE) {
            return length;
        }
        const matches = this.colorType === BashColors.COLOR_BASH ? string.match(/\x1b.+?m/g) : string.match(/<\/?span[^>]*>/g);
        if (matches) {
            matches.forEach((l) => {
                length += l.length;
            });
        }
        return length;
    }
}
