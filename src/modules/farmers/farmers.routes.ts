import { Router } from "express";
import { UserRole } from "@/generated/prisma/client";
import { authMiddleware, authorizeRoles } from "@/middlewares/auth";
import * as FarmerController from "@/modules/farmers/farmers.controller";
import validator from "@/middlewares/validator";
import {
  zCreateFarmerDto,
  zDeleteFarmerDto,
  zGetAllFarmersDto,
  zGetFarmerDto,
  zUpdateFarmerDto,
} from "@/modules/farmers/farmer.dto";

const router = Router();

// Route to create a new farmer by admin
router.post(
  "/",
  authMiddleware,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validator(zCreateFarmerDto),
  FarmerController.createFarmer
);

// Route to get all farmers
router.get(
  "/",
  authMiddleware,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validator(zGetAllFarmersDto),
  FarmerController.getAllFarmers
);

// Route to get a farmer by ID
router.get(
  "/:id",
  authMiddleware,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validator(zGetFarmerDto),
  FarmerController.getFarmerById
);

// Route to update a farmer's details by admin
router.put(
  "/:id",
  authMiddleware,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validator(zUpdateFarmerDto),
  FarmerController.updateFarmer
);

// Route to delete a farmer by admin
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validator(zDeleteFarmerDto),
  FarmerController.deleteFarmer
);

export default router;
