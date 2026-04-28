"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWallet = createWallet;
exports.initiateDeposit = initiateDeposit;
exports.handleDepositeSuccess = handleDepositeSuccess;
exports.getPaymentStatus = getPaymentStatus;
exports.handleDepositeFailure = handleDepositeFailure;
exports.getAllWallets = getAllWallets;
exports.getCustomerWalletBalanace = getCustomerWalletBalanace;
exports.getWalletById = getWalletById;
exports.updateWallet = updateWallet;
exports.deleteWallet = deleteWallet;
/**
 * Service layer for Wallet entity operations.
 * Contains business logic and database interactions for wallets.
 */
const http_status_1 = __importDefault(require("http-status"));
const appError_1 = require("../../utils/appError");
const prismaClient_1 = __importDefault(require("../../prisma-client/prismaClient"));
const sendNotification_1 = require("../../utils/sendNotification");
const processPayment_1 = require("../../utils/processPayment");
const processWalletDeposite_1 = require("../../utils/processWalletDeposite");
/**
 * Create a new wallet
 * @param data - Data required to create a wallet
 * @returns The created wallet
 * @throws Error if the wallet cannot be created (e.g., duplicate customerId or invalid foreign key)
 */
async function createWallet(data) {
    // Check if a wallet already exists for the customer
    const existingWallet = await prismaClient_1.default.wallet.findUnique({
        where: { customerId: data.customerId },
    });
    if (existingWallet) {
        throw new appError_1.AppError("A wallet already exists for this customer", http_status_1.default.CONFLICT);
    }
    const wallet = await prismaClient_1.default.wallet.create({
        data: {
            customerId: data.customerId,
            balance: 0.0,
        },
    });
    return wallet;
}
async function initiateDeposit({ userId, amount, }) {
    // Get customer details
    const customer = await prismaClient_1.default.customer.findUnique({
        where: { userId: Number(userId) },
        include: {
            user: true,
            wallet: true,
        },
    });
    if (!customer) {
        throw new appError_1.AppError("Customer not found", http_status_1.default.NOT_FOUND);
    }
    // Create or get wallet
    let wallet = customer.wallet;
    if (!wallet) {
        wallet = await prismaClient_1.default.wallet.create({
            data: {
                customerId: customer.customerId,
                balance: 0.0,
            },
        });
    }
    return await (0, processWalletDeposite_1.processSSLCommerzWalletDeposite)(customer, amount);
}
async function handleDepositeSuccess(validationData) {
    try {
        // Validate payment with SSLCommerz  implementation
        const validation = await (0, processPayment_1.validateSSLCommerzPayment)(validationData);
        if (["VALID", "VALIDATED"].includes(validation.status)) {
            // Extract wallet ID
            const tranId = validationData.tran_id;
            // Find the wallet transaction
            const walletTransaction = await prismaClient_1.default.walletTransaction.findFirst({
                where: {
                    description: { contains: tranId },
                    transactionStatus: "PENDING",
                },
                include: {
                    wallet: true,
                },
            });
            if (!walletTransaction) {
                throw new appError_1.AppError("Wallet transaction not found", http_status_1.default.NOT_FOUND);
            }
            // Update wallet and wallet trasaction
            return await prismaClient_1.default.$transaction(async (tx) => {
                // Update wallet transaction status
                await tx.walletTransaction.update({
                    where: { transactionId: walletTransaction.transactionId },
                    data: {
                        transactionStatus: "COMPLETED",
                        description: `Trasaction completed by SSLCommerz. TransactionId: ${tranId}`,
                    },
                });
                // Update wallet balance
                const updatedWallet = await tx.wallet.update({
                    where: { walletId: walletTransaction.walletId },
                    data: {
                        balance: {
                            increment: walletTransaction.amount,
                        },
                        updatedAt: new Date(),
                    },
                    include: {
                        customer: true,
                    },
                });
                // Notify the Customer--
                const message = `অভিনন্দন! আপনার ওয়ালেটে ${walletTransaction.amount} টাকা সফলভাবে জমা হয়েছে। ধন্যবাদ আমাদের সাথে থাকার জন্য। (লেনদেন আইডি: ${tranId})`;
                await (0, sendNotification_1.sendNotification)(message, "WALLET", "CUSTOMER", updatedWallet.customer.userId, tx);
                return {
                    success: true,
                    message: "Wallet deposite completed successfully.",
                };
            });
        }
        else {
            throw new appError_1.AppError(`Payment validation failed: ${validation.failedreason || "Unknown validation error"}`, http_status_1.default.BAD_REQUEST);
        }
    }
    catch (error) {
        throw error;
    }
}
async function getPaymentStatus(tranId) {
    const transaction = await prismaClient_1.default.walletTransaction.findFirst({
        where: { description: { contains: tranId } },
        select: { transactionStatus: true },
    });
    return transaction?.transactionStatus || "NOT_FOUND";
}
/**
 * Handle SSLCommerz payment failure
 */
async function handleDepositeFailure(failureData) {
    try {
        // Extract order ID and update payment status
        const tranId = failureData.tran_id;
        // Find and update the wallet transaction
        const walletTransaction = await prismaClient_1.default.walletTransaction.findFirst({
            where: {
                description: { contains: tranId },
                transactionStatus: "PENDING",
            },
            include: {
                wallet: {
                    include: {
                        customer: true,
                    },
                },
            },
        });
        if (walletTransaction) {
            await prismaClient_1.default.$transaction(async (tx) => {
                await tx.walletTransaction.update({
                    where: { transactionId: walletTransaction.transactionId },
                    data: {
                        transactionStatus: "FAILED",
                        description: `Wallet deposite failed. TransactionId: ${tranId}`,
                    },
                });
                const message = `দুঃখিত! আপনার ওয়ালেটে টাকা জমা দেওয়া সম্ভব হয়নি। অনুগ্রহ করে আবার চেষ্টা করুন বা সহায়তার জন্য আমাদের সাথে যোগাযোগ করুন।`;
                await (0, sendNotification_1.sendNotification)(message, "WALLET", "CUSTOMER", walletTransaction.wallet.customer.userId, tx);
            });
        }
    }
    catch (error) {
        console.error("handleSSLCommerzFailure error:", error);
        throw error;
    }
}
/**
 * Retrieve all wallets
 * @returns An array of all wallets
 */
async function getAllWallets() {
    const wallets = await prismaClient_1.default.wallet.findMany();
    return wallets;
}
/**
 * Retrieve a wallet by its ID
 * @param userId - The ID of the user
 * @returns The wallet if found, or null if not found
 * @throws Error if the query fails
 */
async function getCustomerWalletBalanace(userId) {
    const customer = await prismaClient_1.default.customer.findUnique({
        where: { userId },
        include: { wallet: true },
    });
    if (!customer) {
        throw new appError_1.AppError("Customer not found", http_status_1.default.NOT_FOUND);
    }
    const wallet = await prismaClient_1.default.wallet.findUnique({
        where: { walletId: customer.wallet?.walletId },
    });
    if (!wallet) {
        throw new appError_1.AppError("Wallet not found", http_status_1.default.NOT_FOUND);
    }
    return wallet;
}
/**
 * Retrieve a wallet by its ID
 * @param walletId - The ID of the wallet
 * @returns The wallet if found, or null if not found
 * @throws Error if the query fails
 */
async function getWalletById(walletId) {
    const wallet = await prismaClient_1.default.wallet.findUnique({
        where: { walletId: Number(walletId) },
    });
    if (!wallet) {
        throw new appError_1.AppError("Wallet not found", http_status_1.default.NOT_FOUND);
    }
    const customer = await prismaClient_1.default.customer.findUnique({
        where: { userId: wallet?.customerId },
        include: { wallet: true },
    });
    if (!customer) {
        throw new appError_1.AppError("Customer not found", http_status_1.default.NOT_FOUND);
    }
    return wallet;
}
/**
 * Update a wallet by its ID
 * @param walletId - The ID of the wallet to update
 * @param data - Data to update the wallet
 * @returns The updated wallet
 * @throws Error if the wallet is not found, update fails, or customerId is already assigned
 */
async function updateWallet(walletId, data) {
    // If updating customerId, check for existing wallet with that customerId
    if (data.customerId) {
        const existingWallet = await prismaClient_1.default.wallet.findUnique({
            where: { customerId: data.customerId },
        });
        if (existingWallet && existingWallet.walletId !== walletId) {
            throw new appError_1.AppError("A wallet already exists for this customer", http_status_1.default.CONFLICT);
        }
    }
    const wallet = await prismaClient_1.default.wallet.update({
        where: { walletId: Number(walletId) },
        data: {
            customerId: data.customerId,
            balance: data.balance,
        },
    });
    return wallet;
}
/**
 * Delete a wallet by its ID
 * @param walletId - The ID of the wallet to delete
 * @throws Error if the wallet is not found or deletion fails
 */
async function deleteWallet(walletId) {
    const wallet = await prismaClient_1.default.wallet.findUnique({
        where: { walletId },
    });
    if (!wallet) {
        throw new appError_1.AppError("Wallet not found", http_status_1.default.NOT_FOUND);
    }
    await prismaClient_1.default.wallet.delete({
        where: { walletId },
    });
}
