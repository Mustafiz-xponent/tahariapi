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
 * Routes for Customer authentication operations.
 * Defines API endpoints for customer authentication.
 */
const express_1 = require("express");
const client_1 = require("../../../generated/prisma/client");
const auth_1 = require("../../../middlewares/auth");
const CustomerController = __importStar(require("../../../modules/auth/customer/customer.controller"));
const router = (0, express_1.Router)();
// Route to register a customer
router.post("/register", CustomerController.registerCustomer);
// Route to login a customer with email/phone and password
router.post("/login", CustomerController.loginCustomer);
// Route to initiate OTP login for customer
router.post("/otp-login", CustomerController.otpLoginCustomer);
// Route to verify OTP for customer
router.post("/verify-otp", CustomerController.verifyCustomerOtp);
// Route to update customer profile by ID
router.put("/:id", auth_1.authMiddleware, (0, auth_1.authorizeRoles)(client_1.UserRole.CUSTOMER), CustomerController.updateCustomerProfile);
// Route to get customer by ID
router.get("/:id", auth_1.authMiddleware, (0, auth_1.authorizeRoles)(client_1.UserRole.CUSTOMER), CustomerController.getCustomerById);
exports.default = router;
