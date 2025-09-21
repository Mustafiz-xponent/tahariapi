import httpStatus from "http-status";
import { AppError } from "@/utils/appError";
import prisma from "@/prisma-client/prismaClient";
import { deleteFileFromS3 } from "@/utils/fileUpload/s3Aws";
import { Category, Prisma } from "@/generated/prisma/client";
import { IMulterFile } from "@/utils/fileUpload/configMulterUpload";
import { multerFileToFileObject } from "@/utils/fileUpload/configMulterUpload";
import {
  uploadFileToS3,
  getAccessibleImageUrl,
} from "@/utils/fileUpload/s3Aws";
import {
  UpdateCategoryDto,
  CreateCategoryDto,
} from "@/modules/categories/category.dto";
import {
  GetCategoriesQueryOptions,
  GetCategoriesResult,
  GetCategoryResult,
} from "@/modules/categories/categories.interface";

// Create a new category
export const createCategory = async ({
  data,
  file,
}: {
  data: CreateCategoryDto["body"];
  file?: IMulterFile;
}): Promise<Category> => {
  if (!file) {
    throw new AppError("Image is required", httpStatus.BAD_REQUEST);
  }
  // Upload image to S3
  const fileObject = multerFileToFileObject(file);
  const s3Res = await uploadFileToS3(fileObject, "categories", undefined, true);
  try {
    const category = await prisma.$transaction(async (tx) => {
      return await tx.category.create({
        data: {
          ...data,
          imageUrl: s3Res.url,
        },
      });
    });
    return category;
  } catch (error) {
    // Rollback S3 file if DB insert fails
    if (s3Res?.key) {
      await deleteFileFromS3(s3Res.key, true);
    }
    throw error;
  }
};

/**
 * Get all categories with products that have accessible image URLs
 */
export const getAllCategories = async (
  queryOptions: GetCategoriesQueryOptions
): Promise<GetCategoriesResult> => {
  const { page, limit, skip, sort, search } = queryOptions;

  const where: Prisma.CategoryWhereInput = {};
  if (search && search.trim() !== "") {
    // Search by category name
    where.name = {
      contains: search,
      mode: "insensitive",
    };
  }
  // Get all categories
  const categories = await prisma.category.findMany({
    where,
    take: limit,
    skip: skip,
    orderBy: { createdAt: sort === "asc" ? "asc" : "desc" },
  });
  // Count total categories
  const totalCategories = await prisma.category.count({ where });
  // Add signed image URLs
  const categoriesWithUrls = await Promise.all(
    categories.map(async (category) => {
      let accessibleUrl: string | undefined;
      if (category.imageUrl) {
        accessibleUrl = await getAccessibleImageUrl(
          category.imageUrl as string,
          category.isPrivateImage
        );
      }
      return {
        ...category,
        accessibleImageUrl: accessibleUrl,
      };
    })
  );

  return {
    data: categoriesWithUrls,
    currentPage: page,
    totalPages: Math.ceil(totalCategories / limit),
    totalCount: totalCategories,
  };
};

/**
 * Get a category by ID with products that have accessible image URLs
 */
export const getCategoryById = async (
  categoryId: bigint
): Promise<GetCategoryResult> => {
  const category = await prisma.category.findUnique({ where: { categoryId } });

  if (!category) {
    throw new AppError("Category not found", httpStatus.NOT_FOUND);
  }

  let accessibleUrl: string | undefined;
  if (category.imageUrl) {
    accessibleUrl = await getAccessibleImageUrl(
      category.imageUrl as string,
      category.isPrivateImage
    );
  }
  return {
    ...category,
    accessibleImageUrl: accessibleUrl,
  };
};

// Update a category's details
export const updateCategory = async (
  categoryId: bigint,
  data: UpdateCategoryDto["body"],
  file?: IMulterFile
): Promise<Category> => {
  const category = await prisma.category.findUnique({
    where: { categoryId },
  });
  if (!category) {
    throw new AppError("Category not found", httpStatus.NOT_FOUND);
  }

  // Upload image to S3
  let s3Res: any;
  if (file) {
    await deleteFileFromS3(category?.imageUrl!, true);
    const fileObject = multerFileToFileObject(file);
    s3Res = await uploadFileToS3(fileObject, "categories", undefined, true);
  }
  try {
    const updatedCategory = await prisma.$transaction(async (tx) => {
      return await tx.category.update({
        where: { categoryId },
        data: {
          ...data,
          imageUrl: s3Res?.url ? s3Res.url : category?.imageUrl,
        },
      });
    });
    return updatedCategory;
  } catch (error) {
    // Rollback S3 file if DB update fails
    if (s3Res?.key) {
      await deleteFileFromS3(s3Res.key, true);
    }
    throw error;
  }
};

// Delete a category
export const deleteCategory = async (categoryId: bigint): Promise<void> => {
  const category = await prisma.category.findUnique({
    where: { categoryId },
  });
  if (!category) {
    throw new AppError("Category not found", httpStatus.NOT_FOUND);
  }
  // Delete image from S3
  await deleteFileFromS3(category.imageUrl!, true);
  // Delete category
  await prisma.category.delete({
    where: { categoryId },
  });
};
