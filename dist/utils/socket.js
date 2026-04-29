"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = exports.io = void 0;
exports.getSocketId = getSocketId;
exports.getOnlineAdminSupportSockets = getOnlineAdminSupportSockets;
exports.getAllOnlineUsers = getAllOnlineUsers;
const app_1 = __importDefault(require("../app"));
const http_1 = __importDefault(require("http"));
const logger_1 = __importDefault(require("../utils/logger"));
const socket_io_1 = require("socket.io");
const client_1 = require("../generated/prisma/client");
const auth_1 = require("../middlewares/auth");
const server = http_1.default.createServer(app_1.default);
exports.server = server;
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.CLIENT_URL,
        methods: ["GET", "POST"],
    },
    transports: ["websocket"],
    pingInterval: 25000, // 25 seconds
    pingTimeout: 60000, // 60 seconds
});
exports.io = io;
// Track online users with their roles
const onlineUsers = new Map();
// Helper to get a specific user's socket ID
function getSocketId(userId) {
    return onlineUsers.get(userId)?.socketId || null;
}
// Helper to get all online admin/support socket IDs
function getOnlineAdminSupportSockets() {
    const adminSupportSockets = [];
    onlineUsers.forEach((userData) => {
        if (userData.role === client_1.UserRole.SUPPORT ||
            userData.role === client_1.UserRole.ADMIN ||
            userData.role === client_1.UserRole.SUPER_ADMIN) {
            adminSupportSockets.push(userData.socketId);
        }
    });
    return adminSupportSockets;
}
// Helper to get all online users
function getAllOnlineUsers() {
    return Array.from(onlineUsers.keys());
}
io.use(auth_1.authenticateSocket);
io.on("connection", async (socket) => {
    const user = socket.user;
    logger_1.default.info(`User connected: ${user.name} (${user.userId}): ${socket.id}`);
    // Add user to online list with role
    onlineUsers.set(String(user.userId), {
        socketId: socket.id,
        role: user.role,
    });
    // Notify about online status change
    io.emit("onlineUsers", getAllOnlineUsers());
    socket.on("disconnect", (reasone) => {
        logger_1.default.info(`User disconnected: ${user.name} (${user.userId}): ${socket.id} Reasone: ${reasone}`);
        onlineUsers.delete(String(user.userId));
        io.emit("onlineUsers", getAllOnlineUsers());
    });
});
