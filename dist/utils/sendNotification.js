"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotification = void 0;
const socket_1 = require("@/utils/socket");
const prismaClient_1 = __importDefault(require("@/prisma-client/prismaClient"));
const sendNotification = async (message, type, notify, receiverId, tx) => {
    // pick transaction client if provided, otherwise use prisma
    const db = tx ?? prismaClient_1.default;
    const notification = await db.notification.create({
        data: {
            message: message.replace(/\s+/g, " ").trim(),
            receiverId: receiverId ? receiverId : null,
            type,
        },
    });
    if (notify === "CUSTOMER") {
        const receiverSocketId = (0, socket_1.getSocketId)(String(receiverId));
        if (receiverSocketId) {
            socket_1.io.to(receiverSocketId).emit("newNotification", notification);
        }
    }
    if (notify === "ADMIN_SUPPORT") {
        (0, socket_1.getOnlineAdminSupportSockets)().forEach((socketId) => {
            socket_1.io.to(socketId).emit("newNotification", notification);
        });
    }
};
exports.sendNotification = sendNotification;
