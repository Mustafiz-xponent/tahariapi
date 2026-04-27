import path from "path";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const moduleAlias = require("module-alias");

moduleAlias.addAlias("@", path.join(__dirname));
