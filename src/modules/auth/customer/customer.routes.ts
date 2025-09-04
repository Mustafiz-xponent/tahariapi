/**
 * Routes for Customer authentication operations.
 * Defines API endpoints for customer authentication.
 */
import { Router } from "express";
import { UserRole } from "@/generated/prisma/client";
import { authMiddleware, authorizeRoles } from "@/middlewares/auth";
import * as CustomerController from "@/modules/auth/customer/customer.controller";

const router = Router();

// Route to register a customer
router.post("/register", CustomerController.registerCustomer);

// Route to login a customer with email/phone and password
router.post("/login", CustomerController.loginCustomer);

// Route to initiate OTP login for customer
router.post("/otp-login", CustomerController.otpLoginCustomer);

// Route to verify OTP for customer
router.post("/verify-otp", CustomerController.verifyCustomerOtp);

// Route to update customer profile by ID
router.put(
  "/:id",
  authMiddleware,
  authorizeRoles(UserRole.CUSTOMER),
  CustomerController.updateCustomerProfile
);

// Route to get customer by ID
router.get(
  "/:id",
  authMiddleware,
  authorizeRoles(UserRole.CUSTOMER),
  CustomerController.getCustomerById
);

export default router;
