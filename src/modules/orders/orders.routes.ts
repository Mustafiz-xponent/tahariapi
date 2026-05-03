/**
 * Routes for Order entity operations.
 * Defines API endpoints for order-related CRUD operations.
 */
import { Router } from "express";
import { UserRole } from "@/generated/prisma/client";
import { authMiddleware, authorizeRoles } from "@/middlewares/auth";
import * as OrderController from "@/modules/orders/orders.controller";

const router = Router();

// Add these routes before existing routes

// Due orders route
router.get(
  "/dues",
  authMiddleware,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  OrderController.getDueOrders,
);

// Send payment reminder
router.post(
  "/:orderId/reminder",
  authMiddleware,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  OrderController.sendPaymentReminder,
);

// Generate bill PDF
router.get(
  "/:orderId/bill/pdf",
  authMiddleware,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  OrderController.generateOrderBill,
);

// Send bill to email
router.post(
  "/:orderId/bill/email",
  authMiddleware,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  OrderController.sendBillToEmail,
);

// Route to create a new order
router.post("/", OrderController.createOrder);

// Route to get all orders
router.get(
  "/",
  authMiddleware,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  OrderController.getAllOrders,
);

// Route to get orders for a specific customer
router.get(
  "/customer",
  authMiddleware,
  authorizeRoles(UserRole.CUSTOMER),
  OrderController.getCustomerOrders,
);

// Route to get an order by ID
router.get("/:id", OrderController.getOrderById);

// Route to update an order's details
router.put(
  "/:id",
  authMiddleware,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  OrderController.updateOrder,
);

// Route to delete an order
router.delete(
  "/:id",
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  OrderController.deleteOrder,
);

export default router;
