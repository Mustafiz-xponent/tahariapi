/**
 * Controller layer for Product entity operations.
 * Updated to handle image uploads with product creation and updates.
 */
import httpStatus from "http-status";
import { Request, Response } from "express";
import sendResponse from "@/utils/sendResponse";
import { Product } from "@/generated/prisma/client";
import * as productService from "@/modules/products/product.service";
import {
  GetAllProductsDto,
  UpdateProductDto,
} from "@/modules/products/product.dto";
import asyncHandler from "@/utils/asyncHandler";

/**
 * Create a new product with optional image uploads
 */
export const createProduct = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const data = req.body;
    const files = req.files as Express.Multer.File[];

    const product = await productService.createProduct(data, files);

    sendResponse<Product>(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Product created successfully",
      data: product,
    });
  }
);

/**
 * Get all products with optional relations and pagination
 */
export const getAllProducts = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { page, limit, isSubscription, sort, isPreorder, name, categoryId } =
      req.query as unknown as GetAllProductsDto["query"];
    const skip = (page - 1) * limit;

    const filters = { isSubscription, isPreorder, name, categoryId };
    const paginationParams = { page, limit, skip, sort };

    const result = await productService.getAllProducts(
      paginationParams,
      filters
    );

    sendResponse<Product[]>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Products retrieved successfully",
      data: result.products,
      pagination: {
        currentPage: page,
        totalPages: result.totalPages,
        totalItems: result.totalCount,
        itemsPerPage: limit,
        hasNextPage: page < result.totalPages,
        hasPreviousPage: page > 1,
      },
    });
  }
);

/**
 * Get a single product by ID with optional relations
 */
export const getProductById = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const productId = BigInt(req.params.id);
    const product = await productService.getProductById(productId);

    sendResponse<Product>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Product retrieved successfully",
      data: product,
    });
  }
);

/**
 * Update a product by ID with optional image uploads
 */
export const updateProduct = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const productId = BigInt(req.params.id);
    const data = req.body as UpdateProductDto["body"];
    const files = req.files as Express.Multer.File[];

    const updated = await productService.updateProduct(productId, data, files);
    sendResponse<Product>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Product updated successfully",
      data: updated,
    });
  }
);

/**
 * Delete a product by ID (automatically handles image cleanup)
 */
export const deleteProduct = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const productId = BigInt(req.params.id);

    await productService.deleteProduct(productId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Product deleted successfully",
    });
  }
);
