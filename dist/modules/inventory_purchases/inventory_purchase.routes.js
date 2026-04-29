"use strict";
// /**
//  * Routes for InventoryPurchase entity operations.
//  * Defines API endpoints for inventory purchase-related CRUD operations.
//  */
// import { Router } from "express";
// import { UserRole } from "../../generated/prisma/client";
// import { authMiddleware, authorizeRoles } from "../../middlewares/auth";
// import * as InventoryPurchaseController from "../../modules/inventory_purchases/inventory_purchase.controller";
Object.defineProperty(exports, "__esModule", { value: true });
// const router = Router();
// // Route to create a new inventory purchase
// router.post(
//   "/",
//   authMiddleware,
//   authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
//   InventoryPurchaseController.createInventoryPurchase
// );
// // Route to get all inventory purchases
// router.get("/", InventoryPurchaseController.getAllInventoryPurchases);
// // Route to get an inventory purchase by ID
// router.get("/:id", InventoryPurchaseController.getInventoryPurchaseById);
// // Route to update an inventory purchase's details
// router.put(
//   "/:id",
//   authMiddleware,
//   authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
//   InventoryPurchaseController.updateInventoryPurchase
// );
// // Route to delete an inventory purchase
// router.delete(
//   "/:id",
//   authMiddleware,
//   authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
//   InventoryPurchaseController.deleteInventoryPurchase
// );
// export default router;
//_-------------------------- 2222222222222222222-------------
/**
 * Routes for InventoryPurchase entity operations.
 * Defines API endpoints for inventory purchase-related CRUD operations.
 */
const express_1 = require("express");
const client_1 = require("../../generated/prisma/client");
const auth_1 = require("../../middlewares/auth");
const inventory_purchase_controller_1 = require("../../modules/inventory_purchases/inventory_purchase.controller");
const router = (0, express_1.Router)();
// Route to create a new inventory purchase
router.post("/", auth_1.authMiddleware, (0, auth_1.authorizeRoles)(client_1.UserRole.ADMIN, client_1.UserRole.SUPER_ADMIN), inventory_purchase_controller_1.createInventoryPurchase);
// Route to get all inventory purchases
router.get("/", inventory_purchase_controller_1.getAllInventoryPurchases);
// Route to get an inventory purchase by ID
router.get("/:id", inventory_purchase_controller_1.getInventoryPurchaseById);
// Route to update an inventory purchase's details
router.put("/:id", auth_1.authMiddleware, (0, auth_1.authorizeRoles)(client_1.UserRole.ADMIN, client_1.UserRole.SUPER_ADMIN), inventory_purchase_controller_1.updateInventoryPurchase);
// Route to delete an inventory purchase
router.delete("/:id", auth_1.authMiddleware, (0, auth_1.authorizeRoles)(client_1.UserRole.ADMIN, client_1.UserRole.SUPER_ADMIN), inventory_purchase_controller_1.deleteInventoryPurchase);
exports.default = router;
