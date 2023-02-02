export class FileParser {
    getNumber(subject, key, defaultValue = 0) {
        return Number(this.getValue(subject, key, String(defaultValue)));
    }
    setNumber(subject, key, value) {
        return this.setValue(subject, key, String(value));
    }
    getNumberArray(subject, key) {
        return this.getValue(subject, key)
            .split(" ")
            .map((i) => Number(i));
    }
    getValue(subject, key, defaultValue = "") {
        const match = subject.match(new RegExp("(?:\\]\\s*\\[" + key + "\\]\\s*\\[)([^\\]]*)(?:\\])"));
        return match ? match[1] : defaultValue;
    }
    setValue(subject, key, value) {
        return value === undefined
            ? subject
            : subject.replace(new RegExp("(\\]\\[" + key + "\\]\\[)[^\\]]*(\\])"), "$1" + value + "$2");
    }
    getGroup(subject, group, indent = 2) {
        const indentString = "    ".repeat(indent);
        const match = subject.match(new RegExp("\\n" + indentString + "<\\[" + group + "\\][\\s\\S]+?\\n" + indentString + ">"));
        return match ? match[0] : "";
    }
    setGroup(subject, group, indent, callback) {
        const indentString = "    ".repeat(indent);
        return subject.replace(new RegExp("(\\n" + indentString + "<\\[" + group + "\\]\\S*)([\\s\\S]+?)(\\n" + indentString + ">)"), callback);
    }
}
