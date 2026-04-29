"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWalletTransaction = createWalletTransaction;
exports.getAllWalletTransactions = getAllWalletTransactions;
exports.getWalletTransactionById = getWalletTransactionById;
exports.getCustomerWalletTransactions = getCustomerWalletTransactions;
exports.updateWalletTransaction = updateWalletTransaction;
exports.deleteWalletTransaction = deleteWalletTransaction;
/**
 * Service layer for WalletTransaction entity operations.
 * Contains business logic and database interactions for wallet transactions.
 */
const prismaClient_1 = __importDefault(require("@/prisma-client/prismaClient"));
const errorHandler_1 = require("@/utils/errorHandler");
/**
 * Create a new wallet transaction
 * @param data - Data required to create a wallet transaction
 * @returns The created wallet transaction
 * @throws Error if the transaction cannot be created (e.g., invalid walletId or orderId)
 */
async function createWalletTransaction(data) {
    try {
        // Validate walletId existence
        const wallet = await prismaClient_1.default.wallet.findUnique({
            where: { walletId: data.walletId },
        });
        if (!wallet) {
            throw new Error("Wallet not found");
        }
        // Validate orderId existence if provided
        if (data.orderId) {
            const order = await prismaClient_1.default.order.findUnique({
                where: { orderId: data.orderId },
            });
            if (!order) {
                throw new Error("Order not found");
            }
        }
        const transaction = await prismaClient_1.default.walletTransaction.create({
            data: {
                amount: data.amount,
                transactionType: data.transactionType,
                transactionStatus: data.transactionStatus,
                description: data.description,
                walletId: data.walletId,
                orderId: data.orderId,
            },
        });
        return transaction;
    }
    catch (error) {
        throw new Error(`Failed to create wallet transaction: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Retrieve all wallet transactions
 * @returns An array of all wallet transactions
 * @throws Error if the query fails
 */
async function getAllWalletTransactions() {
    try {
        const transactions = await prismaClient_1.default.walletTransaction.findMany();
        return transactions;
    }
    catch (error) {
        throw new Error(`Failed to fetch wallet transactions: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Retrieve a wallet transaction by its ID
 * @param transactionId - The ID of the wallet transaction
 * @returns The wallet transaction if found, or null if not found
 * @throws Error if the query fails
 */
async function getWalletTransactionById(transactionId) {
    try {
        const transaction = await prismaClient_1.default.walletTransaction.findUnique({
            where: { transactionId: Number(transactionId) },
        });
        return transaction;
    }
    catch (error) {
        throw new Error(`Failed to fetch wallet transaction: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Retrieve a wallet transaction by its ID
 * @param userId @param paginationParams @param filterParams
 * @returns The wallet transaction
 * @throws Error if the query fails
 */
async function getCustomerWalletTransactions({ userId, paginationParams, filterParams, }) {
    try {
        const customer = await prismaClient_1.default.customer.findUnique({
            where: { userId },
            include: { wallet: true },
        });
        if (!customer)
            throw new Error("Customer not found");
        const { page, limit, skip, sort } = paginationParams;
        const { transactionStatus, transactionType } = filterParams;
        const whereClause = {
            walletId: customer.wallet?.walletId,
        };
        if (transactionStatus)
            whereClause.transactionStatus = transactionStatus;
        if (transactionType)
            whereClause.transactionType = transactionType;
        const transactions = await prismaClient_1.default.walletTransaction.findMany({
            where: whereClause,
            take: limit,
            skip: skip,
            orderBy: {
                createdAt: sort === "asc" ? "asc" : "desc",
            },
        });
        if (!transactions) {
            throw new Error("Wallet transactions not found");
        }
        const totalTransactions = await prismaClient_1.default.walletTransaction.count({
            where: whereClause,
        });
        return {
            transactions,
            currentPage: page,
            totalPages: Math.ceil(totalTransactions / limit),
            totalCount: totalTransactions,
        };
    }
    catch (error) {
        throw new Error(`Failed to fetch wallet transaction: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Update a wallet transaction by its ID
 * @param transactionId - The ID of the wallet transaction to update
 * @param data - Data to update the wallet transaction
 * @returns The updated wallet transaction
 * @throws Error if the transaction is not found or update fails
 */
async function updateWalletTransaction(transactionId, data) {
    try {
        // Validate walletId existence if provided
        if (data.walletId) {
            const wallet = await prismaClient_1.default.wallet.findUnique({
                where: { walletId: data.walletId },
            });
            if (!wallet) {
                throw new Error("Wallet not found");
            }
        }
        // Validate orderId existence if provided
        if (data.orderId) {
            const order = await prismaClient_1.default.order.findUnique({
                where: { orderId: data.orderId },
            });
            if (!order) {
                throw new Error("Order not found");
            }
        }
        const transaction = await prismaClient_1.default.walletTransaction.update({
            where: { transactionId: Number(transactionId) },
            data: {
                amount: data.amount,
                transactionType: data.transactionType,
                transactionStatus: data.transactionStatus,
                description: data.description,
                walletId: data.walletId,
                orderId: data.orderId,
            },
        });
        return transaction;
    }
    catch (error) {
        throw new Error(`Failed to update wallet transaction: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Delete a wallet transaction by its ID
 * @param transactionId - The ID of the wallet transaction to delete
 * @throws Error if the transaction is not found or deletion fails
 */
async function deleteWalletTransaction(transactionId) {
    try {
        await prismaClient_1.default.walletTransaction.delete({
            where: { transactionId: Number(transactionId) },
        });
    }
    catch (error) {
        throw new Error(`Failed to delete wallet transaction: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
