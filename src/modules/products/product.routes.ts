/**
 * Routes for Product entity operations.
 * Defines API endpoints for product-related CRUD operations.
 */
import { Router } from "express";
import validator from "@/middlewares/validator";
import { UserRole } from "@/generated/prisma/client";
import { authMiddleware, authorizeRoles } from "@/middlewares/auth";
import {
  zCreateProductDto,
  zDeleteProductDto,
  zGetAllProductsDto,
  zGetProductDto,
  zUpdateProductDto,
} from "@/modules/products/product.dto";
import * as ProductController from "@/modules/products/product.controller";
import { upload } from "@/utils/fileUpload/configMulterUpload";

const router = Router();

// Route to create a new product
router.post(
  "/",
  authMiddleware,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  upload.array("images", 10),
  validator(zCreateProductDto),
  ProductController.createProduct
);

// Route to get all products
router.get(
  "/",
  validator(zGetAllProductsDto),
  ProductController.getAllProducts
);

// Route to get a product by ID
router.get("/:id", validator(zGetProductDto), ProductController.getProductById);

// Route to update a product's details
router.put(
  "/:id",
  authMiddleware,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validator(zUpdateProductDto),
  ProductController.updateProduct
);

// Route to delete a product
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validator(zDeleteProductDto),
  ProductController.deleteProduct
);

export default router;
