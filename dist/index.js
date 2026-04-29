"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const socket_1 = require("@/utils/socket");
const logger_1 = __importDefault(require("@/utils/logger"));
// Load environment variables
dotenv_1.default.config();
// handling uncaught exceptions--
process.on("uncaughtException", (err) => {
    logger_1.default.error(`Uncaught Exception: ${err.message} | ${err.stack}`);
    process.exit(1);
});
const PORT = process.env.PORT || 4000;
socket_1.server.listen(PORT, () => {
    logger_1.default.info(`Accounting API server running on http://localhost:${PORT}`);
});
// unhandled promise rejection--
process.on("unhandledRejection", (err) => {
    logger_1.default.error(`Unhandled Rejection: ${err} | ${err}`);
    socket_1.server.close(() => {
        process.exit(1);
    });
});
// Handle graceful shutdown
const shutdown = () => {
    console.log("Gracefully shutting down...");
    socket_1.server.close(() => {
        process.exit(0);
    });
};
// Handle manual termination
process.on("SIGINT", shutdown);
// Handle system termination
process.on("SIGTERM", shutdown);
