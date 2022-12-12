/**
 * @see https://talyian.github.io/ansicolors/
 */
export class BashColors {
    constructor(colorType = BashColors.COLOR_BASH) {
        this.colorType = colorType;
        this.reset = `\x1b[0m`;
        this.red = `\x1b[31m`;
        this.green = `\x1b[32m`;
        this.lightGray = `\x1b[90m`;
        this.lightRed = `\x1b[91m`;
        this.lightGreen = `\x1b[92m`;
        this.lightYellow = `\x1b[93m`;
        this.lightBlue = `\x1b[94m`;
        this.lightMagenta = `\x1b[95m`;
        this.lightCyan = `\x1b[96m`;
        this.lightWhite = `\x1b[97m`;
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
        const matches = this.colorType === BashColors.COLOR_BASH
            ? string.match(/\x1b.+?m/g)
            : string.match(/<\/?span[^>]*>/g);
        if (matches) {
            matches.forEach(l => {
                length += l.length;
            });
        }
        return length;
    }
}
BashColors.COLOR_NONE = 0;
BashColors.COLOR_BASH = 1;
BashColors.COLOR_HTML = 2;
