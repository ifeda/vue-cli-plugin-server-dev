import { readFileSync } from 'fs';
import { createConfig } from "./templates/tsup.share.js";
export default createConfig(
  JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"))
);