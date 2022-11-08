/**
 * @see https://talyian.github.io/ansicolors/
 */
export class BashColors {
    constructor(useColors = true) {
        this.useColors = useColors;
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
}
