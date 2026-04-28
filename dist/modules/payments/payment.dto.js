"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zUpdatePaymentDto = exports.zCreatePaymentDto = void 0;
/**
 * Data Transfer Objects (DTOs) for the Payment entity
 * These interfaces define the expected shape of data when creating or updating a payment.
 */
const zod_1 = require("zod");
const paymentStatusEnum = zod_1.z.enum([
    "PENDING",
    "COMPLETED",
    "FAILED",
    "REFUNDED",
]);
/**
 * Zod schema for creating a new payment.
 */
exports.zCreatePaymentDto = zod_1.z.object({
    amount: zod_1.z.number().positive("Amount must be a positive number").optional(),
    paymentMethod: zod_1.z.string().min(1, "Payment method is required").optional(),
    paymentStatus: paymentStatusEnum.optional(),
    orderId: zod_1.z
        .union([zod_1.z.string(), zod_1.z.number()])
        .transform(BigInt)
        .refine((val) => val > 0n, {
        message: "Order ID must be a positive integer",
    }),
    transactionId: zod_1.z.string().optional(),
    walletTransactionId: zod_1.z
        .union([zod_1.z.string(), zod_1.z.number()])
        .transform(BigInt)
        .refine((val) => val > 0n, {
        message: "Wallet Transaction ID must be a positive integer",
    })
        .optional(),
});
/**
 * Zod schema for updating a payment.
 */
exports.zUpdatePaymentDto = zod_1.z.object({
    amount: zod_1.z.number().positive("Amount must be a positive number").optional(),
    paymentMethod: zod_1.z.string().min(1, "Payment method is required").optional(),
    paymentStatus: paymentStatusEnum.optional(),
    transactionId: zod_1.z.string().optional(),
    orderId: zod_1.z
        .union([zod_1.z.string(), zod_1.z.number()])
        .transform(BigInt)
        .refine((val) => val > 0n, {
        message: "Order ID must be a positive integer",
    })
        .optional(),
    walletTransactionId: zod_1.z
        .union([zod_1.z.string(), zod_1.z.number()])
        .transform(BigInt)
        .refine((val) => val > 0n, {
        message: "Wallet Transaction ID must be a positive integer",
    })
        .optional(),
});
