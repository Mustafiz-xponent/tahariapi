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
exports.deleteStockTransaction = exports.updateStockTransaction = exports.getStockTransactionById = exports.getAllStockTransactions = exports.createStockTransaction = void 0;
// src/modules/stock_transactions/stock_transaction.controller.ts
/**
 * Controller layer for StockTransaction entity operations.
 * Handles HTTP requests and responses for stock transaction-related endpoints.
 */
const zod_1 = require("zod");
const http_status_1 = __importDefault(require("http-status"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const errorResponseHandler_1 = require("../../utils/errorResponseHandler");
const stockTransactionService = __importStar(require("../../modules/stock_transactions/stock_transaction.service"));
const stock_transaction_dto_1 = require("../../modules/stock_transactions/stock_transaction.dto");
const transactionIdSchema = zod_1.z.coerce.bigint().refine((val) => val > 0n, {
    message: "Transaction ID must be a positive integer",
});
/**
 * Create stock transaction(s) - always processes array of transactions
 */
const createStockTransaction = async (req, res) => {
    try {
        const data = stock_transaction_dto_1.zCreateStockTransactionArrayDto.parse(req.body);
        const transactions = await stockTransactionService.createStockTransaction(data);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.CREATED,
            message: `${transactions.length} stock transaction${transactions.length > 1 ? "s" : ""} created successfully`,
            data: transactions,
            meta: { count: transactions.length },
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "create stock transaction");
    }
};
exports.createStockTransaction = createStockTransaction;
/**
 * Get all stock transactions
 */
const getAllStockTransactions = async (_req, res) => {
    try {
        const transactions = await stockTransactionService.getAllStockTransactions();
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Stock transactions retrieved successfully",
            data: transactions,
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "fetch stock transactions");
    }
};
exports.getAllStockTransactions = getAllStockTransactions;
/**
 * Get a single stock transaction by ID
 */
const getStockTransactionById = async (req, res) => {
    try {
        const transactionId = transactionIdSchema.parse(req.params.id);
        const transaction = await stockTransactionService.getStockTransactionById(transactionId);
        if (!transaction) {
            throw new Error("Stock transaction not found");
        }
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Stock transaction retrieved successfully",
            data: transaction,
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "fetch stock transaction");
    }
};
exports.getStockTransactionById = getStockTransactionById;
/**
 * Update a stock transaction by ID
 */
const updateStockTransaction = async (req, res) => {
    try {
        const transactionId = transactionIdSchema.parse(req.params.id);
        const data = stock_transaction_dto_1.zUpdateStockTransactionDto.parse(req.body);
        const updated = await stockTransactionService.updateStockTransaction(transactionId, data);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Stock transaction updated successfully",
            data: updated,
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "update stock transaction");
    }
};
exports.updateStockTransaction = updateStockTransaction;
/**
 * Delete a stock transaction by ID
 */
const deleteStockTransaction = async (req, res) => {
    try {
        const transactionId = transactionIdSchema.parse(req.params.id);
        await stockTransactionService.deleteStockTransaction(transactionId);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Stock transaction deleted successfully",
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "delete stock transaction");
    }
};
exports.deleteStockTransaction = deleteStockTransaction;
