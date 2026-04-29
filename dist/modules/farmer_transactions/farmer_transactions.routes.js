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
 * Routes for FarmerTransaction entity operations.
 * Defines API endpoints for farmer transaction-related CRUD operations.
 */
const express_1 = require("express");
const client_1 = require("../../generated/prisma/client");
const auth_1 = require("../../middlewares/auth");
const FarmerTransactionController = __importStar(require("../../modules/farmer_transactions/farmer_transactions.controller"));
const router = (0, express_1.Router)();
// Route to create a new farmer transaction
router.post("/", auth_1.authMiddleware, (0, auth_1.authorizeRoles)(client_1.UserRole.ADMIN, client_1.UserRole.SUPER_ADMIN), FarmerTransactionController.createFarmerTransaction);
// Route to get all farmer transactions
router.get("/", FarmerTransactionController.getAllFarmerTransactions);
// Route to get a farmer transaction by ID
router.get("/:id", FarmerTransactionController.getFarmerTransactionById);
// Route to update a farmer transaction's details
router.put("/:id", auth_1.authMiddleware, (0, auth_1.authorizeRoles)(client_1.UserRole.ADMIN, client_1.UserRole.SUPER_ADMIN), FarmerTransactionController.updateFarmerTransaction);
// Route to delete a farmer transaction
router.delete("/:id", auth_1.authMiddleware, (0, auth_1.authorizeRoles)(client_1.UserRole.ADMIN, client_1.UserRole.SUPER_ADMIN), FarmerTransactionController.deleteFarmerTransaction);
// Route to get all transactions by farmer ID
router.get("/farmer/:farmerId", FarmerTransactionController.getTransactionsByFarmer);
// Route to get all transactions by purchase ID
router.get("/purchase/:purchaseId", FarmerTransactionController.getTransactionsByPurchase);
exports.default = router;
