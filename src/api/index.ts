import path from "path";

// Must run before any imports that use @/ aliases
// eslint-disable-next-line @typescript-eslint/no-require-imports
const moduleAlias = require("module-alias");
moduleAlias.addAlias("@", path.join(__dirname, ".."));

// Use require instead of import so alias is applied first
// eslint-disable-next-line @typescript-eslint/no-require-imports
const dotenv = require("dotenv");
dotenv.config();

// eslint-disable-next-line @typescript-eslint/no-require-imports
const app = require("../app").default;

module.exports = app;
