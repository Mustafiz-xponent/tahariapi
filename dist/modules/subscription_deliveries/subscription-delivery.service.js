"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSubscriptionDelivery = createSubscriptionDelivery;
exports.getAllSubscriptionDeliveries = getAllSubscriptionDeliveries;
exports.getSubscriptionDeliveryById = getSubscriptionDeliveryById;
exports.updateSubscriptionDelivery = updateSubscriptionDelivery;
exports.deleteSubscriptionDelivery = deleteSubscriptionDelivery;
/**
 * Service layer for SubscriptionDelivery entity operations.
 * Contains business logic and database interactions for subscription deliveries.
 */
const prismaClient_1 = __importDefault(require("../../prisma-client/prismaClient"));
const errorHandler_1 = require("../../utils/errorHandler");
/**
 * Create a new subscription delivery
 */
async function createSubscriptionDelivery(data) {
    try {
        const subscription = await prismaClient_1.default.subscription.findUnique({
            where: { subscriptionId: Number(data.subscriptionId) },
        });
        if (!subscription) {
            throw new Error("Subscription not found");
        }
        const order = await prismaClient_1.default.order.findUnique({
            where: { orderId: Number(data.orderId) },
        });
        if (!order) {
            throw new Error("Order not found");
        }
        const subscriptionDelivery = await prismaClient_1.default.subscriptionDelivery.create({
            data: {
                deliveryDate: new Date(data.deliveryDate),
                status: data.status,
                subscriptionId: data.subscriptionId,
                orderId: data.orderId,
            },
        });
        return subscriptionDelivery;
    }
    catch (error) {
        throw new Error(`Failed to create subscription delivery: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Retrieve all subscription deliveries
 */
async function getAllSubscriptionDeliveries() {
    try {
        const subscriptionDeliveries = await prismaClient_1.default.subscriptionDelivery.findMany();
        return subscriptionDeliveries;
    }
    catch (error) {
        throw new Error(`Failed to fetch subscription deliveries: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Retrieve a subscription delivery by its ID
 */
async function getSubscriptionDeliveryById(deliveryId) {
    try {
        const subscriptionDelivery = await prismaClient_1.default.subscriptionDelivery.findUnique({
            where: { deliveryId: Number(deliveryId) },
        });
        return subscriptionDelivery;
    }
    catch (error) {
        throw new Error(`Failed to fetch subscription delivery: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Update a subscription delivery by its ID
 */
async function updateSubscriptionDelivery(deliveryId, data) {
    try {
        if (data.subscriptionId) {
            const subscription = await prismaClient_1.default.subscription.findUnique({
                where: { subscriptionId: Number(data.subscriptionId) },
            });
            if (!subscription) {
                throw new Error("Subscription not found");
            }
        }
        if (data.orderId) {
            const order = await prismaClient_1.default.order.findUnique({
                where: { orderId: Number(data.orderId) },
            });
            if (!order) {
                throw new Error("Order not found");
            }
        }
        const subscriptionDelivery = await prismaClient_1.default.subscriptionDelivery.update({
            where: { deliveryId: Number(deliveryId) },
            data: {
                deliveryDate: data.deliveryDate
                    ? new Date(data.deliveryDate)
                    : undefined,
                status: data.status,
                subscriptionId: data.subscriptionId,
                orderId: data.orderId,
            },
        });
        return subscriptionDelivery;
    }
    catch (error) {
        throw new Error(`Failed to update subscription delivery: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Delete a subscription delivery by its ID
 */
async function deleteSubscriptionDelivery(deliveryId) {
    try {
        await prismaClient_1.default.subscriptionDelivery.delete({
            where: { deliveryId: Number(deliveryId) },
        });
    }
    catch (error) {
        throw new Error(`Failed to delete subscription delivery: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
