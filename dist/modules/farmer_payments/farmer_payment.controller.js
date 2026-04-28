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
exports.deleteFarmerPayment = exports.updateFarmerPayment = exports.getFarmerPaymentById = exports.getAllFarmerPayments = exports.createFarmerPayment = void 0;
// src/modules/farmer_payments/farmer_payment.controller.ts
/**
 * Controller layer for FarmerPayment entity operations.
 * Handles HTTP requests and responses for farmer payment-related endpoints.
 */
const zod_1 = require("zod");
const http_status_1 = __importDefault(require("http-status"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const errorResponseHandler_1 = require("../../utils/errorResponseHandler");
const farmerPaymentService = __importStar(require("../../modules/farmer_payments/farmer_payment.service"));
const farmer_payment_dto_1 = require("../../modules/farmer_payments/farmer_payment.dto");
const paymentIdSchema = zod_1.z.coerce.bigint().refine((val) => val > 0n, {
    message: "Payment ID must be a positive integer",
});
/**
 * Create a new farmer payment
 */
const createFarmerPayment = async (req, res) => {
    try {
        const data = farmer_payment_dto_1.zCreateFarmerPaymentDto.parse(req.body);
        const payment = await farmerPaymentService.createFarmerPayment(data);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.CREATED,
            message: "Farmer payment created successfully",
            data: payment,
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "create farmer payment");
    }
};
exports.createFarmerPayment = createFarmerPayment;
/**
 * Get all farmer payments
 */
const getAllFarmerPayments = async (_req, res) => {
    try {
        const payments = await farmerPaymentService.getAllFarmerPayments();
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Farmer payments retrieved successfully",
            data: payments,
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "fetch farmer payments");
    }
};
exports.getAllFarmerPayments = getAllFarmerPayments;
/**
 * Get a single farmer payment by ID
 */
const getFarmerPaymentById = async (req, res) => {
    try {
        const paymentId = paymentIdSchema.parse(req.params.id);
        const payment = await farmerPaymentService.getFarmerPaymentById(paymentId);
        if (!payment) {
            throw new Error("Farmer payment not found");
        }
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Farmer payment retrieved successfully",
            data: payment,
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "fetch farmer payment");
    }
};
exports.getFarmerPaymentById = getFarmerPaymentById;
/**
 * Update a farmer payment by ID
 */
const updateFarmerPayment = async (req, res) => {
    try {
        const paymentId = paymentIdSchema.parse(req.params.id);
        const data = farmer_payment_dto_1.zUpdateFarmerPaymentDto.parse(req.body);
        const updated = await farmerPaymentService.updateFarmerPayment(paymentId, data);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Farmer payment updated successfully",
            data: updated,
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "update farmer payment");
    }
};
exports.updateFarmerPayment = updateFarmerPayment;
/**
 * Delete a farmer payment by ID
 */
const deleteFarmerPayment = async (req, res) => {
    try {
        const paymentId = paymentIdSchema.parse(req.params.id);
        await farmerPaymentService.deleteFarmerPayment(paymentId);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Farmer payment deleted successfully",
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "delete farmer payment");
    }
};
exports.deleteFarmerPayment = deleteFarmerPayment;
