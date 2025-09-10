import { Router } from "express";
import { UserRole } from "@/generated/prisma/client";
import { authMiddleware, authorizeRoles } from "@/middlewares/auth";
import * as AdminController from "@/modules/admins/admins.controller";

const router = Router();

// Route to create a new admin (super admin only)
router.get(
  "/",
  authMiddleware,
  authorizeRoles(UserRole.SUPER_ADMIN),
  AdminController.getAllAdmins
);

// Route to get an admin by ID
router.get(
  "/:id",
  authMiddleware,
  authorizeRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  AdminController.getAdminById
);

// Route to update an admin by ID
router.put(
  "/:id",
  authMiddleware,
  authorizeRoles(UserRole.SUPER_ADMIN),
  AdminController.updateAdmin
);

// Route to delete an admin by ID
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles(UserRole.SUPER_ADMIN),
  AdminController.deleteAdmin
);

export default router;
