"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.getCategoryById = exports.getAllCategories = exports.createCategory = void 0;
const http_status_1 = __importDefault(require("http-status"));
const appError_1 = require("@/utils/appError");
const prismaClient_1 = __importDefault(require("@/prisma-client/prismaClient"));
const s3Aws_1 = require("@/utils/fileUpload/s3Aws");
const configMulterUpload_1 = require("@/utils/fileUpload/configMulterUpload");
const s3Aws_2 = require("@/utils/fileUpload/s3Aws");
// Create a new category
const createCategory = async ({ data, file, }) => {
    if (!file) {
        throw new appError_1.AppError("Image is required", http_status_1.default.BAD_REQUEST);
    }
    // Upload image to S3
    const fileObject = (0, configMulterUpload_1.multerFileToFileObject)(file);
    const s3Res = await (0, s3Aws_2.uploadFileToS3)(fileObject, "categories", undefined, true);
    try {
        const category = await prismaClient_1.default.$transaction(async (tx) => {
            return await tx.category.create({
                data: {
                    ...data,
                    imageUrl: s3Res.url,
                },
            });
        });
        return category;
    }
    catch (error) {
        // Rollback S3 file if DB insert fails
        if (s3Res?.key) {
            await (0, s3Aws_1.deleteFileFromS3)(s3Res.key, true);
        }
        throw error;
    }
};
exports.createCategory = createCategory;
/**
 * Get all categories with products that have accessible image URLs
 */
const getAllCategories = async (queryOptions) => {
    const { page, limit, skip, sort, search } = queryOptions;
    const where = {};
    if (search && search.trim() !== "") {
        // Search by category name
        where.name = {
            contains: search,
            mode: "insensitive",
        };
    }
    // Get all categories
    const categories = await prismaClient_1.default.category.findMany({
        where,
        include: { products: { select: { name: true } } },
        take: limit,
        skip: skip,
        orderBy: { createdAt: sort === "asc" ? "asc" : "desc" },
    });
    // Count total categories
    const totalCategories = await prismaClient_1.default.category.count({ where });
    // Add signed image URLs
    const categoriesWithUrls = await Promise.all(categories.map(async (category) => {
        let accessibleUrl;
        if (category.imageUrl) {
            accessibleUrl = await (0, s3Aws_2.getAccessibleImageUrl)(category.imageUrl, category.isPrivateImage);
        }
        return {
            ...category,
            accessibleImageUrl: accessibleUrl,
        };
    }));
    return {
        data: categoriesWithUrls,
        currentPage: page,
        totalPages: Math.ceil(totalCategories / limit),
        totalCount: totalCategories,
    };
};
exports.getAllCategories = getAllCategories;
/**
 * Get a category by ID with products that have accessible image URLs
 */
const getCategoryById = async (categoryId) => {
    const category = await prismaClient_1.default.category.findUnique({
        where: { categoryId },
        include: { products: { select: { name: true } } },
    });
    if (!category) {
        throw new appError_1.AppError("Category not found", http_status_1.default.NOT_FOUND);
    }
    let accessibleUrl;
    if (category.imageUrl) {
        accessibleUrl = await (0, s3Aws_2.getAccessibleImageUrl)(category.imageUrl, category.isPrivateImage);
    }
    return {
        ...category,
        accessibleImageUrl: accessibleUrl,
    };
};
exports.getCategoryById = getCategoryById;
// Update a category's details
const updateCategory = async (categoryId, data, file) => {
    const category = await prismaClient_1.default.category.findUnique({
        where: { categoryId },
    });
    if (!category) {
        throw new appError_1.AppError("Category not found", http_status_1.default.NOT_FOUND);
    }
    // Upload image to S3
    let s3Res;
    if (file) {
        await (0, s3Aws_1.deleteFileFromS3)(category?.imageUrl, true);
        const fileObject = (0, configMulterUpload_1.multerFileToFileObject)(file);
        s3Res = await (0, s3Aws_2.uploadFileToS3)(fileObject, "categories", undefined, true);
    }
    try {
        const updatedCategory = await prismaClient_1.default.$transaction(async (tx) => {
            return await tx.category.update({
                where: { categoryId },
                data: {
                    ...data,
                    imageUrl: s3Res?.url ? s3Res.url : category?.imageUrl,
                },
            });
        });
        return updatedCategory;
    }
    catch (error) {
        // Rollback S3 file if DB update fails
        if (s3Res?.key) {
            await (0, s3Aws_1.deleteFileFromS3)(s3Res.key, true);
        }
        throw error;
    }
};
exports.updateCategory = updateCategory;
// Delete a category
const deleteCategory = async (categoryId) => {
    const category = await prismaClient_1.default.category.findUnique({
        where: { categoryId },
    });
    if (!category) {
        throw new appError_1.AppError("Category not found", http_status_1.default.NOT_FOUND);
    }
    // Delete image from S3
    await (0, s3Aws_1.deleteFileFromS3)(category.imageUrl, true);
    await prismaClient_1.default.$transaction([
        // Delete category
        prismaClient_1.default.category.delete({
            where: { categoryId },
        }),
        // delete products
        prismaClient_1.default.product.deleteMany({ where: { categoryId } }),
    ]);
};
exports.deleteCategory = deleteCategory;
