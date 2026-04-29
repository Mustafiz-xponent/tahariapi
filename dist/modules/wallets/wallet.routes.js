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
/**
 * Routes for Wallet entity operations.
 * Defines API endpoints for wallet-related CRUD operations.
 */
const express_1 = require("express");
const validator_1 = __importDefault(require("@/middlewares/validator"));
const client_1 = require("@/generated/prisma/client");
const auth_1 = require("@/middlewares/auth");
const WalletController = __importStar(require("@/modules/wallets/wallet.controller"));
const wallet_dto_1 = require("@/modules/wallets/wallet.dto");
const router = (0, express_1.Router)();
// Route to create a new wallet
router.post("/", auth_1.authMiddleware, (0, auth_1.authorizeRoles)(client_1.UserRole.ADMIN, client_1.UserRole.SUPER_ADMIN), (0, validator_1.default)(wallet_dto_1.zCreateWalletDto), WalletController.createWallet);
// Route to deposite wallet
router.post("/deposit", auth_1.authMiddleware, (0, auth_1.authorizeRoles)(client_1.UserRole.CUSTOMER), (0, validator_1.default)(wallet_dto_1.zDepositeWalletDto), WalletController.initiateWalletDeposit);
// Route to get all wallets
router.get("/", auth_1.authMiddleware, (0, auth_1.authorizeRoles)(client_1.UserRole.ADMIN, client_1.UserRole.SUPER_ADMIN), WalletController.getAllWallets);
// Route to get wallets for a specific customer
router.get("/balance", auth_1.authMiddleware, (0, auth_1.authorizeRoles)(client_1.UserRole.CUSTOMER), WalletController.getCustomerWalletBalanace);
// Route to get a wallet by ID
router.get("/:id", auth_1.authMiddleware, (0, auth_1.authorizeRoles)(client_1.UserRole.ADMIN, client_1.UserRole.SUPER_ADMIN), (0, validator_1.default)(wallet_dto_1.zGetWalletDto), WalletController.getWalletById);
// Route to update a wallet's details
// router.put(
//   "/:id",
//   authMiddleware,
//   authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
//   validator(zUpdateWalletDto),
//   WalletController.updateWallet
// );
// Route to delete a wallet
// router.delete(
//   "/:id",
//   authMiddleware,
//   authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
//   validator(zDeleteWalletDto),
//   WalletController.deleteWallet
// );
// SSLCommerz callback routes
router.post("/deposite/success", WalletController.handleSslCommerzSuccess);
router.post("/deposite/fail", WalletController.handleSslCommerzFailure);
router.post("/deposite/cancel", WalletController.handleSslCommerzCancel);
router.post("/deposite/ipn", WalletController.handleSslCommerzIPN);
exports.default = router;
