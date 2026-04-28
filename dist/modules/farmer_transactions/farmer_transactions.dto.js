"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zUpdateFarmerTransactionDto = exports.zCreateFarmerTransactionDto = void 0;
/**
 * Data Transfer Objects (DTOs) for the FarmerTransaction entity
 * These interfaces define the expected shape of data when creating or updating a farmer transaction.
 * You can also use these types with validation libraries like Zod or Joi if needed.
 */
const zod_1 = require("zod");
// Assuming PaymentStatus enum values (adjust based on your Prisma schema)
const paymentStatusEnum = zod_1.z.enum([
    "PENDING",
    "COMPLETED",
    "FAILED",
    "REFUNDED",
]);
/**
 * Zod schema for creating a new farmer transaction.
 * Validates all required fields necessary for creation.
 */
exports.zCreateFarmerTransactionDto = zod_1.z.object({
    amountDue: zod_1.z.number().positive("Amount due must be positive"),
    amountPaid: zod_1.z.number().min(0, "Amount paid cannot be negative").default(0),
    paymentStatus: paymentStatusEnum.optional().default("PENDING"),
    farmerId: zod_1.z
        .union([zod_1.z.string(), zod_1.z.number()])
        .transform(BigInt)
        .refine((val) => val > 0n, {
        message: "Farmer ID must be a positive integer",
    }),
    purchaseId: zod_1.z
        .union([zod_1.z.string(), zod_1.z.number()])
        .transform(BigInt)
        .refine((val) => val > 0n, {
        message: "Purchase ID must be a positive integer",
    }),
});
/**
 * Zod schema for updating a farmer transaction.
 * All fields are optional to support partial updates.
 */
exports.zUpdateFarmerTransactionDto = zod_1.z.object({
    amountPaid: zod_1.z.number().min(0, "Amount paid cannot be negative").optional(),
    paymentStatus: paymentStatusEnum.optional(),
});
