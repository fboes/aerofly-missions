export class Test {
    /**
     * Put test cases into constructor
     * @param process
     */
    constructor(process, dieOnError = false) {
        this.process = process;
        this.dieOnError = dieOnError;
        this.successes = 0;
        this.errors = 0;
    }
    assert(assertion, message) {
        if (assertion) {
            this.successes++;
            this.process.stdout.write("  ✅ " + message + "\n");
        }
        else {
            this.errors++;
            this.process.stderr.write("  💥 " + message + "\n");
            if (this.dieOnError) {
                this.process.stdout.write("\n" +
                    (this.errors > 0 ? "💥" : "✅") +
                    ` Not finished, ${this.successes} successes, ${this.errors} errors ` +
                    "\n");
                process.exit(this.errors > 0 ? 1 : 0);
            }
        }
    }
    assertEquals(a, b, message = "") {
        return this.assert(a === b, message ? message : this.stringFromUnknown(a) + " matches " + this.stringFromUnknown(b));
    }
    assertEqualsRounded(a, b, precision, message = "") {
        return this.assertEquals(Number(a.toFixed(precision)), Number(b.toFixed(precision)), message);
    }
    group(title) {
        this.process.stdout.write(title + "\n");
    }
    exit() {
        this.process.stdout.write("\n" + (this.errors > 0 ? "💥" : "✅") + ` Finished, ${this.successes} successes, ${this.errors} errors ` + "\n");
        process.exit(this.errors > 0 ? 1 : 0);
    }
    stringFromUnknown(a) {
        if (a === undefined) {
            return "undefined";
        }
        else if (a === null) {
            return "null";
        }
        else if (typeof a === "string") {
            return `"${a}"`;
        }
        else if (typeof a === "boolean") {
            return a ? "true" : "false";
        }
        return a.toString();
    }
}
export class Tests extends Test {
    constructor() {
        super(...arguments);
        this.tests = [];
    }
    add(test) {
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
