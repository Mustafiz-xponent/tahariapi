"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zDeleteWalletDto = exports.zUpdateWalletDto = exports.zGetWalletDto = exports.zDepositeWalletDto = exports.zCreateWalletDto = void 0;
/**
 * Data Transfer Objects (DTOs) for the Wallet entity
 * These interfaces define the expected shape of data when creating or updating a wallet.
 * You can also use these types with validation libraries like Zod or Joi if needed.
 */
const zod_1 = require("zod");
/**
 * Zod schema for creating a new wallet.
 * Validates all required fields necessary for creation.
 */
exports.zCreateWalletDto = {
    body: zod_1.z.object({
        customerId: zod_1.z
            .union([zod_1.z.string(), zod_1.z.number()])
            .transform(BigInt)
            .refine((val) => val > 0n, {
            message: "Customer ID must be a positive integer",
        }),
    }),
};
/**
 * Zod schema for wallet deposite
 * Validates all required fields necessary for wallet deposite.
 */
exports.zDepositeWalletDto = {
    body: zod_1.z
        .object({
        amount: zod_1.z.number().nonnegative("Amount must be non-negative"),
    })
        .strict(),
};
/**
 * Zod schema for getting single wallet by ID
 */
exports.zGetWalletDto = {
    params: zod_1.z.object({
        id: zod_1.z
            .union([zod_1.z.string(), zod_1.z.number()])
            .transform(BigInt)
            .refine((val) => val > 0n, {
            message: "Wallet ID must be a positive integer",
        }),
    }),
};
/**
 * Zod schema for updating a wallet.
 * All fields are optional to support partial updates.
 */
exports.zUpdateWalletDto = {
    params: zod_1.z.object({
        id: zod_1.z
            .union([zod_1.z.string(), zod_1.z.number()])
            .transform(BigInt)
            .refine((val) => val > 0n, {
            message: "Wallet ID must be a positive integer",
        }),
    }),
    body: zod_1.z.object({
        customerId: zod_1.z
            .union([zod_1.z.string(), zod_1.z.number()])
            .transform(BigInt)
            .refine((val) => val > 0n, {
            message: "Customer ID must be a positive integer",
        })
            .optional(),
        balance: zod_1.z.number().nonnegative("Balance must be non-negative").optional(),
    }),
};
/**
 * Zod schema for deleting a wallet.
 */
exports.zDeleteWalletDto = {
    params: zod_1.z.object({
        id: zod_1.z
            .union([zod_1.z.string(), zod_1.z.number()])
            .transform(BigInt)
            .refine((val) => val > 0n, {
            message: "Wallet ID must be a positive integer",
        }),
    }),
};
