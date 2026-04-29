"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateSocket = exports.authorizeRoles = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prismaClient_1 = __importDefault(require("@/prisma-client/prismaClient"));
const http_status_1 = require("http-status");
const logger_1 = __importDefault(require("@/utils/logger"));
const sendResponse_1 = __importDefault(require("@/utils/sendResponse"));
// Auth middleware check if user is authenticated
const authMiddleware = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        (0, sendResponse_1.default)(res, {
            success: false,
            statusCode: http_status_1.status.UNAUTHORIZED,
            message: "No token provided",
        });
        return;
    }
    const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
    const user = await prismaClient_1.default.user.findUnique({
        where: {
            userId: Number(decoded.userId),
        },
    });
    if (!user) {
        (0, sendResponse_1.default)(res, {
            success: false,
            statusCode: http_status_1.status.UNAUTHORIZED,
            message: "User no longer exists. Please login again.",
        });
        return;
    }
    req.user = user;
    next();
};
exports.authMiddleware = authMiddleware;
/*
 ** Check if user has the required role to access the resource. eg:authorizeRoles("role1", "role2")
 ** @param roles: List of roles that are allowed to access the resource
 */
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user?.role)) {
            (0, sendResponse_1.default)(res, {
                success: false,
                statusCode: http_status_1.status.FORBIDDEN,
                message: "You are not permitted to access this resource",
            });
            return;
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
// Middleware to authenticate JWT for WebSocket connections
const authenticateSocket = async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token) {
            throw new Error("Please login to access this resource.");
        }
        const decodedData = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = await prismaClient_1.default.user.findUnique({
            where: {
                userId: Number(decodedData.userId),
            },
        });
        if (!user) {
            throw new Error("Please login to access this resource.");
        }
        socket.user = user;
        logger_1.default.info(`Socket authenticated: ${user.name} (${user.userId})`);
        next();
    }
    catch (err) {
        logger_1.default.info(`Socket authentication failed: ${err.message}`);
        return next(err);
    }
};
exports.authenticateSocket = authenticateSocket;
