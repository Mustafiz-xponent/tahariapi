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
 * Routes for FarmerPayment entity operations.
 * Defines API endpoints for farmer payment-related CRUD operations.
 */
const express_1 = require("express");
const FarmerPaymentController = __importStar(require("../../modules/farmer_payments/farmer_payment.controller"));
const router = (0, express_1.Router)();
// Route to create a new farmer payment
router.post("/", FarmerPaymentController.createFarmerPayment);
// Route to get all farmer payments
router.get("/", FarmerPaymentController.getAllFarmerPayments);
// Route to get a farmer payment by ID
router.get("/:id", FarmerPaymentController.getFarmerPaymentById);
// Route to update a farmer payment's details
router.put("/:id", FarmerPaymentController.updateFarmerPayment);
// Route to delete a farmer payment
router.delete("/:id", FarmerPaymentController.deleteFarmerPayment);
exports.default = router;
