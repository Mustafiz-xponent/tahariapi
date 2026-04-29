"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPromotion = createPromotion;
exports.getAllPromotions = getAllPromotions;
exports.getPromotionById = getPromotionById;
exports.updatePromotion = updatePromotion;
exports.deletePromotion = deletePromotion;
const http_status_1 = __importDefault(require("http-status"));
const appError_1 = require("@/utils/appError");
const prismaClient_1 = __importDefault(require("@/prisma-client/prismaClient"));
const configMulterUpload_1 = require("@/utils/fileUpload/configMulterUpload");
const s3Aws_1 = require("@/utils/fileUpload/s3Aws");
/**
 * Creates a new promotion entry in the database
 * - Requires an image file (uploaded to S3)
 * - Accepts promotion metadata in `CreatePromotionDto`
 * - Stores S3 URL of the image
 */
async function createPromotion(data, file) {
    if (!file)
        throw new Error("Image is required");
    // Upload image to S3
    const fileObject = (0, configMulterUpload_1.multerFileToFileObject)(file);
    const s3Res = await (0, s3Aws_1.uploadFileToS3)(fileObject, "promotions", undefined, true);
    try {
        const promotion = await prismaClient_1.default.$transaction(async (tx) => {
            return await tx.promotion.create({
                data: {
                    title: data.title ?? null,
                    description: data.description ?? null,
                    targetType: data.targetType,
                    imageUrl: s3Res.url,
                    productId: data.productId ?? null,
                    // dealId: data.dealId ?? null,
                    placement: data.placement,
                    priority: data.priority,
                    isActive: data.isActive,
                },
            });
        });
        return promotion;
    }
    catch (error) {
        // Rollback S3 file if DB insert fails
        if (s3Res?.key) {
            await (0, s3Aws_1.deleteFileFromS3)(s3Res.key, true);
        }
        throw error;
    }
}
/**
 * Retrieves all promotions with optional filters and pagination
 * - Supports filtering by placement and targetType
 * - Adds a signed, accessible image URL to each promotion
 */
async function getAllPromotions(paginationParams, filterParams) {
    const { page, limit, skip, sort } = paginationParams;
    const { placement, targetType, search, status } = filterParams;
    const effectiveStatus = status ?? "active";
    const whereConditions = {
        ...(placement ? { placement } : {}),
        ...(targetType ? { targetType } : {}),
        ...(search && {
            title: {
                contains: search,
                mode: "insensitive",
            },
        }),
        ...(effectiveStatus === "active"
            ? { isActive: true }
            : effectiveStatus === "inactive"
                ? { isActive: false }
                : {}), // "all" → no filter
    };
    const promotions = await prismaClient_1.default.promotion.findMany({
        where: whereConditions,
        take: limit,
        skip: skip,
        orderBy: [
            { priority: sort === "asc" ? "asc" : "desc" },
            { createdAt: sort === "asc" ? "asc" : "desc" },
        ],
    });
    // Add signed image URLs
    const promotionWithUrls = await Promise.all(promotions.map(async (promotion) => {
        let accessibleUrl;
        if (promotion.imageUrl) {
            accessibleUrl = await (0, s3Aws_1.getAccessibleImageUrl)(promotion.imageUrl, true);
        }
        return {
            ...promotion,
            accessibleImageUrl: accessibleUrl,
        };
    }));
    const totalPromotions = await prismaClient_1.default.promotion.count({
        where: whereConditions,
    });
    return {
        data: promotionWithUrls,
        currentPage: page,
        totalPages: Math.ceil(totalPromotions / limit),
        totalCount: totalPromotions,
    };
}
/**
 * Retrieves a single promotion by its ID
 * - Returns signed accessible image URL if available
 * - Throws an error if promotion is not found
 */
async function getPromotionById(promotionId) {
    const promotion = await prismaClient_1.default.promotion.findUnique({
        where: { promotionId: Number(promotionId) },
    });
    if (!promotion) {
        throw new appError_1.AppError("Promotion not found", http_status_1.default.NOT_FOUND);
    }
    let accessibleImageUrl;
    if (promotion.imageUrl) {
        accessibleImageUrl = await (0, s3Aws_1.getAccessibleImageUrl)(promotion.imageUrl, true);
    }
    return {
        ...promotion,
        accessibleImageUrl,
    };
}
/**
 * Updates an existing promotion by its ID
 * - Replaces image in S3 if a new file is provided
 * - Falls back to existing image URL if not
 */
async function updatePromotion(promotionId, data, file) {
    const promotion = await prismaClient_1.default.promotion.findUnique({
        where: { promotionId },
    });
    if (!promotion) {
        throw new appError_1.AppError("Promotion not found", http_status_1.default.NOT_FOUND);
    }
    // Upload image to S3
    let s3Res;
    if (file) {
        await (0, s3Aws_1.deleteFileFromS3)(promotion.imageUrl, true);
        const fileObject = (0, configMulterUpload_1.multerFileToFileObject)(file);
        s3Res = await (0, s3Aws_1.uploadFileToS3)(fileObject, "promotions", undefined, true);
    }
    // update promotion
    try {
        const updatedPromotion = await prismaClient_1.default.$transaction(async (tx) => {
            return await prismaClient_1.default.promotion.update({
                where: { promotionId },
                data: {
                    title: data.title,
                    description: data.description,
                    targetType: data.targetType,
                    productId: data.productId,
                    // dealId: data.dealId,
                    imageUrl: s3Res?.url ? s3Res.url : promotion.imageUrl,
                    placement: data.placement,
                    priority: data.priority,
                    isActive: data.isActive,
                },
            });
        });
        return updatedPromotion;
    }
    catch (error) {
        // Rollback S3 file if DB insert fails
        if (s3Res?.key) {
            await (0, s3Aws_1.deleteFileFromS3)(s3Res.key, true);
        }
        throw error;
    }
}
/**
 * Deletes a promotion by its ID
 * - Also deletes associated image from S3
 * - Throws an error if promotion not found
 */
async function deletePromotion(promotionId) {
    const promotion = await prismaClient_1.default.promotion.findUnique({
        where: { promotionId },
    });
    if (!promotion) {
        throw new appError_1.AppError("Promotion not found", http_status_1.default.NOT_FOUND);
    }
    // Delete image from S3
    await (0, s3Aws_1.deleteFileFromS3)(promotion.imageUrl, true);
    // Delete promotion
    await prismaClient_1.default.promotion.delete({ where: { promotionId } });
}
