"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = createNotification;
exports.getAllNotifications = getAllNotifications;
exports.getCustomerNotifications = getCustomerNotifications;
exports.getAdminNotifications = getAdminNotifications;
exports.getNotificationById = getNotificationById;
exports.updateNotification = updateNotification;
exports.deleteNotification = deleteNotification;
exports.markNotificationAsReadById = markNotificationAsReadById;
exports.markAllNotificationsAsRead = markAllNotificationsAsRead;
exports.markAllNotificationsAsSeen = markAllNotificationsAsSeen;
/**
 * Service layer for Notification entity operations.
 * Contains business logic and database interactions for notifications.
 */
const http_status_1 = __importDefault(require("http-status"));
const appError_1 = require("../../utils/appError");
const socket_1 = require("../../utils/socket");
const prismaClient_1 = __importDefault(require("../../prisma-client/prismaClient"));
const errorHandler_1 = require("../../utils/errorHandler");
const client_1 = require("../../generated/prisma/client");
/**
 * Create a new notification
 */
async function createNotification(data) {
    try {
        const receiver = await prismaClient_1.default.user.findUnique({
            where: { userId: data.receiverId },
        });
        if (!receiver) {
            throw new Error("Receiver not found");
        }
        const notification = await prismaClient_1.default.notification.create({
            data: {
                message: data.message,
                receiverId: data.receiverId,
                type: data.type,
            },
        });
        const receiverId = (0, socket_1.getSocketId)(String(data.receiverId));
        if (receiverId) {
            socket_1.io.to(receiverId).emit("newNotification", notification);
        }
        return notification;
    }
    catch (error) {
        throw new Error(`Failed to create notification: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Retrieve all notifications
 */
async function getAllNotifications() {
    try {
        const notifications = await prismaClient_1.default.notification.findMany();
        return notifications;
    }
    catch (error) {
        throw new Error(`Failed to fetch notifications: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Retrieve a user's notifications
 */
async function getCustomerNotifications(userId, paginationParams) {
    try {
        const user = await prismaClient_1.default.user.findUnique({
            where: { userId: Number(userId) },
        });
        if (!user) {
            throw new Error("User not found");
        }
        const notifications = await prismaClient_1.default.notification.findMany({
            where: { receiverId: Number(userId) },
            take: paginationParams.limit,
            skip: paginationParams.skip,
            orderBy: {
                createdAt: paginationParams.sort === "asc" ? "asc" : "desc",
            },
        });
        const totalNotifications = await prismaClient_1.default.notification.count({
            where: { receiverId: Number(userId) },
        });
        const unreadNotificationsCount = await prismaClient_1.default.notification.count({
            where: {
                receiverId: Number(userId),
                status: "UNREAD",
            },
        });
        const unseenNotificationsCount = await prismaClient_1.default.notification.count({
            where: {
                receiverId: Number(userId),
                isSeen: false,
            },
        });
        return {
            notifications,
            currentPage: paginationParams.page,
            totalPages: Math.ceil(totalNotifications / paginationParams.limit),
            totalCount: totalNotifications,
            unreadNotificationsCount,
            unseenNotificationsCount,
        };
    }
    catch (error) {
        throw new Error(`Failed to fetch notifications: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Retrieve a admin's notifications
 */
async function getAdminNotifications(paginationParams) {
    try {
        const notifications = await prismaClient_1.default.notification.findMany({
            where: { receiverId: null },
            take: paginationParams.limit,
            skip: paginationParams.skip,
            orderBy: {
                createdAt: paginationParams.sort === "asc" ? "asc" : "desc",
            },
        });
        const totalNotifications = await prismaClient_1.default.notification.count({
            where: { receiverId: null },
        });
        const unreadNotificationsCount = await prismaClient_1.default.notification.count({
            where: {
                receiverId: null,
                status: "UNREAD",
            },
        });
        const unseenNotificationsCount = await prismaClient_1.default.notification.count({
            where: {
                receiverId: null,
                isSeen: false,
            },
        });
        return {
            notifications,
            currentPage: paginationParams.page,
            totalPages: Math.ceil(totalNotifications / paginationParams.limit),
            totalCount: totalNotifications,
            unreadNotificationsCount,
            unseenNotificationsCount,
        };
    }
    catch (error) {
        throw new Error(`Failed to fetch notifications: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Retrieve a notification by its ID
 */
async function getNotificationById(notificationId) {
    try {
        const notification = await prismaClient_1.default.notification.findUnique({
            where: { notificationId: Number(notificationId) },
        });
        return notification;
    }
    catch (error) {
        throw new Error(`Failed to fetch notification: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Update a notification by its ID
 */
async function updateNotification(notificationId, data) {
    try {
        const notification = await prismaClient_1.default.notification.findUnique({
            where: { notificationId: Number(notificationId) },
        });
        if (!notification) {
            throw new Error("Notification not found");
        }
        const updatedNotification = await prismaClient_1.default.notification.update({
            where: { notificationId: Number(notificationId) },
            data: {
                message: data.message,
                type: data.type,
            },
        });
        const receiverId = (0, socket_1.getSocketId)(String(notification.receiverId));
        if (receiverId) {
            socket_1.io.to(receiverId).emit("notificationUpdated", notification);
        }
        return updatedNotification;
    }
    catch (error) {
        throw new Error(`Failed to update notification: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Delete a notification by its ID
 */
async function deleteNotification(notificationId) {
    try {
        const notification = await prismaClient_1.default.notification.findUnique({
            where: { notificationId: Number(notificationId) },
        });
        if (!notification) {
            throw new Error("Notification not found");
        }
        await prismaClient_1.default.notification.delete({
            where: { notificationId: Number(notificationId) },
        });
        const receiverId = (0, socket_1.getSocketId)(String(notification.receiverId));
        if (receiverId) {
            socket_1.io.to(receiverId).emit("notificationDeleted", notification);
        }
    }
    catch (error) {
        throw new Error(`Failed to delete notification: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Mark single unread notifications as read for specific user
 */
async function markNotificationAsReadById(userId, notificationId) {
    try {
        const notification = await prismaClient_1.default.notification.findUnique({
            where: {
                notificationId: Number(notificationId),
            },
        });
        if (!notification) {
            throw new appError_1.AppError("Notification not found", http_status_1.default.NOT_FOUND);
        }
        await prismaClient_1.default.notification.update({
            where: {
                notificationId: Number(notificationId),
            },
            data: {
                status: client_1.NotificationStatus.READ,
            },
        });
    }
    catch (error) {
        throw error;
    }
}
/**
 * Mark all unread notifications as read for specific user
 */
async function markAllNotificationsAsRead(userId) {
    try {
        // Check if the user exists
        const user = await prismaClient_1.default.user.findUnique({
            where: { userId },
        });
        if (!user) {
            throw new Error("User not found");
        }
        // If role is customer then receiverId is userId else receiverId is null
        const receiverId = user.role === client_1.UserRole.CUSTOMER
            ? userId
            : [client_1.UserRole.ADMIN, client_1.UserRole.SUPPORT, client_1.UserRole.SUPER_ADMIN].includes(user.role)
                ? null
                : undefined;
        // update all notifications
        await prismaClient_1.default.notification.updateMany({
            where: {
                receiverId,
                status: client_1.NotificationStatus.UNREAD,
            },
            data: {
                status: client_1.NotificationStatus.READ,
            },
        });
    }
    catch (error) {
        throw new Error(`Failed to mark notifications as read: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Mark all unseen notifications as seen for specific user
 */
async function markAllNotificationsAsSeen(userId) {
    try {
        // Check if the user exists
        const user = await prismaClient_1.default.user.findUnique({
            where: { userId },
        });
        if (!user) {
            throw new Error("User not found");
        }
        // If role is customer then receiverId is userId else receiverId is null
        const receiverId = user.role === client_1.UserRole.CUSTOMER
            ? userId
            : [client_1.UserRole.ADMIN, client_1.UserRole.SUPPORT, client_1.UserRole.SUPER_ADMIN].includes(user.role)
                ? null
                : undefined;
        // update all notifications
        await prismaClient_1.default.notification.updateMany({
            where: {
                receiverId,
                isSeen: false,
            },
            data: {
                isSeen: true,
            },
        });
    }
    catch (error) {
        throw new Error(`Failed to mark notifications as seen: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
