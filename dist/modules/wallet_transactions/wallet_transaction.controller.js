"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteWalletTransaction = exports.updateWalletTransaction = exports.getCustomerWalletTransactions = exports.getWalletTransactionById = exports.getAllWalletTransactions = exports.createWalletTransaction = void 0;
/**
 * Controller layer for WalletTransaction entity operations.
 * Handles HTTP requests and responses for wallet transaction-related endpoints.
 */
const http_status_1 = __importDefault(require("http-status"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const errorResponseHandler_1 = require("../../utils/errorResponseHandler");
const walletTransactionService = __importStar(require("../../modules/wallet_transactions/wallet_transaction.service"));
/**
 * Create a new wallet transaction
 */
const createWalletTransaction = async (req, res) => {
    try {
        const transaction = await walletTransactionService.createWalletTransaction(req.body);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.CREATED,
            message: "Wallet transaction created successfully",
            data: transaction,
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "create wallet transaction");
    }
};
exports.createWalletTransaction = createWalletTransaction;
/**
 * Get all wallet transactions
 */
const getAllWalletTransactions = async (_req, res) => {
    try {
        const transactions = await walletTransactionService.getAllWalletTransactions();
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Wallet transactions retrived successfully",
            data: transactions,
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "fetch wallet transactions");
    }
};
exports.getAllWalletTransactions = getAllWalletTransactions;
/**
 * Get a single wallet transaction by ID
 */
const getWalletTransactionById = async (req, res) => {
    try {
        const transactionId = req.params
            .id;
        const transaction = await walletTransactionService.getWalletTransactionById(transactionId);
        if (!transaction) {
            throw new Error("Wallet transaction not found");
        }
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Wallet transaction retrived successfully",
            data: transaction,
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "fetch wallet transaction");
    }
};
exports.getWalletTransactionById = getWalletTransactionById;
/**
 * Get a customer wallet transactions
 */
const getCustomerWalletTransactions = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100); // Max 100 items per page
        const skip = (page - 1) * limit;
        const sort = req.query.sort === "asc" ? "asc" : "desc";
        const transactionStatus = req.query.transactionStatus?.toUpperCase();
        const transactionType = req.query.transactionType?.toUpperCase();
        const paginationParams = { page, limit, skip, sort };
        const filterParams = { transactionStatus, transactionType };
        if (!req.user?.userId)
            throw new Error("Please login to continue");
        const userId = BigInt(req?.user?.userId);
        const result = await walletTransactionService.getCustomerWalletTransactions({ userId, paginationParams, filterParams });
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Wallet transactions retrived successfully",
            data: result.transactions,
            pagination: {
                currentPage: result.currentPage,
                totalPages: result.totalPages,
                totalItems: result.totalCount,
                itemsPerPage: limit,
                hasNextPage: page < result.totalPages,
                hasPreviousPage: page > 1,
            },
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "fetch wallet transaction");
    }
};
exports.getCustomerWalletTransactions = getCustomerWalletTransactions;
/**
 * Update a wallet transaction by ID
 */
const updateWalletTransaction = async (req, res) => {
    try {
        const data = req.body;
        const transactionId = req.params
            .id;
        const updated = await walletTransactionService.updateWalletTransaction(transactionId, data);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Wallet transaction updated successfully",
            data: updated,
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "update wallet transaction");
    }
};
exports.updateWalletTransaction = updateWalletTransaction;
/**
 * Delete a wallet transaction by ID
 */
const deleteWalletTransaction = async (req, res) => {
    try {
        const transactionId = req.params
            .id;
        await walletTransactionService.deleteWalletTransaction(transactionId);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Wallet transaction deleted successfully",
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "delete wallet transaction");
    }
};
exports.deleteWalletTransaction = deleteWalletTransaction;
