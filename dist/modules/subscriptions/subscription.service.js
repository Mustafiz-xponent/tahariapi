"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSubscription = createSubscription;
exports.getAllSubscriptions = getAllSubscriptions;
exports.getSubscriptionById = getSubscriptionById;
exports.getCustomerSubscriptions = getCustomerSubscriptions;
exports.updateSubscription = updateSubscription;
exports.pauseSubscription = pauseSubscription;
exports.resumeSubscription = resumeSubscription;
exports.cancelSubscription = cancelSubscription;
exports.deleteSubscription = deleteSubscription;
/**
 * Service layer for Subscription entity operations.
 * Contains business logic and database interactions for subscriptions.
 */
const prismaClient_1 = __importDefault(require("../../prisma-client/prismaClient"));
const errorHandler_1 = require("../../utils/errorHandler");
const sendNotification_1 = require("../../utils/sendNotification");
const s3Aws_1 = require("../../utils/fileUpload/s3Aws");
const subscriptionAction_1 = require("../../utils/subscriptionAction");
const processSubscription_1 = require("../../utils/processSubscription");
/**
 * Create a new subscription
 */
async function createSubscription(userId, data) {
    try {
        // Find plan & validate
        const plan = await prismaClient_1.default.subscriptionPlan.findUnique({
            where: { planId: data.planId },
            include: { product: true },
        });
        if (!plan)
            throw new Error("Subscription plan not found");
        if (!plan.product?.isSubscription) {
            throw new Error(`Product ${plan.product?.name || "N/A"} is not available for subscription`);
        }
        // check stock availability
        if ((0, processSubscription_1.hasInsufficientStock)(plan.product, 1)) {
            throw new Error(`Insufficient stock`);
        }
        // Find customer & validate
        const customer = await prismaClient_1.default.customer.findUnique({
            where: { userId },
            include: { wallet: true },
        });
        if (!customer)
            throw new Error("Customer not found");
        const isPlanPurchased = await prismaClient_1.default.subscription.findFirst({
            where: {
                planId: data.planId,
                customerId: customer.customerId,
                NOT: { status: "CANCELLED" },
            },
        });
        if (isPlanPurchased)
            throw new Error("Plan already purchased");
        //  Create subscription
        const now = new Date();
        const frequency = plan.frequency;
        const renewalDate = (0, processSubscription_1.getNextRenewalDate)(now, frequency);
        const nextDeliveryDate = (0, processSubscription_1.getNextDeliveryDate)(now, frequency);
        return await prismaClient_1.default.$transaction(async (tx) => {
            const subscription = await tx.subscription.create({
                data: {
                    startDate: now,
                    renewalDate: renewalDate,
                    status: "ACTIVE",
                    paymentMethod: data.paymentMethod,
                    planPrice: plan.price,
                    customerId: customer.customerId,
                    nextDeliveryDate,
                    planId: data.planId,
                    shippingAddress: data.shippingAddress,
                },
                include: {
                    customer: { include: { wallet: true } },
                    subscriptionPlan: { include: { product: true } },
                },
            });
            //  Handle payment method
            if (data.paymentMethod === "WALLET") {
                if (!customer.wallet) {
                    throw new Error("Wallet not found. Please create wallet first");
                }
                if (!(0, processSubscription_1.canLockNextPayment)(customer.wallet, plan.price)) {
                    throw new Error("Insufficient wallet balance to lock funds.");
                }
                // Lock funds
                await tx.wallet.update({
                    where: { walletId: customer.wallet.walletId },
                    data: {
                        lockedBalance: {
                            increment: plan.price,
                        },
                    },
                });
                const order = await (0, processSubscription_1.createOrderWithItems)(subscription, customer, plan.product, plan.price, "WALLET", tx);
                // Record wallet transaction for lock
                const walletTransaction = await tx.walletTransaction.create({
                    data: {
                        walletId: customer.wallet.walletId,
                        amount: plan.price,
                        transactionType: "PURCHASE",
                        transactionStatus: "LOCKED",
                        orderId: order.orderId,
                        description: `LOCK_FUNDS_FOR_SUBSCRIPTION:#${subscription.subscriptionId}_PLAN:#${subscription.subscriptionPlan.planId}_ORDER:#${order.orderId}`, // Required description for further processing!!!
                    },
                });
                // Create payment record
                await tx.payment.create({
                    data: {
                        amount: order.totalAmount,
                        paymentMethod: "WALLET",
                        paymentStatus: "LOCKED",
                        orderId: order.orderId,
                        transactionId: `ORDER_${order.orderId}_${Date.now()}`,
                        walletTransactionId: walletTransaction.transactionId,
                    },
                });
                // Update product stock
                await (0, processSubscription_1.updateProductStock)(plan.product, tx, order.orderId);
                // Create subscription delivery
                await (0, processSubscription_1.createSubscriptionDelivery)(subscription, order, now, customer, "WALLET", tx);
            }
            else if (data.paymentMethod === "COD") {
                const order = await (0, processSubscription_1.createOrderWithItems)(subscription, customer, plan.product, plan.price, "COD", tx);
                // Create pending payment record
                await tx.payment.create({
                    data: {
                        amount: order.totalAmount,
                        paymentMethod: "COD",
                        paymentStatus: "PENDING",
                        orderId: order.orderId,
                        transactionId: `ORDER_${order.orderId}_${Date.now()}`,
                    },
                });
                // Create subscription delivery
                await (0, processSubscription_1.createSubscriptionDelivery)(subscription, order, now, customer, "COD", tx);
            }
            else {
                throw new Error("Invalid payment method. Must be WALLET or COD.");
            }
            // Notify the admin/support
            const notificationMessage = `একজন ব্যবহারকারী সফলভাবে একটি প্ল্যানে সাবস্ক্রাইব সম্পন্ন করেছেন। 
      সাবস্ক্রিপশন আইডি: #${subscription.subscriptionId} এবং গ্রাহকের আইডি: #${subscription.customer.customerId}`;
            await (0, sendNotification_1.sendNotification)(notificationMessage, "SUBSCRIPTION", "ADMIN_SUPPORT", null, tx);
            return subscription;
        });
    }
    catch (error) {
        throw new Error(`Failed to create subscription: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Retrieve all subscriptions
 */
async function getAllSubscriptions() {
    try {
        const subscriptions = await prismaClient_1.default.subscription.findMany();
        return subscriptions;
    }
    catch (error) {
        throw new Error(`Failed to fetch subscriptions: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Retrieve a subscription by its ID
 */
async function getSubscriptionById(subscriptionId) {
    try {
        const subscription = await prismaClient_1.default.subscription.findUnique({
            where: { subscriptionId: Number(subscriptionId) },
            include: { subscriptionPlan: { include: { product: true } } },
        });
        if (!subscription)
            throw new Error("Subscription not found");
        const product = subscription.subscriptionPlan?.product;
        if (product?.imageUrls?.length) {
            const accessibleImageUrls = await (0, s3Aws_1.getBatchAccessibleImageUrls)(product.imageUrls, product.isPrivateImages ?? false);
            // Attach accessibleImageUrls to the product
            subscription.subscriptionPlan.product = {
                ...product,
                accessibleImageUrls,
            };
        }
        return subscription;
    }
    catch (error) {
        throw new Error(`Failed to fetch subscription: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Retrieve customer subscriptions
 */
async function getCustomerSubscriptions(userId, paginationParams, status) {
    try {
        const { page, limit, skip, sort } = paginationParams;
        const customer = await prismaClient_1.default.customer.findUnique({
            where: { userId: Number(userId) },
        });
        if (!customer)
            throw new Error("Customer not found");
        const subscriptions = await prismaClient_1.default.subscription.findMany({
            where: { customerId: customer.customerId, ...(status && { status }) },
            include: { subscriptionPlan: { include: { product: true } } },
            take: limit,
            skip: skip,
            orderBy: {
                createdAt: sort === "asc" ? "asc" : "desc",
            },
        });
        // Enrich each subscription's product with accessibleImageUrls
        const processedSubscriptions = await Promise.all(subscriptions.map(async (subscription) => {
            const product = subscription.subscriptionPlan?.product;
            if (product?.imageUrls?.length) {
                const accessibleImageUrls = await (0, s3Aws_1.getBatchAccessibleImageUrls)(product.imageUrls, product.isPrivateImages ?? false);
                subscription.subscriptionPlan.product = {
                    ...product,
                    accessibleImageUrls,
                };
            }
            return subscription;
        }));
        return {
            subscriptions: processedSubscriptions,
            currentPage: page,
            totalPages: Math.ceil(subscriptions.length / limit),
            totalCount: subscriptions.length,
        };
    }
    catch (error) {
        throw new Error(`Failed to fetch subscription: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Update a subscription by its ID
 */
async function updateSubscription(subscriptionId, data) {
    try {
        if (data.customerId) {
            const customer = await prismaClient_1.default.customer.findUnique({
                where: { customerId: data.customerId },
            });
            if (!customer) {
                throw new Error("Customer not found");
            }
        }
        if (data.planId) {
            const plan = await prismaClient_1.default.subscriptionPlan.findUnique({
                where: { planId: Number(data.planId) },
            });
            if (!plan) {
                throw new Error("Subscription plan not found");
            }
        }
        const subscription = await prismaClient_1.default.subscription.update({
            where: { subscriptionId: Number(subscriptionId) },
            data: {
                startDate: data.startDate ? new Date(data.startDate) : undefined,
                endDate: data.endDate ? new Date(data.endDate) : undefined,
                status: data.status,
                renewalDate: data.renewalDate ? new Date(data.renewalDate) : undefined,
                customerId: data.customerId,
                planId: data.planId,
            },
        });
        return subscription;
    }
    catch (error) {
        throw new Error(`Failed to update subscription: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Pause a subscription by its ID
 */
async function pauseSubscription(subscriptionId, userId) {
    try {
        const bufferDays = 2;
        const subscription = await prismaClient_1.default.subscription.findUnique({
            where: { subscriptionId: Number(subscriptionId) },
            include: {
                subscriptionDeliveries: true,
                subscriptionPlan: true,
                customer: { include: { wallet: true } },
            },
        });
        if (!subscription)
            throw new Error("Subscription not found");
        const customer = await prismaClient_1.default.customer.findUnique({
            where: { userId: Number(userId) },
        });
        if (customer?.customerId !== subscription.customerId) {
            throw new Error(`You are not permitted to pause this subscription`);
        }
        if (subscription.status === "PAUSED" ||
            subscription.status === "CANCELLED") {
            throw new Error(`Subscription already ${subscription.status}`);
        }
        const result = await (0, subscriptionAction_1.pauseOrCancelSubscription)(subscription, "PAUSED", bufferDays, userId);
        return result;
    }
    catch (error) {
        throw new Error(`Failed to pause subscription: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Resume a subscription by its ID
 */
async function resumeSubscription(subscriptionId, userId) {
    try {
        const subscription = await prismaClient_1.default.subscription.findUnique({
            where: { subscriptionId: Number(subscriptionId) },
            include: {
                subscriptionDeliveries: true,
                subscriptionPlan: { include: { product: true } },
                customer: { include: { wallet: true } },
            },
        });
        if (!subscription)
            throw new Error("Subscription not found");
        const customer = await prismaClient_1.default.customer.findUnique({
            where: { userId: Number(userId) },
        });
        if (customer?.customerId !== subscription.customerId) {
            throw new Error(`You are not permitted to resume this subscription`);
        }
        if (subscription.status === "ACTIVE" ||
            subscription.status === "CANCELLED") {
            throw new Error(`Subscription already ${subscription.status}`);
        }
        const result = await (0, subscriptionAction_1.processResumeSubscription)(subscription, userId);
        return result;
    }
    catch (error) {
        throw new Error(`Failed to resume subscription: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Cancel a subscription by its ID
 */
async function cancelSubscription(subscriptionId, userId) {
    try {
        const bufferDays = 2;
        const subscription = await prismaClient_1.default.subscription.findUnique({
            where: { subscriptionId: Number(subscriptionId) },
            include: {
                subscriptionDeliveries: true,
                subscriptionPlan: true,
                customer: { include: { wallet: true } },
            },
        });
        if (!subscription)
            throw new Error("Subscription not found");
        const customer = await prismaClient_1.default.customer.findUnique({
            where: { userId: Number(userId) },
        });
        if (customer?.customerId !== subscription.customerId) {
            throw new Error(`You are not permitted to cancel this subscription`);
        }
        if (subscription.status === "CANCELLED") {
            throw new Error("Subscription already cancelled");
        }
        let result;
        if (subscription.status === "PAUSED") {
            return await prismaClient_1.default.$transaction(async (tx) => {
                result = await tx.subscription.update({
                    where: { subscriptionId: subscription.subscriptionId },
                    data: { status: "CANCELLED" },
                });
                const message = `আপনার সাবস্ক্রিপশনটি বাতিল করা হয়েছে।`;
                await (0, sendNotification_1.sendNotification)(message, "SUBSCRIPTION", "CUSTOMER", userId, tx);
                return result;
            });
        }
        else {
            result = await (0, subscriptionAction_1.pauseOrCancelSubscription)(subscription, "CANCELLED", bufferDays, userId);
        }
        return result;
    }
    catch (error) {
        throw new Error(`Failed to cancel subscription: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Delete a subscription by its ID
 */
async function deleteSubscription(subscriptionId) {
    try {
        await prismaClient_1.default.subscription.delete({
            where: { subscriptionId: Number(subscriptionId) },
        });
    }
    catch (error) {
        throw new Error(`Failed to delete subscription: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
