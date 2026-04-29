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
exports.deletePayment = exports.updatePayment = exports.getPaymentById = exports.getAllPayments = exports.handleSSLCommerzIPN = exports.handleSSLCommerzCancel = exports.handleSSLCommerzFailure = exports.handleSSLCommerzSuccess = exports.createPayment = void 0;
/**
 * Controller layer for Payment entity operations.
 * Handles HTTP requests and responses for payment-related endpoints.
 */
const zod_1 = require("zod");
const http_status_1 = __importDefault(require("http-status"));
const sendResponse_1 = __importDefault(require("@/utils/sendResponse"));
const errorResponseHandler_1 = require("@/utils/errorResponseHandler");
const paymentService = __importStar(require("@/modules/payments/payment.service"));
const payment_dto_1 = require("@/modules/payments/payment.dto");
const paymentIdSchema = zod_1.z.coerce.bigint().refine((val) => val > 0n, {
    message: "Payment ID must be a positive integer",
});
/**
 * Create a new payment
 */
const createPayment = async (req, res) => {
    try {
        const data = payment_dto_1.zCreatePaymentDto.parse(req.body);
        const payment = await paymentService.createPayment(data);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.CREATED,
            message: "Payment created successfully",
            data: payment,
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "create payment");
    }
};
exports.createPayment = createPayment;
/**
 * Handle SSLCommerz success callback
 */
const handleSSLCommerzSuccess = async (req, res) => {
    try {
        const tranId = req.body.tran_id;
        const paymentStatus = await paymentService.getOrderPaymentStatus(tranId);
        if (paymentStatus.paymentStatus === "COMPLETED") {
            res.redirect(`${process.env.PAYMENT_SUCCESS_DEEP_LINK}`);
        }
        else {
            res.redirect(`${process.env.PAYMENT_FAIL_DEEP_LINK}`);
        }
    }
    catch (error) {
        res.redirect(`${process.env.PAYMENT_FAIL_DEEP_LINK}`);
    }
};
exports.handleSSLCommerzSuccess = handleSSLCommerzSuccess;
/**
 * Handle SSLCommerz failure callback
 */
const handleSSLCommerzFailure = async (req, res) => {
    try {
        await paymentService.handleSSLCommerzFailure(req.body);
        res.redirect(`${process.env.PAYMENT_FAIL_DEEP_LINK}`);
    }
    catch (error) {
        res.redirect(`${process.env.PAYMENT_FAIL_DEEP_LINK}`);
    }
};
exports.handleSSLCommerzFailure = handleSSLCommerzFailure;
/**
 * Handle SSLCommerz cancel callback
 */
const handleSSLCommerzCancel = async (req, res) => {
    try {
        await paymentService.handleSSLCommerzFailure(req.body);
        res.redirect(`${process.env.PAYMENT_CANCEL_DEEP_LINK}`);
    }
    catch (error) {
        res.redirect(`${process.env.PAYMENT_FAIL_DEEP_LINK}`);
    }
};
exports.handleSSLCommerzCancel = handleSSLCommerzCancel;
/**
 * Handle SSLCommerz IPN (Instant Payment Notification)
 */
const handleSSLCommerzIPN = async (req, res) => {
    try {
        await paymentService.handleSSLCommerzSuccess(req.body);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "IPN received successfully",
        });
    }
    catch (error) {
        (0, sendResponse_1.default)(res, {
            success: false,
            statusCode: http_status_1.default.INTERNAL_SERVER_ERROR,
            message: "IPN failed",
        });
    }
};
exports.handleSSLCommerzIPN = handleSSLCommerzIPN;
/**
 * Get all payments
 */
const getAllPayments = async (req, res) => {
    try {
        // Read optional query param
        const { paymentStatus } = req.query;
        const payments = await paymentService.getAllPayments(paymentStatus);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Payments fetched successfully",
            data: payments,
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "fetch payments");
    }
};
exports.getAllPayments = getAllPayments;
/**
 * Get a single payment by ID
 */
const getPaymentById = async (req, res) => {
    try {
        const paymentId = paymentIdSchema.parse(req.params.id);
        const payment = await paymentService.getPaymentById(paymentId);
        if (!payment) {
            throw new Error("Payment not found");
        }
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Payment retrived successfully",
            data: payment,
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "fetch payment");
    }
};
exports.getPaymentById = getPaymentById;
/**
 * Update a payment by ID
 */
const updatePayment = async (req, res) => {
    try {
        const paymentId = paymentIdSchema.parse(req.params.id);
        const data = payment_dto_1.zUpdatePaymentDto.parse(req.body);
        const updatedPayment = await paymentService.updatePayment(paymentId, data);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Payment updated successfully",
            data: updatedPayment,
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "update payment");
    }
};
exports.updatePayment = updatePayment;
/**
 * Delete a payment by ID
 */
const deletePayment = async (req, res) => {
    try {
        const paymentId = paymentIdSchema.parse(req.params.id);
        await paymentService.deletePayment(paymentId);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Payment deleted successfully",
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "delete payment");
    }
};
exports.deletePayment = deletePayment;
