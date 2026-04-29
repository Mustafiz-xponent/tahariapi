"use strict";
// /**
//  * Routes for OrderItem entity operations.
//  * Defines API endpoints for order item-related CRUD operations.
//  */
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
// import { Router } from "express";
// import * as OrderItemController from "@/modules/order_items/order-item.controller";
// const router = Router();
// // Route to create a new order item
// router.post("/", OrderItemController.createOrderItem);
// // Route to get all order items
// router.get("/", OrderItemController.getAllOrderItems);
// // Route to get an order item by ID
// router.get("/:id", OrderItemController.getOrderItemById);
// // Route to update an order item's details
// router.put("/:id", OrderItemController.updateOrderItem);
// // Route to delete an order item
// router.delete("/:id", OrderItemController.deleteOrderItem);
// export default router;
// -------------------------------- 22222222222222222222222222 --------------------------------
/**
 * Routes for OrderItem entity operations.
 * Defines API endpoints for order item-related CRUD operations.
 */
const express_1 = require("express");
const OrderItemController = __importStar(require("@/modules/order_items/order-item.controller"));
const router = (0, express_1.Router)();
// Route to check product stock availability
router.get("/stock/check/:productId", OrderItemController.checkProductStock);
// Route to create a new order item
router.post("/", OrderItemController.createOrderItem);
// Route to get all order items
router.get("/", OrderItemController.getAllOrderItems);
// Route to get an order item by ID
router.get("/:id", OrderItemController.getOrderItemById);
// Route to update an order item's details
router.put("/:id", OrderItemController.updateOrderItem);
// Route to delete an order item
router.delete("/:id", OrderItemController.deleteOrderItem);
exports.default = router;
