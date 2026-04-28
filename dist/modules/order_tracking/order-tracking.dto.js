"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zUpdateOrderTrackingDto = exports.zCreateOrderTrackingDto = void 0;
/**
 * Data Transfer Objects (DTOs) for the OrderTracking entity
 * These interfaces define the expected shape of data when creating or updating an order tracking entry.
 */
const zod_1 = require("zod");
// Enum-like validation for OrderStatus
const orderStatusEnum = zod_1.z.enum([
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
]);
/**
 * Zod schema for creating a new order tracking entry.
 */
exports.zCreateOrderTrackingDto = zod_1.z.object({
    status: orderStatusEnum,
    description: zod_1.z.string().optional(),
    orderId: zod_1.z
        .union([zod_1.z.string(), zod_1.z.number()])
        .transform(BigInt)
        .refine((val) => val > 0n, {
        message: "Order ID must be a positive integer",
    }),
});
/**
 * Zod schema for updating an order tracking entry.
 */
exports.zUpdateOrderTrackingDto = zod_1.z.object({
    status: orderStatusEnum.optional(),
    description: zod_1.z.string().optional(),
    orderId: zod_1.z
        .union([zod_1.z.string(), zod_1.z.number()])
        .transform(BigInt)
        .refine((val) => val > 0n, {
        message: "Order ID must be a positive integer",
    })
        .optional(),
});
