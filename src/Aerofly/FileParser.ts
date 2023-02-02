export class FileParser {
  getNumber(subject: string, key: string, defaultValue: number = 0): number {
    return Number(this.getValue(subject, key, String(defaultValue)));
  }

  setNumber(subject: string, key: string, value: number) {
    return this.setValue(subject, key, String(value));
  }

  getNumberArray(subject: string, key: string): number[] {
    return this.getValue(subject, key)
      .split(" ")
      .map((i) => Number(i));
  }

  getValue(subject: string, key: string, defaultValue: string = ""): string {
    const match = subject.match(new RegExp("(?:\\]\\s*\\[" + key + "\\]\\s*\\[)([^\\]]*)(?:\\])"));
    return match ? match[1] : defaultValue;
  }

  setValue(subject: string, key: string, value: string) {
    return value === undefined
      ? subject
      : subject.replace(new RegExp("(\\]\\[" + key + "\\]\\[)[^\\]]*(\\])"), "$1" + value + "$2");
  }

  getGroup(subject: string, group: string, indent: number = 2): string {
    const indentString = "    ".repeat(indent);
    const match = subject.match(
      new RegExp("\\n" + indentString + "<\\[" + group + "\\][\\s\\S]+?\\n" + indentString + ">")
    );
    return match ? match[0] : "";
  }

  setGroup(subject: string, group: string, indent: number, callback: (all: string) => string) {
    const indentString = "    ".repeat(indent);
    return subject.replace(
      new RegExp("(\\n" + indentString + "<\\[" + group + "\\]\\S*)([\\s\\S]+?)(\\n" + indentString + ">)"),
      callback
    );
  }
}
