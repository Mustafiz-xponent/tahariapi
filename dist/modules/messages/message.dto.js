"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zDeleteMessageDto = exports.zMarkMessageAsReadDto = exports.zSendMessageDto = exports.zUpdateMessageDto = exports.zCreateMessageDto = void 0;
/**
 * Data Transfer Objects (DTOs) for the Message entity
 * These interfaces define the expected shape of data when creating or updating a message.
 */
const zod_1 = require("zod");
/**
 * Zod schema for creating a new message.
 */
exports.zCreateMessageDto = zod_1.z.object({
    subject: zod_1.z.string().min(1, "Subject is required"),
    message: zod_1.z.string().min(1, "Message is required"),
    customerId: zod_1.z
        .union([zod_1.z.string(), zod_1.z.number()])
        .transform(BigInt)
        .refine((val) => val > 0n, {
        message: "Customer ID must be a positive integer",
    }),
});
/**
 * Zod schema for updating a message.
 */
exports.zUpdateMessageDto = {
    body: zod_1.z.object({
        message: zod_1.z.string().min(1, "Message is required").optional(),
    }),
    params: zod_1.z.object({
        id: zod_1.z
            .union([zod_1.z.string(), zod_1.z.number()])
            .transform(BigInt)
            .refine((val) => val > 0n, {
            message: "Params ID must be a positive integer",
        }),
    }),
};
/**
 * Zod schema for creating a new message.
 */
exports.zSendMessageDto = {
    body: zod_1.z.object({
        message: zod_1.z.string().min(1, "Message is required"),
        receiverId: zod_1.z
            .union([zod_1.z.string(), zod_1.z.number()])
            .transform(BigInt)
            .refine((val) => val > 0n, {
            message: "Receiver ID must be a positive integer",
        })
            .optional(),
    }),
};
exports.zMarkMessageAsReadDto = {
    body: zod_1.z.object({
        senderId: zod_1.z
            .union([zod_1.z.string(), zod_1.z.number()])
            .transform(BigInt)
            .refine((val) => val > 0n, {
            message: "Sender ID must be a positive integer",
        })
            .optional(),
    }),
};
exports.zDeleteMessageDto = {
    params: zod_1.z.object({
        id: zod_1.z
            .union([zod_1.z.string(), zod_1.z.number()])
            .transform(BigInt)
            .refine((val) => val > 0n, {
            message: "Params ID must be a positive integer",
        }),
    }),
};
