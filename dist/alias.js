"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const moduleAlias = require("module-alias");
moduleAlias.addAlias("@", path_1.default.join(__dirname));
