/**
 * Routes for Product entity operations.
 * Defines API endpoints for product-related CRUD operations.
 */
import { Router } from "express";
import validator from "@/middlewares/validator";
import { UserRole } from "@/generated/prisma/client";
import { authMiddleware, authorizeRoles } from "@/middlewares/auth";
import { zGetAllProductsDto } from "@/modules/products/product.dto";
import * as ProductController from "@/modules/products/product.controller";

const router = Router();

// Route to create a new product
router.post(
  "/",
  authMiddleware,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  ProductController.createProduct
);

// Route to get all products
router.get(
  "/",
  validator(zGetAllProductsDto),
  ProductController.getAllProducts
);

// Route to get a product by ID
// router.get("/:id", ProductController.getProductById);
router.get("/:id", ProductController.getProductById);

// Route to get a product by name
// router.get("/name/:name", ProductController.getProductByName);

// Route to update a product's details
router.put(
  "/:id",
  authMiddleware,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  ProductController.updateProduct
);

// Route to delete a product
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  ProductController.deleteProduct
);

export default router;
