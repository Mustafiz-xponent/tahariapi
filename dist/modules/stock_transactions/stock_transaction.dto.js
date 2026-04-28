"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zUpdateStockTransactionDto = exports.zCreateStockTransactionArrayDto = exports.zCreateStockTransactionDto = void 0;
// src/modules/stock_transactions/stock_transaction.dto.ts
/**
 * Data Transfer Objects (DTOs) for the StockTransaction entity
 * These interfaces define the expected shape of data when creating or updating a stock transaction.
 * You can also use these types with validation libraries like Zod or Joi if needed.
 */
const zod_1 = require("zod");
// Assuming TransactionType enum values (adjust based on your Prisma schema)
const transactionTypeEnum = zod_1.z.enum(["IN", "OUT", "ADJUSTMENT"]);
/**
 * Zod schema for creating a new stock transaction.
 * Validates all required fields necessary for creation.
 */
exports.zCreateStockTransactionDto = zod_1.z.object({
    quantity: zod_1.z.number().int().positive("Quantity must be a positive integer"),
    transactionType: transactionTypeEnum,
    productId: zod_1.z
        .union([zod_1.z.string(), zod_1.z.number()])
        .transform(BigInt)
        .refine((val) => val > 0n, {
        message: "Product ID must be a positive integer",
    }),
    purchaseId: zod_1.z
        .union([zod_1.z.string(), zod_1.z.number()])
        .transform(BigInt)
        .refine((val) => val > 0n, {
        message: "Purchase ID must be a positive integer",
    })
        .optional(),
    orderId: zod_1.z
        .union([zod_1.z.string(), zod_1.z.number()])
        .transform(BigInt)
        .refine((val) => val > 0n, {
        message: "Order ID must be a positive integer",
    })
        .optional(),
    description: zod_1.z.string().optional(),
});
/**
 * Zod schema for creating stock transactions - always expects an array
 */
exports.zCreateStockTransactionArrayDto = zod_1.z
    .array(exports.zCreateStockTransactionDto)
    .min(1, "At least one transaction is required")
    .max(100, "Maximum 100 transactions allowed per request");
/**
 * Zod schema for updating a stock transaction.
 * All fields are optional to support partial updates.
 */
exports.zUpdateStockTransactionDto = zod_1.z.object({
    quantity: zod_1.z
        .number()
        .int()
        .positive("Quantity must be a positive integer")
        .optional(),
    transactionType: transactionTypeEnum.optional(),
    productId: zod_1.z
        .union([zod_1.z.string(), zod_1.z.number()])
        .transform(BigInt)
        .refine((val) => val > 0n, {
        message: "Product ID must be a positive integer",
    })
        .optional(),
    purchaseId: zod_1.z
        .union([zod_1.z.string(), zod_1.z.number()])
        .transform(BigInt)
        .refine((val) => val > 0n, {
        message: "Purchase ID must be a positive integer",
    })
        .optional(),
    orderId: zod_1.z
        .union([zod_1.z.string(), zod_1.z.number()])
        .transform(BigInt)
        .refine((val) => val > 0n, {
        message: "Order ID must be a positive integer",
    })
        .optional(),
    description: zod_1.z.string().optional(),
});
