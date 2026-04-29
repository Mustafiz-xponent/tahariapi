"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zDeleteWalletTransactionDto = exports.zGetWalletTransactionDto = exports.zUpdateWalletTransactionDto = exports.zCreateWalletTransactionDto = void 0;
const zod_1 = require("zod");
const client_1 = require("@/generated/prisma/client");
const zBigIntId = (fieldName) => zod_1.z
    .union([zod_1.z.string(), zod_1.z.number()])
    .refine((val) => val !== "", { message: `${fieldName} is required` })
    .transform((val) => BigInt(val))
    .refine((val) => val > 0n, {
    message: `${fieldName} must be a positive integer`,
});
/**
 * Zod schema for creating a new wallet transaction.
 * Validates all required fields necessary for creation.
 */
exports.zCreateWalletTransactionDto = {
    body: zod_1.z.object({
        amount: zod_1.z.number({ required_error: "Amount is required" }),
        transactionType: (0, zod_1.nativeEnum)(client_1.WalletTransactionType),
        transactionStatus: (0, zod_1.nativeEnum)(client_1.PaymentStatus),
        walletId: zBigIntId("Wallet ID"),
        orderId: zBigIntId("Order ID").optional(),
        description: zod_1.z.string().min(1, "Description must not be empty").optional(),
    }),
};
/**
 * Zod schema for updating a wallet transaction.
 * All fields are optional to support partial updates.
 */
exports.zUpdateWalletTransactionDto = {
    params: zod_1.z.object({
        id: zBigIntId("Wallet Transaction ID"),
    }),
    body: zod_1.z.object({
        amount: zod_1.z.number().optional(),
        transactionType: (0, zod_1.nativeEnum)(client_1.WalletTransactionType).optional(),
        transactionStatus: (0, zod_1.nativeEnum)(client_1.PaymentStatus).optional(),
        walletId: zBigIntId("Wallet ID").optional(),
        orderId: zBigIntId("Order ID").optional(),
        description: zod_1.z.string().min(1, "Description must not be empty").optional(),
    }),
};
/**
 * Zod schema for getting a wallet transaction by ID.
 */
exports.zGetWalletTransactionDto = {
    params: zod_1.z.object({
        id: zBigIntId("Wallet Transaction ID"),
    }),
};
/**
 * Zod schema for deleting a wallet transaction by ID.
 */
exports.zDeleteWalletTransactionDto = {
    params: zod_1.z.object({
        id: zBigIntId("Wallet Transaction ID"),
    }),
};
