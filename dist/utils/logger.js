"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pino_1 = __importDefault(require("pino"));
const isProd = process.env.NODE_ENV === "production" || !process.env.NODE_ENV;
const logger = (0, pino_1.default)(isProd
    ? {
        level: "info",
        formatters: {
            level: (label) => ({ level: label }),
        },
    }
    : {
        transport: {
            target: "pino-pretty",
            options: {
                colorize: true,
                translateTime: "SYS:standard",
                ignore: "pid,hostname",
            },
        },
        level: "debug",
    });
exports.default = logger;
