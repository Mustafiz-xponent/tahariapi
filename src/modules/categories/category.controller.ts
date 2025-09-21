/**
 * Controller layer for category operations.
 * Handles HTTP requests and responses for category endpoints.
 */
import httpStatus from "http-status";
import { Request, Response } from "express";
import asyncHandler from "@/utils/asyncHandler";
import sendResponse from "@/utils/sendResponse";
import { Category } from "@/generated/prisma/client";
import * as categoryService from "@/modules/categories/category.service";
import {
  CreateCategoryDto,
  GetCategoriesDto,
  UpdateCategoryDto,
} from "@/modules/categories/category.dto";

/**
 * Create a new category
 */
export const createCategory = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const data = req.body as CreateCategoryDto["body"];
    const file = req.file;

    const category = await categoryService.createCategory({ data, file });

    sendResponse<Category>(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Category created successfully",
      data: category,
    });
  }
);

/**
 * Get all categories with accessible image URLs for products
 */
export const getAllCategories = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { page, limit, sort, search } =
      req.query as unknown as GetCategoriesDto["query"];
    const skip = (page - 1) * limit;
    const queryOptions = { page, limit, skip, sort, search };

    const result = await categoryService.getAllCategories(queryOptions);

    sendResponse<Category[]>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Categories retrieved successfully",
      data: result.data,
      pagination: {
        currentPage: result.currentPage,
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
 * Get a single category by ID with accessible image URLs for products
 */
export const getCategoryById = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const categoryId = BigInt(req.params.id);

    const category = await categoryService.getCategoryById(categoryId);

    sendResponse<Category>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Category retrieved successfully",
      data: category,
    });
  }
);

/**
 * Update a category by ID
 */
export const updateCategory = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const categoryId = BigInt(req.params.id);
    const data = req.body as UpdateCategoryDto["body"];
    const file = req.file;

    const updated = await categoryService.updateCategory(
      categoryId,
      data,
      file
    );

    sendResponse<Category>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Category updated successfully",
      data: updated,
    });
  }
);

/**
 * Delete a category by ID
 */
export const deleteCategory = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const categoryId = BigInt(req.params.id);
    await categoryService.deleteCategory(categoryId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Category deleted successfully",
    });
  }
);
