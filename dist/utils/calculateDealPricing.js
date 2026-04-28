"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateDealPricing = calculateDealPricing;
const prismaClient_1 = __importDefault(require("../prisma-client/prismaClient"));
const library_1 = require("@prisma/client/runtime/library");
/**
 * Calculates the pricing for a product considering both global and product-specific deals.
 * Product-specific deals take precedence over global deals if both are active.
 */
async function calculateDealPricing(product) {
    const now = new Date();
    let activeDeal = null;
    // Check if product-specific deal is active
    if (product.deal &&
        product.deal.startDate <= now &&
        product.deal.endDate >= now) {
        activeDeal = product.deal;
    }
    else {
        //  No product deal → check for global deal
        const globalDeal = await prismaClient_1.default.deal.findFirst({
            where: {
                isGlobal: true,
                startDate: { lte: now },
                endDate: { gte: now },
            },
        });
        if (globalDeal) {
            activeDeal = globalDeal;
        }
    }
    //  If no deal found, return defaults
    if (!activeDeal) {
        return {
            hasActiveDeal: false,
            hasActiveGlobalDeal: false,
            discountType: null,
            discountValue: null,
            discountUnitPrice: null,
        };
    }
    // Calculate price with the active deal
    let discountUnitPrice;
    const discountValue = activeDeal.discountValue;
    if (activeDeal.discountType === "PERCENTAGE") {
        const percentage = discountValue / 100;
        discountUnitPrice = product.unitPrice.mul(new library_1.Decimal(1 - percentage));
    }
    else {
        discountUnitPrice = product.unitPrice.sub(discountValue);
        if (discountUnitPrice.lessThan(0)) {
            discountUnitPrice = new library_1.Decimal(0);
        }
    }
    return {
        hasActiveDeal: activeDeal.isGlobal ? false : true,
        hasActiveGlobalDeal: activeDeal.isGlobal,
        discountType: activeDeal.discountType,
        discountValue: activeDeal.discountValue,
        discountUnitPrice,
    };
}
