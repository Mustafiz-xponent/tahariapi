import * as tsConfigPaths from "tsconfig-paths";
import * as tsConfig from "../../tsconfig.json";

tsConfigPaths.register({
  baseUrl: ".",
  paths: tsConfig.compilerOptions.paths,
});

import dotenv from "dotenv";
dotenv.config();

import app from "../app";

export default app;
