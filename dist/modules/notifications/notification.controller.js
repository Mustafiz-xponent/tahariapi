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
exports.markAllNotificationsAsSeen = exports.markAllNotificationsAsRead = exports.markNotificationAsReadById = exports.deleteNotification = exports.updateNotification = exports.getNotificationById = exports.getAdminNotifications = exports.getCustomerNotifications = exports.getAllNotifications = exports.createNotification = void 0;
/**
 * Controller layer for Notification entity operations.
 * Handles HTTP requests and responses for notification-related endpoints.
 */
const zod_1 = require("zod");
const logger_1 = __importDefault(require("@/utils/logger"));
const http_status_1 = __importDefault(require("http-status"));
const sendResponse_1 = __importDefault(require("@/utils/sendResponse"));
const notificationService = __importStar(require("@/modules/notifications/notification.service"));
const notificationIdSchema = zod_1.z.coerce.bigint().refine((val) => val > 0n, {
    message: "Notification ID must be a positive integer",
});
/**
 * Create a new notification
 */
const createNotification = async (req, res) => {
    try {
        const { message, receiverId, type } = req.body;
        const notification = await notificationService.createNotification({
            message: message.replace(/\s+/g, " ").trim(),
            receiverId,
            type,
        });
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.CREATED,
            message: "Notification created successfully",
            data: notification,
        });
    }
    catch (error) {
        logger_1.default.info("Error while creating notification", error);
        (0, sendResponse_1.default)(res, {
            success: false,
            statusCode: http_status_1.default.INTERNAL_SERVER_ERROR,
            message: "Failed to create notification",
        });
    }
};
exports.createNotification = createNotification;
/**
 * Get all notifications
 */
const getAllNotifications = async (_req, res) => {
    try {
        const notifications = await notificationService.getAllNotifications();
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Notifications retrieved successfully",
            data: notifications,
        });
    }
    catch (error) {
        logger_1.default.info("Error while retrieving notifications", error);
        (0, sendResponse_1.default)(res, {
            success: false,
            statusCode: http_status_1.default.INTERNAL_SERVER_ERROR,
            message: "Failed to fetch notifications",
        });
    }
};
exports.getAllNotifications = getAllNotifications;
/**
 * Get a customer notification by userId
 */
const getCustomerNotifications = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100); // Max 100 items per page
        const skip = (page - 1) * limit;
        const sort = req.query.sort === "asc" ? "asc" : "desc";
        const paginationParams = { page, limit, skip, sort };
        const result = await notificationService.getCustomerNotifications(BigInt(userId), paginationParams);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Notifications retrieved successfully",
            data: result.notifications,
            pagination: {
                currentPage: result.currentPage,
                totalPages: result.totalPages,
                totalItems: result.totalCount,
                itemsPerPage: limit,
                hasNextPage: page < result.totalPages,
                hasPreviousPage: page > 1,
            },
            meta: {
                unreadNotificationsCount: result.unreadNotificationsCount,
                unseenNotificationsCount: result.unseenNotificationsCount,
            },
        });
    }
    catch (error) {
        logger_1.default.info("Error while retrieving notifications", error);
        (0, sendResponse_1.default)(res, {
            success: false,
            statusCode: http_status_1.default.INTERNAL_SERVER_ERROR,
            message: "Failed to fetch notifications",
        });
    }
};
exports.getCustomerNotifications = getCustomerNotifications;
/**
 * Get a admin notification
 */
const getAdminNotifications = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100); // Max 100 items per page
        const skip = (page - 1) * limit;
        const sort = req.query.sort === "asc" ? "asc" : "desc";
        const paginationParams = { page, limit, skip, sort };
        const result = await notificationService.getAdminNotifications(paginationParams);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Notifications retrieved successfully",
            data: result.notifications,
            pagination: {
                currentPage: result.currentPage,
                totalPages: result.totalPages,
                totalItems: result.totalCount,
                itemsPerPage: limit,
                hasNextPage: page < result.totalPages,
                hasPreviousPage: page > 1,
            },
            meta: {
                unreadNotificationsCount: result.unreadNotificationsCount,
                unseenNotificationsCount: result.unseenNotificationsCount,
            },
        });
    }
    catch (error) {
        logger_1.default.info("Error while retrieving notifications", error);
        (0, sendResponse_1.default)(res, {
            success: false,
            statusCode: http_status_1.default.INTERNAL_SERVER_ERROR,
            message: "Failed to fetch notifications",
        });
    }
};
exports.getAdminNotifications = getAdminNotifications;
/**
 * Get a single notification by ID
 */
const getNotificationById = async (req, res) => {
    try {
        const notificationId = notificationIdSchema.parse(req.params.id);
        const notification = await notificationService.getNotificationById(notificationId);
        if (!notification) {
            res
                .status(http_status_1.default.NOT_FOUND)
                .json({ message: "Notification not found" });
            return;
        }
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Notification retrieved successfully",
            data: notification,
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
            message: "Failed to fetch notification",
        });
    }
};
exports.getNotificationById = getNotificationById;
/**
 * Update a notification by ID
 */
const updateNotification = async (req, res) => {
    try {
        const data = req.body;
        const notificationId = req.params.id;
        const updatedNotification = await notificationService.updateNotification(BigInt(notificationId), data);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Notification updated successfully",
            data: updatedNotification,
        });
    }
    catch (error) {
        logger_1.default.error("Error while updating notification", error);
        (0, sendResponse_1.default)(res, {
            success: false,
            statusCode: http_status_1.default.INTERNAL_SERVER_ERROR,
            message: "Failed to update notification",
        });
    }
};
exports.updateNotification = updateNotification;
/**
 * Delete a notification by ID
 */
const deleteNotification = async (req, res) => {
    try {
        const notificationId = req.params.id;
        await notificationService.deleteNotification(BigInt(notificationId));
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Notification deleted successfully",
        });
    }
    catch (error) {
        logger_1.default.error("Error while deleting notification", error);
        (0, sendResponse_1.default)(res, {
            success: false,
            statusCode: http_status_1.default.INTERNAL_SERVER_ERROR,
            message: "Failed to delete notification",
        });
    }
};
exports.deleteNotification = deleteNotification;
/**
 * Mark all notifications as read
 **/
const markNotificationAsReadById = async (req, res) => {
    const userId = req.user?.userId;
    const notificationId = req.params.id;
    await notificationService.markNotificationAsReadById(userId, BigInt(notificationId));
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Notification marked as read",
    });
};
exports.markNotificationAsReadById = markNotificationAsReadById;
/**
 * Mark all notifications as read
 **/
const markAllNotificationsAsRead = async (req, res) => {
    try {
        const userId = req.user?.userId;
        await notificationService.markAllNotificationsAsRead(userId);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "All notifications marked as read",
        });
    }
    catch (error) {
        logger_1.default.error("Error while marking notifications as read", error);
        (0, sendResponse_1.default)(res, {
            success: false,
            statusCode: http_status_1.default.INTERNAL_SERVER_ERROR,
            message: "Failed to mark notifications as read",
        });
    }
};
exports.markAllNotificationsAsRead = markAllNotificationsAsRead;
/**
 * Mark all notifications as seen
 **/
const markAllNotificationsAsSeen = async (req, res) => {
    try {
        const userId = req.user?.userId;
        await notificationService.markAllNotificationsAsSeen(userId);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "All notifications marked as seen",
        });
    }
    catch (error) {
        logger_1.default.error("Error while marking notifications as seen", error);
        (0, sendResponse_1.default)(res, {
            success: false,
            statusCode: http_status_1.default.INTERNAL_SERVER_ERROR,
            message: "Failed to mark notifications as seen",
        });
    }
};
exports.markAllNotificationsAsSeen = markAllNotificationsAsSeen;
