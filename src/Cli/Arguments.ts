import { BashColors } from "./BashColors.js";

export class Arguments {
  source: string;
  target: string;
  title: string;
  description: string;
  ils: number;
  direction: number;
  help: boolean = false;
  append: boolean = false;
  geoJson: boolean = false;
  flightplan: boolean = false;
  useColors: boolean = true;
  magneticDeclination: number;

  constructor(process: NodeJS.Process) {
    const args = process.argv.slice(2);
    //const cwd = process.cwd();

    this.source = "./main.mcf";
    this.title = "Custom missions";
    this.description = "";
    this.target = "";
    this.direction = -1;
    this.ils = 0;
    this.magneticDeclination = 0;

    let pointer = "title";
    args.forEach((a) => {
      const match = a.match(/^[-]+([a-z-]+)$/);
      if (match) {
        pointer = match[1].toLowerCase();
        switch (pointer) {
          case 'help':
            this.help = true;
            break;
          case 'a':
          case 'append':
            this.append = true;
            break;
          case 'geo-json':
            this.geoJson = true;
            break;
          case 'flightplan':
            this.flightplan = true;
            break;
          case 'no-color':
            this.useColors = false;
            break;
        }
      } else {
        switch (pointer) {
          case "source":
          case "s":
            this.source = a;
            break;
          case "target":
          case "t":
            this.target = a;
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
          case "m":
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

  protected getSafeFilename(filename: string): string {
    return filename
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .substring(0, 32);
  }

  helpText(c: BashColors): string {
    return `${c.lightBlue}Usage: nodejs index.js [PARAMETERS...]${c.reset}
  Convert Aerofly FS 4 main.mcf file into a custom_missions.tmc file.

Parameters:
${c.lightBlue}  -s, --source      ${c.reset} Location of the main.mcf; defaults to \`${this.source}\`
${c.lightBlue}  -t, --target      ${c.reset} Location of your target file; defaults to \`${this.target}\`
${c.lightBlue}      --title       ${c.reset} Title of your mission; defaults to \`${this.title}\`
${c.lightBlue}      --description ${c.reset} Description of your mission; line breaks allowed; defaults to \`${this.description}\`
${c.lightBlue}  -i, --ils         ${c.reset} ILS frequency like '123.45'; defaults to \`${this.ils}\`
${c.lightBlue}  -d, --direction   ${c.reset} True initial heading of plane; defaults to \`${this.direction}\`
${c.lightBlue}  -m, --magnetic    ${c.reset} Magnetic declination used for waypoints; defaults to \`${this.magneticDeclination}\`

Switches:
${c.lightBlue}  -a  --append      ${c.reset} Do not export mission list with a single mission,
${c.lightBlue}                    ${c.reset} but add mission to already existing file
${c.lightBlue}      --geo-json    ${c.reset} Output Geo.json for debugging
${c.lightBlue}      --flightplan  ${c.reset} Output flightplan for debugging
${c.lightBlue}      --no-color    ${c.reset} Disable colors in output
${c.lightBlue}      --help        ${c.reset} This help

This tool will overwrite the target file without any further warning.
Some information can not be inferred from the main.mcf, and needs to
be added manually.
`;
  }
}
