/**
 * Routes for Admin authentication operations.
 * Defines API endpoints for admin authentication.
 */
import { Router } from "express";
import validator from "@/middlewares/validator";
import { UserRole } from "@/generated/prisma/client";
import { rateLimiter } from "@/middlewares/rateLimiter";
import { authMiddleware, authorizeRoles } from "@/middlewares/auth";
import * as AdminController from "@/modules/auth/admin/admin.controller";
import {
  zAdminForgotPasswordDto,
  zAdminResetPasswordDto,
} from "@/modules/auth/admin/admin.dto";

const router = Router();

// Route to create a new admin (super admin only)
router.post(
  "/create",
  authMiddleware,
  authorizeRoles(UserRole.SUPER_ADMIN),
  AdminController.createAdmin
);

// Route to login an admin with phone/email and password
router.post("/login", AdminController.loginAdmin);

// Route to forgot password
router.post(
  "/forgot-password",
  // rateLimiter(1, 1 * 60 * 1000), // 1 request per minute
  validator(zAdminForgotPasswordDto),
  AdminController.adminForgotPassword
);

// Route to reset password
router.post(
  "/reset-password",
  validator(zAdminResetPasswordDto),
  AdminController.adminResetPassword
);

// Route to delete an admin by superadmin
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles(UserRole.SUPER_ADMIN),
  AdminController.deleteAdmin
);

export default router;
