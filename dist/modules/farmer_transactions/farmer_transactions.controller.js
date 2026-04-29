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
exports.getTransactionsByPurchase = exports.getTransactionsByFarmer = exports.deleteFarmerTransaction = exports.updateFarmerTransaction = exports.getFarmerTransactionById = exports.getAllFarmerTransactions = exports.createFarmerTransaction = void 0;
/**
 * Controller layer for FarmerTransaction entity operations.
 * Handles HTTP requests and responses for farmer transaction-related endpoints.
 */
const zod_1 = require("zod");
const http_status_1 = __importDefault(require("http-status"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const errorResponseHandler_1 = require("../../utils/errorResponseHandler");
const farmerTransactionService = __importStar(require("../../modules/farmer_transactions/farmer_transactions.service"));
const farmer_transactions_dto_1 = require("../../modules/farmer_transactions/farmer_transactions.dto");
const transactionIdSchema = zod_1.z.coerce.bigint().refine((val) => val > 0n, {
    message: "Transaction ID must be a positive integer",
});
const purchaseIdSchema = zod_1.z.coerce.bigint().refine((val) => val > 0n, {
    message: "Transaction ID must be a positive integer",
});
const farmerIdSchema = zod_1.z.coerce.bigint().refine((val) => val > 0n, {
    message: "Transaction ID must be a positive integer",
});
/**
 * Create a new farmer transaction
 */
const createFarmerTransaction = async (req, res) => {
    try {
        const data = farmer_transactions_dto_1.zCreateFarmerTransactionDto.parse(req.body);
        const transaction = await farmerTransactionService.createFarmerTransaction(data);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.CREATED,
            message: "Farmer transaction created successfully",
            data: transaction,
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "create farmer transaction");
    }
};
exports.createFarmerTransaction = createFarmerTransaction;
/**
 * Get all farmer transactions
 */
const getAllFarmerTransactions = async (_req, res) => {
    try {
        const transactions = await farmerTransactionService.getAllFarmerTransactions();
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Farmer transactions retrieved successfully",
            data: transactions,
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "fetch farmer transactions");
    }
};
exports.getAllFarmerTransactions = getAllFarmerTransactions;
/**
 * Get a single farmer transaction by ID
 */
const getFarmerTransactionById = async (req, res) => {
    try {
        const transactionId = transactionIdSchema.parse(req.params.id);
        const transaction = await farmerTransactionService.getFarmerTransactionById(transactionId);
        if (!transaction) {
            (0, sendResponse_1.default)(res, {
                success: false,
                statusCode: http_status_1.default.NOT_FOUND,
                message: "Farmer transaction not found",
            });
            return;
        }
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Farmer transaction retrieved successfully",
            data: transaction,
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "fetch farmer transaction");
    }
};
exports.getFarmerTransactionById = getFarmerTransactionById;
/**
 * Update a farmer transaction by ID
 */
const updateFarmerTransaction = async (req, res) => {
    try {
        const transactionId = transactionIdSchema.parse(req.params.id);
        const data = farmer_transactions_dto_1.zUpdateFarmerTransactionDto.parse(req.body);
        const updated = await farmerTransactionService.updateFarmerTransaction(transactionId, data);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Farmer transaction updated successfully",
            data: updated,
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "update farmer transaction");
    }
};
exports.updateFarmerTransaction = updateFarmerTransaction;
/**
 * Delete a farmer transaction by ID
 */
const deleteFarmerTransaction = async (req, res) => {
    try {
        const transactionId = transactionIdSchema.parse(req.params.id);
        await farmerTransactionService.deleteFarmerTransaction(transactionId);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Farmer transaction deleted successfully",
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "delete farmer transaction");
    }
};
exports.deleteFarmerTransaction = deleteFarmerTransaction;
/**
 * Get all transactions by a specific farmer
 */
const getTransactionsByFarmer = async (req, res) => {
    try {
        const farmerId = farmerIdSchema.parse(req.params.farmerId);
        const transactions = await farmerTransactionService.getTransactionsByFarmerId(farmerId);
        res.json({
            success: true,
            message: "Farmer transactions retrieved successfully",
            data: transactions,
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "fetch farmer transactions by farmer");
    }
};
exports.getTransactionsByFarmer = getTransactionsByFarmer;
/**
 * Get all transactions for a specific purchase
 */
const getTransactionsByPurchase = async (req, res) => {
    try {
        const purchaseId = purchaseIdSchema.parse(req.params.purchaseId);
        const transactions = await farmerTransactionService.getTransactionsByPurchaseId(purchaseId);
        res.json({
            success: true,
            message: "Farmer transactions retrieved successfully",
            data: transactions,
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "fetch farmer transactions by purchase");
    }
};
exports.getTransactionsByPurchase = getTransactionsByPurchase;
