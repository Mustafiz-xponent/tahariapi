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
 * Routes for OrderTracking entity operations.
 * Defines API endpoints for order tracking-related CRUD operations.
 */
const express_1 = require("express");
const OrderTrackingController = __importStar(require("../../modules/order_tracking/order-tracking.controller"));
const router = (0, express_1.Router)();
// Route to create a new order tracking entry
router.post("/", OrderTrackingController.createOrderTracking);
// Route to get all order tracking entries
router.get("/", OrderTrackingController.getAllOrderTrackings);
// Route to get a single order tracking by ID (for edit)
// IMPORTANT: This must come BEFORE the /:orderId route
router.get("/:id", OrderTrackingController.getOrderTrackingById);
// Route to get order tracking entries by order ID
router.get("/order/:orderId", OrderTrackingController.getOrderTrackingsByOrderId);
// Route to update an order tracking entry's details
router.put("/:id", OrderTrackingController.updateOrderTracking);
// Route to delete an order tracking entry
router.delete("/:id", OrderTrackingController.deleteOrderTracking);
exports.default = router;
