// import * as tsConfigPaths from "tsconfig-paths";

// tsConfigPaths.register({
//   baseUrl: "./",
//   paths: {
//     "@/*": ["src/*"],
//     "@/generated/*": ["src/generated/*"],
//   },
// });

// import dotenv from "dotenv";
// dotenv.config();

// import app from "../app";

// export default app;

// This must be a require, not import, so it runs first
// eslint-disable-next-line @typescript-eslint/no-require-imports
require("../alias");

import dotenv from "dotenv";
dotenv.config();

import app from "../app";

export default app;
