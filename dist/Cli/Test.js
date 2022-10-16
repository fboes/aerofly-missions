export class Test {
    constructor(process) {
        this.process = process;
        this.successes = 0;
        this.errors = 0;
    }
    assert(assertion, message) {
        if (assertion) {
            this.successes++;
            this.process.stdout.write('  ✅ ' + message + "\n");
        }
        else {
            this.errors++;
            this.process.stderr.write('  💥 ' + message + "\n");
        }
    }
    assertEquals(a, b, message = '') {
        return this.assert(a === b, message ? message : a.toString() + ' matches ' + b.toString());
    }
    group(title) {
        this.process.stdout.write(title + "\n");
    }
    exit() {
        this.process.stdout.write("\n" + `Finished, ${this.successes} successes, ${this.errors} errors ` + "\n");
        process.exit(this.errors > 0 ? 1 : 0);
    }
}
export class Tests extends Test {
    constructor(process) {
        super(process);
        this.process = process;
        this.tests = [];
    }
    exit() {
        this.tests.forEach(t => {
            this.successes += t.successes;
            this.errors += t.errors;
        });
        this.process.stdout.write("\n" + `Finished, ${this.successes} successes, ${this.errors} errors ` + "\n");
        process.exit(this.errors > 0 ? 1 : 0);
    }
}
