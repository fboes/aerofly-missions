export class Test {
  successes = 0;
  errors = 0;

  /**
   * Put test cases into constructor
   * @param process
   */
  constructor(protected process: NodeJS.Process) { }

  assert(assertion: boolean, message: string) {
    if (assertion) {
      this.successes++;
      this.process.stdout.write("  ✅ " + message + "\n");
    } else {
      this.errors++;
      this.process.stderr.write("  💥 " + message + "\n");
    }
  }

  assertEquals(a: unknown, b: unknown, message: string = "") {
    return this.assert(a === b, message ? message : this.stringFromUnknown(a) + " matches " + this.stringFromUnknown(b));
  }

  group(title: string) {
    this.process.stdout.write(title + "\n");
  }

  exit() {
    this.process.stdout.write("\n" + (this.errors > 0 ? '💥' : '✅') + ` Finished, ${this.successes} successes, ${this.errors} errors ` + "\n");
    process.exit(this.errors > 0 ? 1 : 0);
  }

  protected stringFromUnknown(a: unknown): string {
    if (a === undefined) {
      return 'undefined'
    } else if (a === null) {
      return 'null'
    }
    return a.toString();
  }
}

export class Tests extends Test {
  tests: Test[] = [];

  add(test: Test): Tests {
    this.tests.push(test);
    return this;
  }

  exit() {
    this.tests.forEach((t) => {
      this.successes += t.successes;
      this.errors += t.errors;
    });

    super.exit();
  }
}
