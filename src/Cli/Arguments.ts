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

  constructor(process: NodeJS.Process) {
    const args = process.argv.slice(2);
    //const cwd = process.cwd();

    this.source = "./main.mcf";
    this.title = "Custom missions";
    this.description = "";
    this.target = "";
    this.direction = -1;
    this.ils = 0;

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
          case 'flightplan':
            this.flightplan = true;
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
          case "ils":
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

  helpText(): string {
    return `\x1b[94mUsage: nodejs index.js [PARAMETERS...]\x1b[0m
  Convert Aerofly FS 4 main.mcf file into a custom_missions.tmc file.

Parameters:
\x1b[94m  -s, --source       \x1b[0mLocation of the main.mcf; defaults to \`${this.source}\`
\x1b[94m  -t, --target       \x1b[0mLocation of your target file; defaults to \`${this.target}\`
\x1b[94m      --title        \x1b[0mTitle of your mission; defaults to \`${this.title}\`
\x1b[94m      --description  \x1b[0mDescription of your mission; line breaks allowed; defaults to \`${this.description}\`
\x1b[94m      --ils          \x1b[0mILS frequency like '123.45'; defaults to \`${this.ils}\`
\x1b[94m  -d, --direction    \x1b[0mInitial orientation of plane; defaults to \`${this.direction}\`

Switches:
\x1b[94m  -a  --append       \x1b[0mDo not export mission list with a single mission,
\x1b[94m                     \x1b[0mbut add mission to already existing file
\x1b[94m      --geo-json     \x1b[0mOutput Geo.json for debugging
\x1b[94m      --flightplan   \x1b[0mOutput flightplan for debugging
\x1b[94m      --help         \x1b[0mThis help

This tool will overwrite the target file without any further warning.
Some information can not be inferred from the main.mcf, and needs to
be added manually.
`;
  }
}
