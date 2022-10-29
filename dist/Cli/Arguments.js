export class Arguments {
    constructor(process) {
        this.help = false;
        this.append = false;
        this.geoJson = false;
        const args = process.argv.slice(2);
        //const cwd = process.cwd();
        this.source = "./main.mcf";
        this.title = "Custom missions";
        this.description = "";
        this.target = "";
        this.direction = -1;
        let pointer = "title";
        args.forEach((a) => {
            const match = a.match(/^[-]+(\S+)$/);
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
                }
            }
        });
        if (!this.target) {
            this.target = "./" + this.getSafeFilename(this.title) + ".tmc";
        }
    }
    getSafeFilename(filename) {
        return filename
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .substring(0, 32);
    }
    helpText() {
        return `Usage: nodejs index.js [PARAMETERS...]
  Convert Aerofly FS 4 main.mcf file into a custom_missions.tmc file.

Parameters:
  -s, --source       Location of the main.mcf; defaults to \`${this.source}\`
  -t, --target       Location of your target file; defaults to \`${this.target}\`
      --title        Title of your mission; defaults to \`${this.title}\`
      --description  Description of your mission; defaults to \`${this.description}\`
  -d, --direction    Initial orientation of plane; defaults to \`${this.direction}\`

Switches:
  -a  --append       Do not export mission list with a single mission,
                     but add mission to already existing file
      --geo-json     Output Geo.json for debugging
      --help         This help

This tool will overwrite the target file without any further warning.
Some information can not be inferred from the main.mcf, and needs to
be added manually.
`;
    }
}
