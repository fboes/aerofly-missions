export class Test {
  successes = 0;
  errors = 0;

  constructor(protected process: NodeJS.Process) { }

  assert(assertion: boolean, message: string) {
    if (assertion) {
      this.successes++;
      this.process.stdout.write('  ✅ ' + message + "\n");
    } else {
      this.errors++;
      this.process.stderr.write('  💥 ' + message + "\n");
    }
  }

  assertEquals(a: any, b: any, message: string = '') {
    return this.assert(a === b, message ? message : a.toString() + ' matches ' + b.toString())
  }

  group(title: string) {
    this.process.stdout.write(title + "\n");
  }

  exit() {
    this.process.stdout.write("\n" + `Finished, ${this.successes} successes, ${this.errors} errors ` + "\n");
    process.exit(this.errors > 0 ? 1 : 0);
  }
}

export class Tests extends Test {
  tests: Test[] = [];

  constructor(protected process: NodeJS.Process) {
    super(process);
  }

  exit() {
    this.tests.forEach(t => {
      this.successes += t.successes;
      this.errors += t.errors;
    })

    this.process.stdout.write("\n" + `Finished, ${this.successes} successes, ${this.errors} errors ` + "\n");
    process.exit(this.errors > 0 ? 1 : 0);
  }
}
