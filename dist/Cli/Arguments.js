import { BashColors } from "./BashColors.js";
export const asciify = (string) => {
    return string
        .replace(/[äåæáàâãöøœóòôõüúùûëéèêïíìîÿýñß]/g, function (s) {
        return s
            .replace(/[äæ]/, "ae")
            .replace(/[åáàâã]/, "a")
            .replace(/[öøœ]/, "oe")
            .replace(/[óòôõ]/, "o")
            .replace(/[ü]/, "ue")
            .replace(/[úùû]/, "u")
            .replace(/[ëéèê]/, "e")
            .replace(/[ïíìî]/, "i")
            .replace(/[ÿý]/, "y")
            .replace(/[ñ]/, "n")
            .replace(/[ß]/, "ss");
    })
        .replace(/[ÄÅÆÁÀÂÃÖØŒÓÒÔÕÜÚÙÛËÉÈÊÏÍÌÎŸÝÑ]/g, function (s) {
        return s
            .replace(/[ÄÆ]/, "AE")
            .replace(/[ÅÁÀÂÃ]/, "A")
            .replace(/[ÖØŒ]/, "OE")
            .replace(/[ÓÒÔÕ]/, "O")
            .replace(/[Ü]/, "UE")
            .replace(/[ÚÙÛ]/, "U")
            .replace(/[ËÉÈÊ]/, "E")
            .replace(/[ÏÍÌÎ]/, "I")
            .replace(/[ŸÝ]/, "Y")
            .replace(/[Ñ]/, "N");
    })
        .replace(/[!?.,'":;]/g, "")
        .replace(/\s/g, "_")
        .replace(/[^a-zA-Z0-9-_]/g, "-")
        .replace(/(-)-+/g, "$1")
        .replace(/(_)_+/g, "$1");
};
export class Arguments {
    constructor(process) {
        this.help = false;
        this.missionOnly = false;
        this.geoJson = false;
        this.flightplan = false;
        this.useColors = BashColors.COLOR_BASH;
        this.skyVector = true;
        this.markdown = false;
        const args = process.argv.slice(2);
        //const cwd = process.cwd();
        this.source = "./main.mcf";
        this.title = "Custom missions";
        this.description = "";
        this.target = "";
        this.garmin = "";
        this.msfs = "";
        this.xplane = "";
        this.gpx = "";
        this.tmc = "";
        this.direction = -1;
        this.ils = 0;
        this.magneticDeclination = undefined;
        let pointer = "title";
        args.forEach((a) => {
            const match = a.match(/^[-]+([a-z-]+)$/);
            if (match) {
                pointer = match[1].toLowerCase();
                switch (pointer) {
                    case "help":
                        this.help = true;
                        break;
                    case "m":
                    case "mission-only":
                        this.missionOnly = true;
                        break;
                    case "geo-json":
                        this.geoJson = true;
                        break;
                    case "flightplan":
                        this.flightplan = true;
                        break;
                    case "skyvector":
                        this.skyVector = true;
                        break;
                    case "no-color":
                        this.useColors = BashColors.COLOR_NONE;
                        break;
                    case "markdown":
                        this.markdown = true;
                        break;
                }
            }
            else {
                switch (pointer) {
                    case "source":
                    case "s":
                        this.source = a;
                        break;
                    case "target":
                    case "t":
                        this.target = a;
                        break;
                    case "import":
                        const fileEnding = a.replace(/^.*(\.[^.]+)$/, "$1");
                        switch (fileEnding) {
                            case ".pln":
                                this.msfs = a;
                                break;
                            case ".fpl":
                                this.garmin = a;
                                break;
                            case ".fms":
                                this.xplane = a;
                                break;
                            case ".tmc":
                                this.tmc = a;
                                break;
                            case ".gpx":
                                this.gpx = a;
                                break;
                            default:
                                throw new Error("Unknown file type: " + fileEnding);
                        }
                        break;
                    case "title":
                        this.title = a;
                        break;
                    case "description":
                        this.description = a;
                        break;
                    case "direction":
                    case "d":
                        this.direction = Number(a);
                        break;
                    case "magnetic":
                        this.magneticDeclination = Number(a);
                        break;
                    case "ils":
                    case "i":
                        this.ils = Number(a);
                        break;
                }
            }
        });
        if (!this.target) {
            this.target = "./" + this.getSafeFilename(this.title) + ".tmc";
        }
    }
    getSafeFilename(filename) {
        return asciify(filename).substring(0, 32);
    }
    helpText(c) {
        return `\
${c.lightBlue}Usage: nodejs index.js [PARAMETERS...]${c.reset}
  Convert Aerofly FS 4 main.mcf file into a custom_missions_user.tmc file.

Parameters:
${c.lightBlue}  -s, --source      ${c.reset} Location of the main.mcf; defaults to \`${this.source}\`
${c.lightBlue}  -t, --target      ${c.reset} Location of your target file; defaults to \`${this.target}\`
${c.lightBlue}      --title       ${c.reset} Title of your mission; defaults to \`${this.title}\`
${c.lightBlue}      --description ${c.reset} Description of your mission; line breaks allowed; defaults to \`${this.description}\`
${c.lightBlue}  -i, --ils         ${c.reset} ILS frequency like '123.45'; defaults to \`${this.ils}\`
${c.lightBlue}  -d, --direction   ${c.reset} True initial heading of aircraft; defaults to \`${this.direction}\`
${c.lightBlue}      --magnetic    ${c.reset} Magnetic declination used for waypoints; defaults to \`${this.magneticDeclination}\`
${c.lightBlue}      --import      ${c.reset} Location of an optional TMC, FPL, PLN, FMS or GPX file

Switches:
${c.lightBlue}  -m  --mission-only${c.reset} Do not export mission list with a single mission,
${c.lightBlue}                    ${c.reset} but add mission to already existing file
${c.lightBlue}      --flightplan  ${c.reset} Output flightplan
${c.lightBlue}      --skyvector   ${c.reset} Output Sky Vector URL
${c.lightBlue}      --geo-json    ${c.reset} Save GeoJSON file
${c.lightBlue}      --markdown    ${c.reset} Save Markdown file
${c.lightBlue}      --no-color    ${c.reset} Disable colors in output
${c.lightBlue}      --help        ${c.reset} This help

This tool will overwrite the target file without any further warning.
Some information can not be inferred from the main.mcf, and needs to
be added manually.
`;
    }
}
