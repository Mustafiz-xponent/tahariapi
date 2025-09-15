import { Router } from "express";
import validator from "@/middlewares/validator";
import { UserRole } from "@/generated/prisma/client";
import { authMiddleware, authorizeRoles } from "@/middlewares/auth";
import { zGetSalesOverviewDto } from "@/modules/dashboard/dashboard.dto";
import * as dasboardController from "@/modules/dashboard/dashboard.controller";

const router = Router();

router.get(
  "/summary",
  authMiddleware,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  dasboardController.getDashboardSummary
);

router.get(
  "/sales-overview",
  authMiddleware,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validator(zGetSalesOverviewDto),
  dasboardController.getSalesOverview
);

export default router;
