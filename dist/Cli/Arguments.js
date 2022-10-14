export class Arguments {
    constructor(process) {
        this.help = false;
        const args = process.argv.slice(2);
        //const cwd = process.cwd();
        this.source = "./main.mcf";
        this.title = "Custom missions";
        this.description = "";
        this.target = "";
        let pointer = "title";
        args.forEach((a) => {
            const match = a.match(/^[-]+(\S+)$/);
            if (match) {
                pointer = match[1].toLowerCase();
                if (pointer === "help") {
                    this.help = true;
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
                    case "m":
                        this.title = a;
                        break;
                    case "description":
                    case "d":
                        this.description = a;
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
        return `Usage: nodejs index.js [PARAMETERS...] [TITLE]
  Convert Aerofly FS 4 main.mcf file into a custom_missions.tmc file.

Parameters:
  -s, --source       Location of the main.mcf; defaults to "${this.source}"
  -t, --target       Location of your target file; defaults to "${this.target}"
  -m, --title        Title of your mission; defaults to "${this.title}"
  -d, --description  Description of your mission; defaults to "${this.description}"

This tool will overwrite the target file without any further warning.
Some information can not be inferred from the main.mcf, and needs to
be added manually.
`;
    }
}
