"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zUpdateOrderDto = exports.zCreateOrderDto = void 0;
/**
 * Data Transfer Objects (DTOs) for the Order entity
 * These interfaces define the expected shape of data when creating or updating an order.
 * You can also use these types with validation libraries like Zod or Joi if needed.
 */
const zod_1 = require("zod");
// Enum-like validation for OrderStatus
const orderStatusEnum = zod_1.z.enum([
    "PENDING",
    "CONFIRMED",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "PROCESSING",
]);
// Enum-like validation for PaymentStatus
const paymentStatusEnum = zod_1.z.enum([
    "PENDING",
    "COMPLETED",
    "FAILED",
    "REFUNDED",
]);
/**
 * Zod schema for creating a new order.
 * Validates all required fields necessary for creation.
 */
exports.zCreateOrderDto = zod_1.z.object({
    status: orderStatusEnum,
    totalAmount: zod_1.z.number().nonnegative("Total amount must be non-negative"),
    paymentMethod: zod_1.z.string().min(1, "Payment method must not be empty"),
    paymentStatus: paymentStatusEnum,
    shippingAddress: zod_1.z.string().min(1, "Shipping address must not be empty"),
    customerId: zod_1.z
        .union([zod_1.z.string(), zod_1.z.number()])
        .transform(BigInt)
        .refine((val) => val > 0n, {
        message: "Customer ID must be a positive integer",
    }),
    isSubscription: zod_1.z.boolean().optional(),
    isPreorder: zod_1.z.boolean().optional(),
    preorderDeliveryDate: zod_1.z
        .string()
        .datetime()
        .refine((val) => new Date(val) > new Date(), {
        message: "Preorder delivery date must be in the future",
    })
        .optional(),
});
/**
 * Zod schema for updating an order.
 * All fields are optional to support partial updates.
 */
exports.zUpdateOrderDto = zod_1.z.object({
    status: orderStatusEnum.optional(),
    paymentMethod: zod_1.z
        .string()
        .min(1, "Payment method must not be empty")
        .optional(),
    paymentStatus: paymentStatusEnum.optional(),
    shippingAddress: zod_1.z
        .string()
        .min(1, "Shipping address must not be empty")
        .optional(),
    preorderDeliveryDate: zod_1.z
        .string()
        .datetime()
        .refine((val) => new Date(val) > new Date(), {
        message: "Preorder delivery date must be in the future",
    })
        .optional(),
    // totalAmount: z
    //   .number()
    //   .nonnegative("Total amount must be non-negative")
    //   .optional(),
    // customerId: z
    //   .union([z.string(), z.number()])
    //   .transform(BigInt)
    //   .refine((val) => val > 0n, {
    //     message: "Customer ID must be a positive integer",
    //   })
    //   .optional(),
    // isSubscription: z.boolean().optional(),
    // isPreorder: z.boolean().optional(),
});
