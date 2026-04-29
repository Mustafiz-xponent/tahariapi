"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFarmerTransaction = createFarmerTransaction;
exports.getAllFarmerTransactions = getAllFarmerTransactions;
exports.getFarmerTransactionById = getFarmerTransactionById;
exports.updateFarmerTransaction = updateFarmerTransaction;
exports.deleteFarmerTransaction = deleteFarmerTransaction;
exports.getTransactionsByFarmerId = getTransactionsByFarmerId;
exports.getTransactionsByPurchaseId = getTransactionsByPurchaseId;
/**
 * Service layer for FarmerTransaction entity operations.
 * Contains business logic and database interactions for farmer transactions.
 */
const prismaClient_1 = __importDefault(require("@/prisma-client/prismaClient"));
const errorHandler_1 = require("@/utils/errorHandler");
/**
 * Create a new farmer transaction
 * @param data - Data required to create a farmer transaction
 * @returns The created farmer transaction
 * @throws Error if the farmer transaction cannot be created (e.g., invalid foreign keys)
 */
async function createFarmerTransaction(data) {
    try {
        // Calculate the balance automatically
        const balance = data.amountDue - data.amountPaid;
        const farmerTransaction = await prismaClient_1.default.farmerTransaction.create({
            data: {
                amountDue: data.amountDue,
                amountPaid: data.amountPaid,
                balance: balance,
                paymentStatus: data.paymentStatus,
                farmerId: data.farmerId,
                purchaseId: data.purchaseId,
            },
            include: {
                farmer: true,
                inventoryPurchase: {
                    include: {
                        product: true,
                    },
                },
            },
        });
        return farmerTransaction;
    }
    catch (error) {
        throw new Error(`Failed to create farmer transaction: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Retrieve all farmer transactions
 * @returns An array of all farmer transactions
 * @throws Error if the query fails
 */
async function getAllFarmerTransactions() {
    try {
        const farmerTransactions = await prismaClient_1.default.farmerTransaction.findMany({
            include: {
                farmer: true,
                inventoryPurchase: {
                    include: {
                        product: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        return farmerTransactions;
    }
    catch (error) {
        throw new Error(`Failed to fetch farmer transactions: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Retrieve a farmer transaction by its ID
 * @param transactionId - The ID of the farmer transaction
 * @returns The farmer transaction if found, or null if not found
 * @throws Error if the query fails
 */
async function getFarmerTransactionById(transactionId) {
    try {
        const farmerTransaction = await prismaClient_1.default.farmerTransaction.findUnique({
            where: { transactionId },
            include: {
                farmer: true,
                inventoryPurchase: {
                    include: {
                        product: true,
                    },
                },
                farmerPayments: true,
            },
        });
        return farmerTransaction;
    }
    catch (error) {
        throw new Error(`Failed to fetch farmer transaction: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Update a farmer transaction by its ID
 * @param transactionId - The ID of the farmer transaction to update
 * @param data - Data to update the farmer transaction
 * @returns The updated farmer transaction
 * @throws Error if the farmer transaction is not found or update fails
 */
async function updateFarmerTransaction(transactionId, data) {
    try {
        // Fetch the existing transaction to calculate the new balance
        const existing = await prismaClient_1.default.farmerTransaction.findUnique({
            where: { transactionId },
        });
        if (!existing) {
            throw new Error("Farmer transaction not found");
        }
        // Calculate the new balance if amount paid is updated
        const amountPaid = data.amountPaid ?? existing.amountPaid;
        // Ensure both values are treated as numbers
        const balance = Number(existing.amountDue) - Number(amountPaid);
        const farmerTransaction = await prismaClient_1.default.farmerTransaction.update({
            where: { transactionId },
            data: {
                ...data,
                balance,
            },
            include: {
                farmer: true,
                inventoryPurchase: {
                    include: {
                        product: true,
                    },
                },
            },
        });
        return farmerTransaction;
    }
    catch (error) {
        throw new Error(`Failed to update farmer transaction: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Delete a farmer transaction by its ID
 * @param transactionId - The ID of the farmer transaction to delete
 * @throws Error if the farmer transaction is not found or deletion fails
 */
async function deleteFarmerTransaction(transactionId) {
    try {
        await prismaClient_1.default.farmerTransaction.delete({
            where: { transactionId },
        });
    }
    catch (error) {
        throw new Error(`Failed to delete farmer transaction: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Retrieve all transactions for a specific farmer
 * @param farmerId - The ID of the farmer
 * @returns An array of farmer transactions for the specified farmer
 * @throws Error if the query fails
 */
async function getTransactionsByFarmerId(farmerId) {
    try {
        const transactions = await prismaClient_1.default.farmerTransaction.findMany({
            where: { farmerId },
            include: {
                inventoryPurchase: {
                    include: {
                        product: true,
                    },
                },
                farmerPayments: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        return transactions;
    }
    catch (error) {
        throw new Error(`Failed to fetch transactions by farmer ID: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Retrieve all transactions for a specific purchase
 * @param purchaseId - The ID of the inventory purchase
 * @returns An array of farmer transactions for the specified purchase
 * @throws Error if the query fails
 */
async function getTransactionsByPurchaseId(purchaseId) {
    try {
        const transactions = await prismaClient_1.default.farmerTransaction.findMany({
            where: { purchaseId },
            include: {
                farmer: true,
                farmerPayments: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        return transactions;
    }
    catch (error) {
        throw new Error(`Failed to fetch transactions by purchase ID: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
