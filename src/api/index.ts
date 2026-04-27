import * as tsConfigPaths from "tsconfig-paths";

tsConfigPaths.register({
  baseUrl: "./",
  paths: {
    "@/*": ["src/*"],
    "@/generated/*": ["src/generated/*"],
  },
});

import dotenv from "dotenv";
dotenv.config();

import app from "../app";

export default app;
