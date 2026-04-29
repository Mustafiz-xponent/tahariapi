"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zUpdateSubscriptionPlanDto = exports.zCreateSubscriptionPlanDto = void 0;
/**
 * Data Transfer Objects (DTOs) for the SubscriptionPlan entity
 * These interfaces define the expected shape of data when creating or updating a subscription plan.
 * You can also use these types with validation libraries like Zod or Joi if needed.
 */
const zod_1 = require("zod");
const client_1 = require("../../generated/prisma/client");
/**
 * Zod schema for creating a new subscription plan.
 * Validates all required fields necessary for creation.
 */
exports.zCreateSubscriptionPlanDto = zod_1.z.object({
    name: zod_1.z.string().min(1, "Name is required"),
    frequency: zod_1.z.nativeEnum(client_1.SubscriptionPlanType, {
        errorMap: () => ({
            message: "Invalid frequency. Must be WEEKLY or MONTHLY.",
        }),
    }),
    price: zod_1.z.number().positive("Price must be positive"),
    productId: zod_1.z
        .union([zod_1.z.string(), zod_1.z.number()])
        .transform(BigInt)
        .refine((val) => val > 0n, {
        message: "Product ID must be a positive integer",
    }),
    description: zod_1.z.string().optional(),
});
/**
 * Zod schema for updating a subscription plan.
 * All fields are optional to support partial updates.
 */
exports.zUpdateSubscriptionPlanDto = zod_1.z.object({
    name: zod_1.z.string().min(1, "Name is required").optional(),
    frequency: zod_1.z
        .nativeEnum(client_1.SubscriptionPlanType, {
        errorMap: () => ({
            message: "Invalid frequency. Must be WEEKLY or MONTHLY.",
        }),
    })
        .optional(),
    price: zod_1.z.number().positive("Price must be positive").optional(),
    productId: zod_1.z
        .union([zod_1.z.string(), zod_1.z.number()])
        .transform(BigInt)
        .refine((val) => val > 0n, {
        message: "Product ID must be a positive integer",
    })
        .optional(),
    description: zod_1.z.string().optional(),
});
