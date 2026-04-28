"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zUpdateSubscriptionDeliveryDto = exports.zCreateSubscriptionDeliveryDto = void 0;
/**
 * Data Transfer Objects (DTOs) for the SubscriptionDelivery entity
 * These interfaces define the expected shape of data when creating or updating a subscription delivery.
 */
const zod_1 = require("zod");
const orderStatusEnum = zod_1.z.enum([
    "PENDING",
    "CONFIRMED",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
]);
/**
 * Zod schema for creating a new subscription delivery.
 */
exports.zCreateSubscriptionDeliveryDto = zod_1.z.object({
    deliveryDate: zod_1.z.string().datetime(),
    status: orderStatusEnum,
    subscriptionId: zod_1.z
        .union([zod_1.z.string(), zod_1.z.number()])
        .transform(BigInt)
        .refine((val) => val > 0n, {
        message: "Subscription ID must be a positive integer",
    }),
    orderId: zod_1.z
        .union([zod_1.z.string(), zod_1.z.number()])
        .transform(BigInt)
        .refine((val) => val > 0n, {
        message: "Order ID must be a positive integer",
    }),
});
/**
 * Zod schema for updating a subscription delivery.
 */
exports.zUpdateSubscriptionDeliveryDto = zod_1.z.object({
    deliveryDate: zod_1.z.string().datetime().optional(),
    status: orderStatusEnum.optional(),
    subscriptionId: zod_1.z
        .union([zod_1.z.string(), zod_1.z.number()])
        .transform(BigInt)
        .refine((val) => val > 0n, {
        message: "Subscription ID must be a positive integer",
    })
        .optional(),
    orderId: zod_1.z
        .union([zod_1.z.string(), zod_1.z.number()])
        .transform(BigInt)
        .refine((val) => val > 0n, {
        message: "Order ID must be a positive integer",
    })
        .optional(),
});
