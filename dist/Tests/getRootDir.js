import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from 'node:url';
export function getRootDir() {
    return path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
}
export function getFileFromRoot(filename) {
    return path.join(getRootDir(), filename);
}
export function readFileFromRoot(filename) {
    return fs.readFileSync(getFileFromRoot(filename), "utf-8");
}
