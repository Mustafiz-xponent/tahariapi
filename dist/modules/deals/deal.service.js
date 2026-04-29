"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDeal = createDeal;
exports.getAllDeals = getAllDeals;
exports.getDealById = getDealById;
exports.updateDeal = updateDeal;
exports.deleteDeal = deleteDeal;
const http_status_1 = __importDefault(require("http-status"));
const appError_1 = require("@/utils/appError");
const prismaClient_1 = __importDefault(require("@/prisma-client/prismaClient"));
const s3Aws_1 = require("@/utils/fileUpload/s3Aws");
/**
 * Creates a new deal entry in the database
 * - Accepts deal data in `CreateDealDto`
 * - Returns the created deal
 */
async function createDeal(data) {
    if (data.isGlobal) {
        const existingGlobalDeal = await prismaClient_1.default.deal.findFirst({
            where: {
                isGlobal: true,
                startDate: { lte: new Date() },
                endDate: { gt: new Date() },
            },
        });
        if (existingGlobalDeal) {
            throw new appError_1.AppError("An active global deal already exists.", http_status_1.default.BAD_REQUEST);
        }
        // Create global deal
        return await prismaClient_1.default.deal.create({
            data: {
                title: data.title,
                description: data.description ?? null,
                discountType: data.discountType,
                discountValue: data.discountValue,
                startDate: data.startDate,
                endDate: data.endDate,
                isGlobal: data.isGlobal,
            },
        });
    }
    // Not global – must have productIds
    if (data?.productIds?.length === 0) {
        throw new appError_1.AppError("Please provide productIds for non-global deals.", http_status_1.default.BAD_REQUEST);
    }
    // Check for existing *individual* deals on these products
    const productsWithDeal = await prismaClient_1.default.product.findMany({
        where: {
            productId: { in: data.productIds },
            deal: {
                isGlobal: false,
                startDate: { lte: new Date() },
                endDate: { gt: new Date() },
            },
        },
        select: { productId: true },
    });
    if (productsWithDeal.length > 0) {
        const ids = productsWithDeal.map((p) => p.productId);
        throw new appError_1.AppError(`These products already have active deals: ${ids.join(", ")}`, http_status_1.default.BAD_REQUEST);
    }
    // Create deal and assign to products
    return await prismaClient_1.default.$transaction(async (tx) => {
        const deal = await tx.deal.create({
            data: {
                title: data.title,
                description: data.description ?? null,
                discountType: data.discountType,
                discountValue: data.discountValue,
                startDate: data.startDate,
                endDate: data.endDate,
            },
        });
        await tx.product.updateMany({
            where: { productId: { in: data.productIds } },
            data: { dealId: deal.dealId },
        });
        return deal;
    });
}
/**
 * - Retrieves all deals with optional pagination and filtering
 */
async function getAllDeals(paginationParams, filterParams) {
    const { page, limit, skip, sort } = paginationParams;
    const isActive = filterParams.isActive;
    const now = new Date();
    const whereClause = {};
    if (typeof isActive === "boolean") {
        if (isActive) {
            whereClause.startDate = { lte: now };
            whereClause.endDate = { gt: now };
        }
        else {
            whereClause.OR = [{ startDate: { gt: now } }, { endDate: { lte: now } }];
        }
    }
    const deals = await prismaClient_1.default.deal.findMany({
        where: whereClause,
        include: { products: true },
        take: limit,
        skip: skip,
        orderBy: { createdAt: sort === "asc" ? "asc" : "desc" },
    });
    // Process products in each deal to add accessibleImageUrls
    const processedDeals = await Promise.all(deals.map(async (deal) => {
        const processedProducts = await (0, s3Aws_1.processProductsWithAccessibleUrls)(deal.products, 300);
        return {
            ...deal,
            products: processedProducts,
        };
    }));
    const totalPromotions = await prismaClient_1.default.promotion.count();
    return {
        data: processedDeals,
        currentPage: page,
        totalPages: Math.ceil(totalPromotions / limit),
        totalCount: totalPromotions,
    };
}
/**
 * Retrieves a single deal by its ID
 * - Throws an error if promotion is not found
 */
async function getDealById(dealId) {
    const deal = await prismaClient_1.default.deal.findUnique({
        where: { dealId },
        include: { products: true },
    });
    if (!deal) {
        throw new appError_1.AppError("Deal not found", http_status_1.default.NOT_FOUND);
    }
    const productsWithAccessibleUrls = await (0, s3Aws_1.processProductsWithAccessibleUrls)(deal.products, 300);
    return {
        ...deal,
        products: productsWithAccessibleUrls,
    };
}
/**
 * Updates an existing deal by its ID
 * - Throws an error if deal is not found
 */
async function updateDeal(dealId, data) {
    const existingDeal = await prismaClient_1.default.deal.findUnique({ where: { dealId } });
    if (!existingDeal) {
        throw new appError_1.AppError("Deal not found", http_status_1.default.NOT_FOUND);
    }
    // If deal is global, ensure there's no other active global deal
    if (data.isGlobal) {
        const now = new Date();
        const otherActiveGlobalDeal = await prismaClient_1.default.deal.findFirst({
            where: {
                isGlobal: true,
                dealId: { not: dealId },
                startDate: { lte: now },
                endDate: { gte: now },
            },
        });
        if (otherActiveGlobalDeal) {
            throw new appError_1.AppError("Another active global deal already exists.", http_status_1.default.BAD_REQUEST);
        }
    }
    // If not global, must have productIds
    if (data.isGlobal === false &&
        (!data.productIds || data.productIds.length === 0)) {
        throw new appError_1.AppError("Please provide productIds for non-global deals.", http_status_1.default.BAD_REQUEST);
    }
    // Check for active deals on the products (excluding this deal)
    if (!data.isGlobal && data.productIds?.length) {
        const now = new Date();
        const productsWithDeal = await prismaClient_1.default.product.findMany({
            where: {
                productId: { in: data.productIds },
                deal: {
                    NOT: { dealId },
                    startDate: { lte: now },
                    endDate: { gte: now },
                },
            },
        });
        if (productsWithDeal.length > 0) {
            const ids = productsWithDeal.map((p) => p.productId);
            throw new appError_1.AppError(`These products already have active deals: ${ids.join(", ")}`, http_status_1.default.BAD_REQUEST);
        }
    }
    return await prismaClient_1.default.$transaction(async (tx) => {
        // Update deal
        const updatedDeal = await tx.deal.update({
            where: { dealId },
            data: {
                title: data.title,
                description: data.description,
                discountType: data.discountType,
                discountValue: data.discountValue,
                startDate: data.startDate,
                endDate: data.endDate,
                isGlobal: data.isGlobal,
            },
        });
        // If non-global and productIds are provided, reassign them
        if (!data.isGlobal && data.productIds) {
            // Unassign the deal from all previously assigned products
            await tx.product.updateMany({
                where: { dealId },
                data: { dealId: null },
            });
            // Assign the deal to new products
            await tx.product.updateMany({
                where: { productId: { in: data.productIds } },
                data: { dealId },
            });
        }
        return updatedDeal;
    });
}
/**
 * Deletes a deal by its ID
 * - Throws an error if deal not found
 */
async function deleteDeal(dealId) {
    const deal = await prismaClient_1.default.deal.findUnique({
        where: { dealId },
    });
    if (!deal) {
        throw new appError_1.AppError("Deal not found", http_status_1.default.NOT_FOUND);
    }
    // Delete deal
    await prismaClient_1.default.deal.delete({ where: { dealId } });
}
