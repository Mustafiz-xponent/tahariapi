"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zCancelSubscriptionDto = exports.zResumeSubscriptionDto = exports.zPauseSubscriptionDto = exports.zUpdateSubscriptionDto = exports.zGetSubscriptionDto = exports.zCreateSubscriptionDto = void 0;
/**
 * Data Transfer Objects (DTOs) for the Subscription entity
 * These interfaces define the expected shape of data when creating or updating a subscription.
 */
const zod_1 = require("zod");
const subscriptionStatusEnum = zod_1.z.enum([
    "ACTIVE",
    "CANCELLED",
    "EXPIRED",
    "PENDING",
]);
const zBigIntId = (fieldName) => zod_1.z
    .union([zod_1.z.string(), zod_1.z.number()])
    .transform(BigInt)
    .refine((val) => val > 0n, {
    message: `${fieldName} must be a positive integer`,
});
/**
 * Zod schema for creating a new subscription.
 */
exports.zCreateSubscriptionDto = {
    body: zod_1.z.object({
        planId: zBigIntId("Plan ID"),
        paymentMethod: zod_1.z.enum(["WALLET", "COD"]),
        shippingAddress: zod_1.z.string().min(1, "Shipping address is required"),
    }),
};
exports.zGetSubscriptionDto = {
    params: zod_1.z.object({
        id: zBigIntId("Subscription ID"),
    }),
};
/**
 * Zod schema for updating a subscription.
 */
exports.zUpdateSubscriptionDto = zod_1.z.object({
    startDate: zod_1.z.string().datetime().optional(),
    endDate: zod_1.z.string().datetime().optional(),
    status: subscriptionStatusEnum.optional(),
    renewalDate: zod_1.z.string().datetime().optional(),
    customerId: zBigIntId("Customer ID").optional(),
    planId: zBigIntId("Plan ID").optional(),
});
/**
 * Zod schema for pause a subscription.
 */
exports.zPauseSubscriptionDto = {
    params: zod_1.z.object({
        id: zBigIntId("Subscription ID"),
    }),
};
exports.zResumeSubscriptionDto = {
    params: zod_1.z.object({
        id: zBigIntId("Subscription ID"),
    }),
};
exports.zCancelSubscriptionDto = {
    params: zod_1.z.object({
        id: zBigIntId("Subscription ID"),
    }),
};
