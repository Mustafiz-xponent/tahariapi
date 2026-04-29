"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSubscriptionPlan = createSubscriptionPlan;
exports.getAllSubscriptionPlans = getAllSubscriptionPlans;
exports.getSubscriptionPlanById = getSubscriptionPlanById;
exports.updateSubscriptionPlan = updateSubscriptionPlan;
exports.deleteSubscriptionPlan = deleteSubscriptionPlan;
/**
 * Service layer for SubscriptionPlan entity operations.
 * Contains business logic and database interactions for subscription plans.
 */
const prismaClient_1 = __importDefault(require("@/prisma-client/prismaClient"));
const errorHandler_1 = require("@/utils/errorHandler");
const s3Aws_1 = require("@/utils/fileUpload/s3Aws");
/**
 * Create a new subscription plan
 * @param data - Data required to create a subscription plan
 * @returns The created subscription plan
 * @throws Error if the subscription plan cannot be created (e.g., invalid foreign keys)
 */
async function createSubscriptionPlan(data) {
    try {
        const product = await prismaClient_1.default.product.findUnique({
            where: { productId: data.productId },
        });
        if (!product) {
            throw new Error("Product not found");
        }
        if (!product.isSubscription) {
            throw new Error("Product is not under subscription");
        }
        const subscriptionPlan = await prismaClient_1.default.subscriptionPlan.create({
            data: {
                name: data.name,
                frequency: data.frequency,
                price: data.price,
                description: data.description,
                productId: data.productId,
            },
        });
        return subscriptionPlan;
    }
    catch (error) {
        throw new Error(`Failed to create subscription plan: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Retrieve all subscription plans
 * @returns An array of all subscription plans
 * @throws Error if the query fails
 */
async function getAllSubscriptionPlans() {
    try {
        const subscriptionPlans = await prismaClient_1.default.subscriptionPlan.findMany({
            include: { product: true },
        });
        // Enrich each subscription plan  product with accessibleImageUrls
        const processedSubscriptionPlans = await Promise.all(subscriptionPlans.map(async (subscriptionPlan) => {
            const product = subscriptionPlan.product;
            if (product?.imageUrls?.length) {
                const accessibleImageUrls = await (0, s3Aws_1.getBatchAccessibleImageUrls)(product.imageUrls, product.isPrivateImages ?? false);
                subscriptionPlan.product = {
                    ...product,
                    accessibleImageUrls,
                };
            }
            return subscriptionPlan;
        }));
        return processedSubscriptionPlans;
    }
    catch (error) {
        throw new Error(`Failed to fetch subscription plans: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Retrieve a subscription plan by its ID
 * @param planId - The ID of the subscription plan
 * @returns The subscription plan if found, or null if not found
 * @throws Error if the query fails
 */
async function getSubscriptionPlanById(planId) {
    try {
        const subscriptionPlan = await prismaClient_1.default.subscriptionPlan.findUnique({
            where: { planId: Number(planId) },
            include: { product: true },
        });
        if (!subscriptionPlan)
            throw new Error("Subscription plan not found");
        const product = subscriptionPlan?.product;
        if (product?.imageUrls?.length) {
            const accessibleImageUrls = await (0, s3Aws_1.getBatchAccessibleImageUrls)(product.imageUrls, product.isPrivateImages ?? false);
            // Attach accessibleImageUrls to the product
            subscriptionPlan.product = {
                ...product,
                accessibleImageUrls,
            };
        }
        return subscriptionPlan;
    }
    catch (error) {
        throw new Error(`Failed to fetch subscription plan: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Update a subscription plan by its ID
 * @param planId - The ID of the subscription plan to update
 * @param data - Data to update the subscription plan
 * @returns The updated subscription plan
 * @throws Error if the subscription plan is not found or update fails
 */
async function updateSubscriptionPlan(planId, data) {
    try {
        const existingPlan = await prismaClient_1.default.subscriptionPlan.findUnique({
            where: { planId: Number(planId) },
        });
        if (!existingPlan) {
            throw new Error("Subscription plan not found");
        }
        const subscriptionPlan = await prismaClient_1.default.subscriptionPlan.update({
            where: { planId: Number(planId) },
            data: {
                name: data.name,
                frequency: data.frequency,
                price: data.price,
                description: data.description,
                productId: data.productId,
            },
        });
        return subscriptionPlan;
    }
    catch (error) {
        throw new Error(`Failed to update subscription plan: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Delete a subscription plan by its ID
 * @param planId - The ID of the subscription plan to delete
 * @throws Error if the subscription plan is not found or deletion fails
 */
async function deleteSubscriptionPlan(planId) {
    try {
        await prismaClient_1.default.subscriptionPlan.delete({
            where: { planId: Number(planId) },
        });
    }
    catch (error) {
        throw new Error(`Failed to delete subscription plan: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
