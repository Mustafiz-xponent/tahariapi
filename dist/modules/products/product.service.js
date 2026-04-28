"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProduct = createProduct;
exports.getAllProducts = getAllProducts;
exports.getProductById = getProductById;
exports.updateProduct = updateProduct;
exports.deleteProduct = deleteProduct;
/**
 * Service layer for Product entity operations.
 */
const logger_1 = __importDefault(require("../../utils/logger"));
const prismaClient_1 = __importDefault(require("../../prisma-client/prismaClient"));
const calculateDealPricing_1 = require("../../utils/calculateDealPricing");
const s3Aws_1 = require("../../utils/fileUpload/s3Aws");
const appError_1 = require("../../utils/appError");
const http_status_1 = __importDefault(require("http-status"));
/**
 * Create a new product with optional image uploads
 * @param data - Data required to create a product
 * @param imageFiles - Optional array of image files to upload
 * @param usePrivateBucket - Whether to store images in private bucket
 * @returns The created product with image URLs
 * @throws Error if the product cannot be created
 */
async function createProduct(data, files) {
    if (files.length < 1) {
        throw new appError_1.AppError("At least one image is required", http_status_1.default.BAD_REQUEST);
    }
    // Convert multer files to File objects if images are provided
    let imageFiles = [];
    if (files && files.length > 0) {
        imageFiles = files.map((file) => {
            const blob = new Blob([file.buffer], { type: file.mimetype });
            return new File([blob], file.originalname, { type: file.mimetype });
        });
    }
    // First create the product without images
    const product = await prismaClient_1.default.product.create({
        data: {
            name: data.name,
            description: data.description,
            unitPrice: data.unitPrice,
            unitType: data.unitType,
            packageSize: data.packageSize,
            stockQuantity: data.stockQuantity ?? 0,
            reorderLevel: data.reorderLevel ?? 0,
            isSubscription: data.isSubscription ?? false,
            isPreorder: data.isPreorder ?? false,
            preorderAvailabilityDate: data.preorderAvailabilityDate,
            imageUrls: [], // Start with empty array
            isPrivateImages: true, // store images to private bucket
            categoryId: data.categoryId,
            farmerId: data.farmerId,
        },
    });
    // If images are provided, upload them and update the product
    if (imageFiles && imageFiles.length > 0) {
        try {
            const uploadResults = await (0, s3Aws_1.uploadProductImages)(imageFiles, product.productId, true);
            const imageUrls = uploadResults.map((result) => result.url);
            // Update product with image URLs
            const updatedProduct = await prismaClient_1.default.product.update({
                where: { productId: product.productId },
                data: { imageUrls },
            });
            return updatedProduct;
        }
        catch (uploadError) {
            // If image upload fails, we still have the product created
            // Log the error but don't fail the entire operation
            console.error("Failed to upload images during product creation:", uploadError);
            return product;
        }
    }
    return product;
}
/**
 * Retrieve all products with optional filtering, relations, and pagination
 * @param paginationParams - Pagination parameters (page, limit, skip)
 * @returns Paginated products with accessible image URLs and pagination metadata
 * @throws Error if the query fails
 */
async function getAllProducts(paginationParams, filterParams) {
    const { limit, skip, page, sort } = paginationParams;
    // Build dynamic where clause
    const where = {
        ...(filterParams?.isSubscription !== undefined && {
            isSubscription: filterParams.isSubscription,
        }),
        ...(filterParams?.isPreorder !== undefined && {
            isPreorder: filterParams.isPreorder,
        }),
        ...(filterParams?.name && {
            name: {
                contains: filterParams.name,
                mode: "insensitive",
            },
        }),
        ...(filterParams?.status === "low-stock" && {
            stockQuantity: {
                lte: prismaClient_1.default.product.fields.reorderLevel, // get low stock product
            },
        }),
        ...(filterParams?.status === "in-stock" && {
            stockQuantity: {
                gt: 0, // get in-stock product
            },
        }),
        ...(filterParams?.status === "out-of-stock" && {
            stockQuantity: {
                equals: 0, // get out of stock product
            },
        }),
        ...(filterParams?.categoryIds &&
            filterParams?.categoryIds.length > 0 && {
            categoryId: { in: filterParams?.categoryIds },
        }),
        ...(filterParams?.farmerIds &&
            filterParams?.farmerIds.length > 0 && {
            farmerId: { in: filterParams?.farmerIds },
        }),
    };
    // Get paginated products with optional relations
    const products = await prismaClient_1.default.product.findMany({
        where,
        include: {
            deal: true,
            category: {
                select: {
                    categoryId: true,
                    name: true,
                },
            },
            farmer: {
                select: {
                    farmName: true,
                },
            },
        },
        take: limit,
        skip: skip,
        orderBy: {
            createdAt: sort === "asc" ? "asc" : "desc",
        },
    });
    // Process images if needed
    let processedProducts = await (0, s3Aws_1.processProductsWithAccessibleUrls)(products);
    // Apply pricing calculation
    processedProducts = await Promise.all(processedProducts.map(async (product) => {
        const { hasActiveDeal, hasActiveGlobalDeal, discountUnitPrice, discountType, discountValue, } = await (0, calculateDealPricing_1.calculateDealPricing)(product);
        return {
            ...product,
            hasActiveDeal,
            hasActiveGlobalDeal,
            discountType,
            discountValue,
            discountUnitPrice,
        };
    }));
    // Count for pagination
    const totalCount = await prismaClient_1.default.product.count({ where });
    const totalPages = Math.ceil(totalCount / limit);
    return {
        products: processedProducts,
        totalCount,
        totalPages,
        currentPage: page,
    };
}
/**
 * Retrieve a product by its ID with optional relations
 * @param productId - The ID of the product
 * @returns The product if found with accessible image URLs, or null if not found
 * @throws Error if the query fails
 */
async function getProductById(productId) {
    const product = await prismaClient_1.default.product.findUnique({
        where: { productId },
        include: {
            category: true,
            farmer: true,
            deal: true,
        },
    });
    if (!product) {
        throw new appError_1.AppError("Product not found", http_status_1.default.BAD_REQUEST);
    }
    // Calculate deal pricing
    const { hasActiveDeal, hasActiveGlobalDeal, discountUnitPrice, discountType, discountValue, } = await (0, calculateDealPricing_1.calculateDealPricing)(product);
    // Generate accessible URLs if requested
    let accessibleImageUrls = [];
    if (product.imageUrls.length > 0) {
        accessibleImageUrls = await (0, s3Aws_1.getBatchAccessibleImageUrls)(product.imageUrls, product.isPrivateImages || false);
    }
    return {
        ...product,
        accessibleImageUrls,
        hasActiveDeal,
        hasActiveGlobalDeal,
        discountUnitPrice,
        discountType,
        discountValue,
    };
}
/**
 * Update a product by its ID with optional image uploads
 * @param productId - The ID of the product to update
 * @param data - Data to update the product
 * @param imageFiles - Optional array of new image files
 * @returns The updated product
 * @throws Error if the product is not found or update fails
 */
async function updateProduct(productId, data, files) {
    // Convert multer files to File objects if images are provided
    let imageFiles = [];
    if (files && files.length > 0) {
        imageFiles = files.map((file) => {
            const blob = new Blob([file.buffer], { type: file.mimetype });
            return new File([blob], file.originalname, { type: file.mimetype });
        });
    }
    // Get current product to access existing image URLs and privacy setting
    const currentProduct = await prismaClient_1.default.product.findUnique({
        where: { productId },
        select: {
            imageUrls: true,
            isPrivateImages: true,
            unitPrice: true,
            packageSize: true,
        },
    });
    if (!currentProduct) {
        throw new appError_1.AppError("Product not found", http_status_1.default.BAD_REQUEST);
    }
    const existingImagesCount = currentProduct.imageUrls?.length ?? 0;
    const deletedImagesCount = data?.deletedImages?.length ?? 0;
    const newImagesCount = imageFiles?.length ?? 0;
    const totalImages = existingImagesCount - deletedImagesCount + newImagesCount;
    if (totalImages > 10) {
        throw new appError_1.AppError("Maximum 10 images are allowed", http_status_1.default.BAD_REQUEST);
    }
    let finalImageUrls = currentProduct.imageUrls;
    const hasNewOrDeletedImages = imageFiles?.length > 0 ||
        (data?.deletedImages && data?.deletedImages?.length > 0);
    // Handle image uploads if provided
    if (hasNewOrDeletedImages) {
        try {
            const filteredImages = currentProduct.imageUrls.filter((image) => {
                return !data?.deletedImages?.includes(image);
            });
            // Replace existing images
            const uploadResults = await (0, s3Aws_1.replaceProductImages)(productId, true, true, data?.deletedImages, imageFiles);
            finalImageUrls = [
                ...filteredImages,
                ...(uploadResults?.map((r) => r.url) ?? []),
            ];
        }
        catch (uploadError) {
            console.error("Failed to upload images during product update:", uploadError);
            // Continue with update without new images
        }
    }
    // Update the product
    const product = await prismaClient_1.default.product.update({
        where: { productId },
        data: {
            name: data.name,
            description: data.description,
            unitPrice: data.unitPrice,
            unitType: data.unitType,
            packageSize: data.packageSize,
            stockQuantity: data.stockQuantity,
            reorderLevel: data.reorderLevel,
            preorderAvailabilityDate: data.preorderAvailabilityDate,
            imageUrls: finalImageUrls ?? currentProduct?.imageUrls,
            isPrivateImages: true,
            categoryId: data.categoryId,
            farmerId: data.farmerId,
        },
    });
    return product;
}
/**
 * Delete a product by its ID and clean up associated images
 * @param productId - The ID of the product to delete
 * @throws Error if the product is not found or deletion fails
 */
async function deleteProduct(productId) {
    // First, get the product to access image URLs and privacy setting
    const product = await prismaClient_1.default.product.findUnique({
        where: { productId },
        select: {
            imageUrls: true,
            isPrivateImages: true,
        },
    });
    if (!product) {
        throw new appError_1.AppError("Product not found", http_status_1.default.BAD_REQUEST);
    }
    // Delete the product from database first
    await prismaClient_1.default.product.delete({
        where: { productId },
    });
    // Clean up images from S3 if they exist (async, don't block the response)
    if (product.imageUrls && product.imageUrls.length > 0) {
        const s3Keys = product.imageUrls
            .map(s3Aws_1.extractS3KeyFromUrl)
            .filter((key) => key !== null);
        if (s3Keys.length > 0) {
            // Run cleanup in background
            (0, s3Aws_1.deleteMultipleFilesFromS3)(s3Keys, product.isPrivateImages || false)
                .then(() => {
                logger_1.default.info("Successfully deleted S3 files:", s3Keys);
            })
                .catch((error) => {
                console.error("Failed to cleanup S3 images after product deletion:", error);
            });
        }
    }
}
