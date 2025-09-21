/**
 * Routes for category operations.
 * Defines API endpoints for categories.
 */
import { Router } from "express";
import validator from "@/middlewares/validator";
import { UserRole } from "@/generated/prisma/client";
import { upload } from "@/utils/fileUpload/configMulterUpload";
import { authMiddleware, authorizeRoles } from "@/middlewares/auth";
import * as CategoryController from "@/modules/categories/category.controller";
import {
  zCreateCategoryDto,
  zDeleteCategoryDto,
  zGetCategoriesDto,
  zGetCategoryDto,
  zUpdateCategoryDto,
} from "@/modules/categories/category.dto";

const router = Router();

// Route to create a new category by admin
router.post(
  "/",
  authMiddleware,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  upload.single("image"),
  validator(zCreateCategoryDto),
  CategoryController.createCategory
);

// Route to get all categories
router.get(
  "/",
  validator(zGetCategoriesDto),
  CategoryController.getAllCategories
);

// Route to get a category by ID
router.get(
  "/:id",
  validator(zGetCategoryDto),
  CategoryController.getCategoryById
);

// Route to update a category's details by admin
router.put(
  "/:id",
  authMiddleware,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  upload.single("image"),
  validator(zUpdateCategoryDto),
  CategoryController.updateCategory
);

// Route to delete a category by admin
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validator(zDeleteCategoryDto),
  CategoryController.deleteCategory
);

export default router;
