"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markMessageAsRead = exports.sendMessage = void 0;
exports.createMessage = createMessage;
exports.getAllMessages = getAllMessages;
exports.getMessageById = getMessageById;
exports.updateMessage = updateMessage;
exports.deleteMessage = deleteMessage;
/**
 * Service layer for Message entity operations.
 * Contains business logic and database interactions for messages.
 */
const prismaClient_1 = __importDefault(require("@/prisma-client/prismaClient"));
const errorHandler_1 = require("@/utils/errorHandler");
const client_1 = require("@/generated/prisma/client");
const socket_1 = require("@/utils/socket");
/**
 * Create a new message
 */
async function createMessage(data) {
    try {
        const customer = await prismaClient_1.default.customer.findUnique({
            where: { customerId: data.customerId },
        });
        if (!customer) {
            throw new Error("Customer not found");
        }
        const message = await prismaClient_1.default.message.create({
            data: {
                // subject: data.subject,
                message: data.message,
                senderId: BigInt(customer.userId),
                // customerId: data.customerId,
            },
        });
        return message;
    }
    catch (error) {
        throw new Error(`Failed to create message: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Retrieve all messages
 */
async function getAllMessages(userId, userRole, paginationParams, receiverId) {
    try {
        let messages = [];
        let totalMessageCount = 0;
        let unreadMessageCount = 0;
        // Customer send message to support team
        if (userRole === client_1.UserRole.CUSTOMER) {
            const whereClause = {
                OR: [{ senderId: BigInt(userId) }, { receiverId: BigInt(userId) }],
            };
            messages = await prismaClient_1.default.message.findMany({
                where: whereClause,
                include: {
                    sender: {
                        select: {
                            userId: true,
                            name: true,
                            email: true,
                            phone: true,
                            role: true,
                        },
                    },
                    receiver: {
                        select: {
                            userId: true,
                            name: true,
                            email: true,
                            phone: true,
                            role: true,
                        },
                    },
                },
                take: paginationParams.limit,
                skip: paginationParams.skip,
                orderBy: {
                    createdAt: paginationParams.sort === "asc" ? "asc" : "desc",
                },
            });
            totalMessageCount = await prismaClient_1.default.message.count({
                where: whereClause,
            });
            unreadMessageCount = await prismaClient_1.default.message.count({
                where: {
                    ...whereClause,
                    status: "UNREAD",
                    receiverId: BigInt(userId),
                },
            });
        }
        // Support and Admin send message to customer--
        if (receiverId &&
            (userRole === client_1.UserRole.SUPPORT ||
                userRole === client_1.UserRole.ADMIN ||
                userRole === client_1.UserRole.SUPER_ADMIN)) {
            const whereClause = {
                OR: [
                    { senderId: BigInt(receiverId) },
                    { receiverId: BigInt(receiverId) },
                ],
            };
            messages = await prismaClient_1.default.message.findMany({
                where: whereClause,
                include: {
                    sender: {
                        select: {
                            userId: true,
                            name: true,
                            email: true,
                            phone: true,
                            role: true,
                        },
                    },
                    receiver: {
                        select: {
                            userId: true,
                            name: true,
                            email: true,
                            phone: true,
                            role: true,
                        },
                    },
                },
                take: paginationParams.limit,
                skip: paginationParams.skip,
                orderBy: {
                    createdAt: paginationParams.sort === "asc" ? "asc" : "desc",
                },
            });
            totalMessageCount = await prismaClient_1.default.message.count({
                where: whereClause,
            });
            unreadMessageCount = await prismaClient_1.default.message.count({
                where: {
                    ...whereClause,
                    status: "UNREAD",
                    senderId: BigInt(receiverId),
                },
            });
        }
        return {
            messages,
            totalCount: totalMessageCount,
            totalPages: Math.ceil(totalMessageCount / paginationParams.limit),
            currentPage: paginationParams.page,
            unreadMessageCount,
        };
    }
    catch (error) {
        console.log("ERROR:", error);
        throw new Error(`Failed to fetch messages: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Retrieve a message by its ID
 */
async function getMessageById(messageId) {
    try {
        const message = await prismaClient_1.default.message.findUnique({
            where: { messageId: Number(messageId) },
        });
        return message;
    }
    catch (error) {
        throw new Error(`Failed to fetch message: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Update a message by its ID
 */
async function updateMessage(messageId, newMessage, userId, userRole) {
    try {
        const message = await prismaClient_1.default.message.findUnique({
            where: { messageId: Number(messageId) },
        });
        if (!message) {
            throw new Error("Message not found");
        }
        if (userRole === client_1.UserRole.CUSTOMER) {
            if (message.senderId !== userId) {
                throw new Error("You can't update this message");
            }
        }
        const updatedMessage = await prismaClient_1.default.message.update({
            where: { messageId: Number(messageId) },
            data: { message: newMessage },
            include: {
                sender: {
                    select: {
                        userId: true,
                        name: true,
                        email: true,
                        phone: true,
                        role: true,
                    },
                },
                receiver: {
                    select: {
                        userId: true,
                        name: true,
                        email: true,
                        phone: true,
                        role: true,
                    },
                },
            },
        });
        const senderSocket = (0, socket_1.getSocketId)(String(updatedMessage.senderId));
        const receiverSocket = updatedMessage.receiverId
            ? (0, socket_1.getSocketId)(String(updatedMessage.receiverId))
            : null;
        if (senderSocket) {
            socket_1.io.to(senderSocket).emit("messageUpdated", {
                message: updatedMessage,
            });
        }
        if (receiverSocket) {
            socket_1.io.to(receiverSocket).emit("messageUpdated", {
                message: updatedMessage,
            });
        }
        (0, socket_1.getOnlineAdminSupportSockets)().forEach((socketId) => {
            socket_1.io.to(socketId).emit("messageUpdated", {
                message: updatedMessage,
            });
        });
        return updatedMessage;
    }
    catch (error) {
        throw new Error(`Failed to update message: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Delete a message by its ID
 */
async function deleteMessage(messageId, userId, userRole) {
    try {
        const message = await prismaClient_1.default.message.findUnique({
            where: { messageId: Number(messageId) },
        });
        if (!message) {
            throw new Error("Message not found");
        }
        // Permission check:
        if (userRole === client_1.UserRole.CUSTOMER) {
            // Customer can ONLY delete their own sent messages
            if (message.senderId !== BigInt(userId)) {
                throw new Error("You can't delete this message");
            }
        }
        const deletedMessage = await prismaClient_1.default.message.delete({
            where: { messageId: Number(messageId) },
        });
        const senderSocket = (0, socket_1.getSocketId)(String(deletedMessage.senderId));
        const receiverSocket = deletedMessage.receiverId
            ? (0, socket_1.getSocketId)(String(deletedMessage.receiverId))
            : null;
        if (senderSocket) {
            socket_1.io.to(senderSocket).emit("messageDeleted", {
                messageId: deletedMessage.messageId,
            });
        }
        if (receiverSocket) {
            socket_1.io.to(receiverSocket).emit("messageDeleted", {
                messageId: deletedMessage.messageId,
            });
        }
        (0, socket_1.getOnlineAdminSupportSockets)().forEach((socketId) => {
            socket_1.io.to(socketId).emit("messageDeleted", {
                messageId: deletedMessage.messageId,
            });
        });
    }
    catch (error) {
        throw new Error(`Failed to delete message: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
const sendMessage = async ({ message, receiverId, senderId, senderRole, }) => {
    try {
        // Customer ➜ Support broadcast
        if (senderRole === client_1.UserRole.CUSTOMER && !receiverId) {
            const msg = await prismaClient_1.default.message.create({
                data: {
                    message,
                    senderId: BigInt(senderId),
                },
                include: {
                    sender: {
                        select: {
                            userId: true,
                            name: true,
                            email: true,
                            phone: true,
                            role: true,
                        },
                    },
                },
            });
            (0, socket_1.getOnlineAdminSupportSockets)().forEach((socketId) => {
                socket_1.io.to(socketId).emit("newMessage", msg);
            });
            const customerSocket = (0, socket_1.getSocketId)(String(senderId));
            if (customerSocket) {
                socket_1.io.to(customerSocket).emit("newMessage", msg);
            }
            return msg;
        }
        //  Support/Admin/SuperAdmin --> Customer direct message
        if ((senderRole === client_1.UserRole.SUPPORT ||
            senderRole === client_1.UserRole.ADMIN ||
            senderRole === client_1.UserRole.SUPER_ADMIN) &&
            receiverId) {
            const receiver = await prismaClient_1.default.user.findUnique({
                where: { userId: Number(receiverId) },
            });
            if (!receiver || receiver.role !== client_1.UserRole.CUSTOMER) {
                throw new Error("Receiver is not a customer");
            }
            const msg = await prismaClient_1.default.message.create({
                data: {
                    message,
                    senderId: BigInt(senderId),
                    receiverId: BigInt(receiverId),
                },
                include: {
                    sender: {
                        select: {
                            userId: true,
                            name: true,
                            email: true,
                            phone: true,
                            role: true,
                        },
                    },
                    receiver: {
                        select: {
                            userId: true,
                            name: true,
                            email: true,
                            phone: true,
                            role: true,
                        },
                    },
                },
            });
            const customerSocket = (0, socket_1.getSocketId)(String(receiverId));
            if (customerSocket) {
                socket_1.io.to(customerSocket).emit("newMessage", msg);
            }
            (0, socket_1.getOnlineAdminSupportSockets)().forEach((socketId) => {
                socket_1.io.to(socketId).emit("newMessage", msg);
            });
            return msg;
        }
        throw new Error("Invalid sender or receiver");
    }
    catch (error) {
        throw new Error(`Failed to send message: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
};
exports.sendMessage = sendMessage;
/**
 * mark unread message as read
 **/
const markMessageAsRead = async ({ userId, userRole, senderId, }) => {
    try {
        const now = new Date();
        let whereClause = {};
        if (userRole === client_1.UserRole.SUPPORT ||
            userRole === client_1.UserRole.ADMIN ||
            userRole === client_1.UserRole.SUPER_ADMIN) {
            // Support reading customer-sent messages
            whereClause = {
                senderId: BigInt(senderId), // FROM customer
                receiverId: null,
                status: "UNREAD",
            };
        }
        else if (userRole === client_1.UserRole.CUSTOMER) {
            // Customer reading support-sent messages
            whereClause = {
                sender: {
                    role: {
                        in: ["SUPPORT", "ADMIN", "SUPER_ADMIN"],
                    },
                },
                receiverId: BigInt(userId),
                status: "UNREAD",
            };
        }
        else {
            throw new Error("Invalid role");
        }
        await prismaClient_1.default.message.updateMany({
            where: whereClause,
            data: {
                status: "READ",
                readAt: now,
            },
        });
        // Emit to the other side that these messages are read
        if (userRole === client_1.UserRole.SUPPORT ||
            userRole === client_1.UserRole.ADMIN ||
            userRole === client_1.UserRole.SUPER_ADMIN) {
            // Notify CUSTOMER whose messages were read by support
            const customerSocket = (0, socket_1.getSocketId)(String(senderId));
            if (customerSocket) {
                socket_1.io.to(customerSocket).emit("messagesRead", {
                    read: true,
                    readBy: "SUPPORT",
                });
            }
        }
        else if (userRole === client_1.UserRole.CUSTOMER) {
            // Notify support/admin that CUSTOMER read their messages
            (0, socket_1.getOnlineAdminSupportSockets)().forEach((socketId) => {
                socket_1.io.to(socketId).emit("messagesRead", {
                    read: true,
                    readBy: "CUSTOMER",
                });
            });
        }
    }
    catch (error) {
        throw new Error(`Failed to mark message as read: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
};
exports.markMessageAsRead = markMessageAsRead;
