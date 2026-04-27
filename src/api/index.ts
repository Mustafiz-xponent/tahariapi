import path from "path";

// Set up module alias before any other imports
// eslint-disable-next-line @typescript-eslint/no-require-imports
const moduleAlias = require("module-alias");
moduleAlias.addAlias("@", path.join(__dirname, ".."));

import dotenv from "dotenv";
dotenv.config();

import app from "../app";

export default app;
