import { Router } from "express";
import { UserRole } from "@/generated/prisma/client";
import { authMiddleware, authorizeRoles } from "@/middlewares/auth";
import { getDashboardSummary } from "@/modules/dashboard/dashboard.controller";

const router = Router();
router.get(
  "/summary",
  authMiddleware,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  getDashboardSummary
);
export default router;
