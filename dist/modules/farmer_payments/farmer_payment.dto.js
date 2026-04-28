"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zUpdateFarmerPaymentDto = exports.zCreateFarmerPaymentDto = void 0;
//src/modules/farmer_payments/farmer_payment.dto.ts
/**
 * Data Transfer Objects (DTOs) for the FarmerPayment entity
 * These interfaces define the expected shape of data when creating or updating a farmer payment.
 * You can also use these types with validation libraries like Zod or Joi if needed.
 */
const zod_1 = require("zod");
/**
 * Zod schema for creating a new farmer payment.
 * Validates all required fields necessary for creation.
 */
exports.zCreateFarmerPaymentDto = zod_1.z.object({
    amount: zod_1.z.number().positive("Amount must be positive"),
    paymentMethod: zod_1.z.string().min(1, "Payment method is required"),
    paymentDate: zod_1.z
        .string()
        .datetime()
        .optional()
        .transform((val) => (val ? new Date(val) : undefined)),
    notes: zod_1.z.string().optional(),
    transactionId: zod_1.z
        .union([zod_1.z.string(), zod_1.z.number()])
        .transform(BigInt)
        .refine((val) => val > 0n, {
        message: "Transaction ID must be a positive integer",
    }),
    farmerFarmerId: zod_1.z
        .union([zod_1.z.string(), zod_1.z.number()])
        .transform(BigInt)
        .refine((val) => val > 0n, {
        message: "Farmer ID must be a positive integer",
    })
        .optional(),
});
/**
 * Zod schema for updating a farmer payment.
 * All fields are optional to support partial updates.
 */
exports.zUpdateFarmerPaymentDto = zod_1.z.object({
    amount: zod_1.z.number().positive("Amount must be positive").optional(),
    paymentMethod: zod_1.z.string().min(1, "Payment method is required").optional(),
    paymentDate: zod_1.z
        .string()
        .datetime()
        .optional()
        .transform((val) => (val ? new Date(val) : undefined)),
    notes: zod_1.z.string().optional(),
    transactionId: zod_1.z
        .union([zod_1.z.string(), zod_1.z.number()])
        .transform(BigInt)
        .refine((val) => val > 0n, {
        message: "Transaction ID must be a positive integer",
    })
        .optional(),
    farmerFarmerId: zod_1.z
        .union([zod_1.z.string(), zod_1.z.number()])
        .transform(BigInt)
        .refine((val) => val > 0n, {
        message: "Farmer ID must be a positive integer",
    })
        .optional(),
});
