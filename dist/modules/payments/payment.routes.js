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
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Routes for Payment entity operations.
 * Defines API endpoints for payment-related CRUD operations.
 */
const express_1 = require("express");
const client_1 = require("../../generated/prisma/client");
const auth_1 = require("../../middlewares/auth");
const PaymentController = __importStar(require("../../modules/payments/payment.controller"));
const router = (0, express_1.Router)();
// Route to create a new payment
router.post("/", PaymentController.createPayment);
// Route to get all payments
router.get("/", auth_1.authMiddleware, (0, auth_1.authorizeRoles)(client_1.UserRole.ADMIN, client_1.UserRole.SUPER_ADMIN), PaymentController.getAllPayments);
// Route to get a payment by ID
router.get("/:id", PaymentController.getPaymentById);
// Route to update a payment's details
router.put("/:id", PaymentController.updatePayment);
// Route to delete a payment
router.delete("/:id", PaymentController.deletePayment);
// SSLCommerz callback routes
router.post("/sslcommerz/success", PaymentController.handleSSLCommerzSuccess);
router.post("/sslcommerz/fail", PaymentController.handleSSLCommerzFailure);
router.post("/sslcommerz/cancel", PaymentController.handleSSLCommerzCancel);
router.post("/sslcommerz/ipn", PaymentController.handleSSLCommerzIPN);
exports.default = router;
