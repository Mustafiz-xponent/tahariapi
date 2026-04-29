"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStockTransaction = createStockTransaction;
exports.getAllStockTransactions = getAllStockTransactions;
exports.getStockTransactionById = getStockTransactionById;
exports.updateStockTransaction = updateStockTransaction;
exports.deleteStockTransaction = deleteStockTransaction;
/**
 * Service layer for StockTransaction entity operations.
 * Contains business logic and database interactions for stock transactions.
 */
const prismaClient_1 = __importDefault(require("@/prisma-client/prismaClient"));
const errorHandler_1 = require("@/utils/errorHandler");
// /**
//  * Create a new stock transaction
//  * @param data - Data required to create a stock transaction
//  * @returns The created stock transaction
//  * @throws Error if the stock transaction cannot be created (e.g., invalid foreign keys)
//  */
// export async function createStockTransaction(
//   data: CreateStockTransactionDto
// ): Promise<StockTransaction> {
//   try {
//     const stockTransaction = await prisma.stockTransaction.create({
//       data: {
//         quantity: data.quantity,
//         transactionType: data.transactionType,
//         productId: data.productId,
//         purchaseId: data.purchaseId,
//         orderId: data.orderId,
//         description: data.description,
//       },
//     });
//     return stockTransaction;
//   } catch (error) {
//     throw new Error(
//       `Failed to create stock transaction: ${getErrorMessage(error)}`
//     );
//   }
// }
/**
 * Create stock transactions - processes array of transaction data
 * @param data - Array of transaction data
 * @returns Array of created StockTransactions
 * @throws Error if the stock transactions cannot be created
 */
async function createStockTransaction(data) {
    try {
        // Use Prisma transaction to ensure atomicity - all succeed or all fail
        const createdTransactions = await prismaClient_1.default.$transaction(async (tx) => {
            const results = [];
            for (const transactionData of data) {
                const stockTransaction = await tx.stockTransaction.create({
                    data: {
                        quantity: transactionData.quantity,
                        transactionType: transactionData.transactionType,
                        productId: transactionData.productId,
                        purchaseId: transactionData.purchaseId,
                        orderId: transactionData.orderId,
                        description: transactionData.description,
                    },
                });
                results.push(stockTransaction);
            }
            return results;
        });
        return createdTransactions;
    }
    catch (error) {
        throw new Error(`Failed to create stock transactions: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Retrieve all stock transactions
 * @returns An array of all stock transactions
 * @throws Error if the query fails
 */
async function getAllStockTransactions() {
    try {
        const stockTransactions = await prismaClient_1.default.stockTransaction.findMany();
        return stockTransactions;
    }
    catch (error) {
        throw new Error(`Failed to fetch stock transactions: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Retrieve a stock transaction by its ID
 * @param transactionId - The ID of the stock transaction
 * @returns The stock transaction if found, or null if not found
 * @throws Error if the query fails
 */
async function getStockTransactionById(transactionId) {
    try {
        const stockTransaction = await prismaClient_1.default.stockTransaction.findUnique({
            where: { transactionId: Number(transactionId) },
        });
        return stockTransaction;
    }
    catch (error) {
        throw new Error(`Failed to fetch stock transaction: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Update a stock transaction by its ID
 * @param transactionId - The ID of the stock transaction to update
 * @param data - Data to update the stock transaction
 * @returns The updated stock transaction
 * @throws Error if the stock transaction is not found or update fails
 */
async function updateStockTransaction(transactionId, data) {
    try {
        const stockTransaction = await prismaClient_1.default.stockTransaction.update({
            where: { transactionId: Number(transactionId) },
            data: {
                quantity: data.quantity,
                transactionType: data.transactionType,
                productId: data.productId,
                purchaseId: data.purchaseId,
                orderId: data.orderId,
                description: data.description,
            },
        });
        return stockTransaction;
    }
    catch (error) {
        throw new Error(`Failed to update stock transaction: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Delete a stock transaction by its ID
 * @param transactionId - The ID of the stock transaction to delete
 * @throws Error if the stock transaction is not found or deletion fails
 */
async function deleteStockTransaction(transactionId) {
    try {
        await prismaClient_1.default.stockTransaction.delete({
            where: { transactionId: Number(transactionId) },
        });
    }
    catch (error) {
        throw new Error(`Failed to delete stock transaction: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
