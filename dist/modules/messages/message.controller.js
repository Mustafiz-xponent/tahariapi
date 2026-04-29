"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markMessageAsRead = exports.sendMessage = exports.deleteMessage = exports.updateMessage = exports.getMessageById = exports.getAllMessages = exports.createMessage = void 0;
/**
 * Controller layer for Message entity operations.
 * Handles HTTP requests and responses for message-related endpoints.
 */
const zod_1 = require("zod");
const http_status_1 = __importDefault(require("http-status"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const message_dto_1 = require("../../modules/messages/message.dto");
const messageService = __importStar(require("../../modules/messages/message.service"));
const messageIdSchema = zod_1.z.coerce.bigint().refine((val) => val > 0n, {
    message: "Message ID must be a positive integer",
});
/**
 * Create a new message
 */
const createMessage = async (req, res) => {
    try {
        const data = message_dto_1.zCreateMessageDto.parse(req.body);
        const message = await messageService.createMessage(data);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.CREATED,
            message: "Message created successfully",
            data: message,
        });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            res.status(http_status_1.default.BAD_REQUEST).json({ errors: error.flatten() });
            return;
        }
        (0, sendResponse_1.default)(res, {
            success: false,
            statusCode: http_status_1.default.INTERNAL_SERVER_ERROR,
            message: "Failed to create message",
        });
    }
};
exports.createMessage = createMessage;
/**
 * Get all messages
 */
const getAllMessages = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        const receiverId = req.query?.receiverId;
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100); // Max 100 items per page
        const skip = (page - 1) * limit;
        const sort = req.query.sort === "asc" ? "asc" : "desc";
        const paginationParams = { page, limit, skip, sort };
        const results = await messageService.getAllMessages(userId, userRole, paginationParams, receiverId);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Messages retrieved successfully",
            data: results.messages,
            pagination: {
                currentPage: results.currentPage,
                totalPages: results.totalPages,
                totalItems: results.totalCount,
                itemsPerPage: limit,
                hasNextPage: page < results.totalPages,
                hasPreviousPage: page > 1,
            },
            meta: {
                unreadMessageCount: results.unreadMessageCount,
            },
        });
    }
    catch (error) {
        (0, sendResponse_1.default)(res, {
            success: false,
            statusCode: http_status_1.default.INTERNAL_SERVER_ERROR,
            message: "Failed to fetch messages",
        });
    }
};
exports.getAllMessages = getAllMessages;
/**
 * Get a single message by ID
 */
const getMessageById = async (req, res) => {
    try {
        const messageId = messageIdSchema.parse(req.params.id);
        const message = await messageService.getMessageById(messageId);
        if (!message) {
            res.status(http_status_1.default.NOT_FOUND).json({ message: "Message not found" });
            return;
        }
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Message retrieved successfully",
            data: message,
        });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            res.status(http_status_1.default.BAD_REQUEST).json({ errors: error.flatten() });
            return;
        }
        (0, sendResponse_1.default)(res, {
            success: false,
            statusCode: http_status_1.default.INTERNAL_SERVER_ERROR,
            message: "Failed to fetch message",
        });
    }
};
exports.getMessageById = getMessageById;
/**
 * Update a message by ID
 */
const updateMessage = async (req, res) => {
    try {
        const messageId = req.params.id;
        const { message } = req.body;
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        const updatedMessage = await messageService.updateMessage(BigInt(messageId), message, userId, userRole);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Message updated successfully",
            data: updatedMessage,
        });
    }
    catch (error) {
        (0, sendResponse_1.default)(res, {
            success: false,
            statusCode: http_status_1.default.INTERNAL_SERVER_ERROR,
            message: "Failed to update message",
        });
    }
};
exports.updateMessage = updateMessage;
/**
 * Delete a message by ID
 */
const deleteMessage = async (req, res) => {
    try {
        const messageId = req.params.id;
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        await messageService.deleteMessage(BigInt(messageId), userId, userRole);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Message deleted successfully",
        });
    }
    catch (error) {
        (0, sendResponse_1.default)(res, {
            success: false,
            statusCode: http_status_1.default.INTERNAL_SERVER_ERROR,
            message: "Failed to delete message",
        });
    }
};
exports.deleteMessage = deleteMessage;
const sendMessage = async (req, res) => {
    try {
        const { message, receiverId } = req.body;
        const senderId = req.user?.userId;
        const senderRole = req.user?.role;
        const result = await messageService.sendMessage({
            message,
            receiverId,
            senderId,
            senderRole,
        });
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.CREATED,
            message: "Message sent successfully",
            data: result,
        });
    }
    catch (error) {
        (0, sendResponse_1.default)(res, {
            success: false,
            statusCode: http_status_1.default.INTERNAL_SERVER_ERROR,
            message: "Failed to send message",
        });
    }
};
exports.sendMessage = sendMessage;
/**
 * Mark message as read
 */
const markMessageAsRead = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        const { senderId } = req.body;
        await messageService.markMessageAsRead({
            userId,
            userRole,
            senderId,
        });
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Message marked as read successfully",
        });
    }
    catch (error) {
        (0, sendResponse_1.default)(res, {
            success: false,
            statusCode: http_status_1.default.INTERNAL_SERVER_ERROR,
            message: "Failed to mark message as read",
        });
    }
};
exports.markMessageAsRead = markMessageAsRead;
