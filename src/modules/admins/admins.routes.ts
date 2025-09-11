import { Router } from "express";
import validator from "@/middlewares/validator";
import { UserRole } from "@/generated/prisma/client";
import { authMiddleware, authorizeRoles } from "@/middlewares/auth";
import * as AdminController from "@/modules/admins/admins.controller";
import { zDeleteAdminDto, zGetAdminDto } from "@/modules/admins/admins.dto";

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
  validator(zGetAdminDto),
  AdminController.getAdminById
);

// Route to delete an admin by ID
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles(UserRole.SUPER_ADMIN),
  validator(zDeleteAdminDto),
  AdminController.deleteAdmin
);

export default router;
