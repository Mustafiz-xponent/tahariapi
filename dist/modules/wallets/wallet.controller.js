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
exports.deleteWallet = exports.updateWallet = exports.getWalletById = exports.getCustomerWalletBalanace = exports.getAllWallets = exports.handleSslCommerzIPN = exports.handleSslCommerzCancel = exports.handleSslCommerzFailure = exports.handleSslCommerzSuccess = exports.initiateWalletDeposit = exports.createWallet = void 0;
const http_status_1 = __importDefault(require("http-status"));
const asyncHandler_1 = __importDefault(require("@/utils/asyncHandler"));
const sendResponse_1 = __importDefault(require("@/utils/sendResponse"));
const walletService = __importStar(require("@/modules/wallets/wallet.service"));
/**
 * Create a new wallet
 */
exports.createWallet = (0, asyncHandler_1.default)(async (req, res) => {
    const wallet = await walletService.createWallet(req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.CREATED,
        message: "Wallet created successfully",
        data: wallet,
    });
});
/**
 * Initiate wallet deposit
 */
exports.initiateWalletDeposit = (0, asyncHandler_1.default)(async (req, res) => {
    const { amount } = req.body;
    const userId = req.user?.userId;
    const depositData = await walletService.initiateDeposit({
        userId: Number(userId),
        amount: parseFloat(amount),
    });
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Deposit initiated successfully",
        data: depositData,
    });
});
/**
 * Handle SSLCommerz success callback
 */
exports.handleSslCommerzSuccess = (0, asyncHandler_1.default)(async (req, res) => {
    const tranId = req.body.tran_id;
    const paymentStatus = await walletService.getPaymentStatus(tranId);
    if (paymentStatus === "COMPLETED") {
        res.redirect(`${process.env.PAYMENT_SUCCESS_DEEP_LINK}`);
    }
    else {
        res.redirect(`${process.env.PAYMENT_FAIL_DEEP_LINK}`);
    }
});
/**
 * Handle SSLCommerz failure callback
 */
exports.handleSslCommerzFailure = (0, asyncHandler_1.default)(async (req, res) => {
    await walletService.handleDepositeFailure(req.body);
    res.redirect(`${process.env.PAYMENT_FAIL_DEEP_LINK}`);
});
/**
 * Handle SSLCommerz cancel callback
 */
exports.handleSslCommerzCancel = (0, asyncHandler_1.default)(async (req, res) => {
    await walletService.handleDepositeFailure(req.body);
    res.redirect(`${process.env.PAYMENT_CANCEL_DEEP_LINK}`);
});
/**
 * Handle SSLCommerz IPN (Instant Payment Notification)
 */
const handleSslCommerzIPN = async (req, res) => {
    try {
        await walletService.handleDepositeSuccess(req.body);
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
exports.handleSslCommerzIPN = handleSslCommerzIPN;
/**
 * Get all wallets
 */
exports.getAllWallets = (0, asyncHandler_1.default)(async (req, res) => {
    const wallets = await walletService.getAllWallets();
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Wallets retrived successfully",
        data: wallets,
    });
});
/**
 * Get a customer wallet balance
 */
exports.getCustomerWalletBalanace = (0, asyncHandler_1.default)(async (req, res) => {
    const wallet = await walletService.getCustomerWalletBalanace(BigInt(req?.user?.userId));
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Wallet retrived successfully",
        data: wallet,
    });
});
/**
 * Get a single wallet by ID
 */
exports.getWalletById = (0, asyncHandler_1.default)(async (req, res) => {
    const walletId = req.params.id;
    const wallet = await walletService.getWalletById(walletId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Wallet retrived successfully",
        data: wallet,
    });
});
/**
 * Update a wallet by ID
 */
exports.updateWallet = (0, asyncHandler_1.default)(async (req, res) => {
    const walletId = req.params
        .id;
    const data = req.body;
    const updatedWallet = await walletService.updateWallet(walletId, data);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Wallet updated successfully",
        data: updatedWallet,
    });
});
/**
 * Delete a wallet by ID
 */
exports.deleteWallet = (0, asyncHandler_1.default)(async (req, res) => {
    const walletId = req.params
        .id;
    await walletService.deleteWallet(walletId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Wallet deleted successfully",
    });
});
