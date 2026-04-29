"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zMarkNotificationAsReadDto = exports.zDeleteNotificationDto = exports.zUpdateNotificationDto = exports.zCreateNotificationDto = void 0;
/**
 * Data Transfer Objects (DTOs) for the Notification entity
 * These interfaces define the expected shape of data when creating or updating a notification.
 */
const zod_1 = require("zod");
const client_1 = require("@/generated/prisma/client");
/**
 * Common ID schema: supports string/number -> BigInt and must be > 0.
 */
const zBigIntId = zod_1.z
    .union([zod_1.z.string(), zod_1.z.number()])
    .transform(BigInt)
    .refine((val) => val > 0n, {
    message: "ID must be a positive integer",
});
/**
 * Zod schema for creating a new notification.
 */
exports.zCreateNotificationDto = {
    body: zod_1.z.object({
        message: zod_1.z.string().min(1, "Message is required"),
        receiverId: zBigIntId,
        type: zod_1.z.nativeEnum(client_1.NotificationType, {
            errorMap: () => ({
                message: "Invalid notification type. Must be ORDER, PAYMENT, WALLET, etc.",
            }),
        }),
    }),
};
/**
 * Zod schema for updating a notification.
 */
exports.zUpdateNotificationDto = {
    body: zod_1.z.object({
        message: zod_1.z.string().min(1, "Message is required").optional(),
        type: zod_1.z
            .nativeEnum(client_1.NotificationType, {
            errorMap: () => ({
                message: "Invalid notification type. Must be ORDER, PAYMENT, WALLET, etc.",
            }),
        })
            .optional(),
    }),
    params: zod_1.z.object({
        id: zBigIntId,
    }),
};
exports.zDeleteNotificationDto = {
    params: zod_1.z.object({
        id: zBigIntId,
    }),
};
exports.zMarkNotificationAsReadDto = {
    params: zod_1.z.object({
        id: zBigIntId,
    }),
};
