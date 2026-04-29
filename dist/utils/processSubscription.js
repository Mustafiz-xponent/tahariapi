"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCODPayment = exports.handleWalletPayment = exports.createSubscriptionDelivery = exports.createOrderWithItems = exports.updateSubscriptionProcessing = exports.updateProductStock = exports.canLockNextPayment = exports.hasInsufficientWalletBalance = exports.hasInsufficientStock = exports.upcomingDelivery = exports.getNextDeliveryDate = exports.isEligibleForNearestDelivery = exports.calculateNearestDeliveryDate = exports.getNextRenewalDate = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
const prismaClient_1 = __importDefault(require("../prisma-client/prismaClient"));
const sendNotification_1 = require("../utils/sendNotification");
const orderService = __importStar(require("../modules/orders/orders.service"));
const socket_1 = require("../utils/socket");
const date_fns_1 = require("date-fns");
//  Buffer days for each frequency
const defaultBufferConfig = { WEEKLY: 2, MONTHLY: 2 }; // 2 day buffer before delivery date
// Calculate renewal date (always fixed: today + 7 or +30)
const getNextRenewalDate = (currentDate, frequency) => {
    if (frequency === "MONTHLY")
        return (0, date_fns_1.addMonths)(currentDate, 1);
    if (frequency === "WEEKLY")
        return (0, date_fns_1.addWeeks)(currentDate, 1);
    throw new Error(`Invalid frequency: ${frequency}`);
};
exports.getNextRenewalDate = getNextRenewalDate;
// Calculate nearest delivery date (e.g.,weekly - next Saturday, monthly - next month's first day)
const calculateNearestDeliveryDate = (currentDate, frequency) => {
    if (frequency === "WEEKLY")
        return (0, date_fns_1.nextSaturday)(currentDate);
    if (frequency === "MONTHLY")
        return (0, date_fns_1.startOfMonth)((0, date_fns_1.addMonths)(currentDate, 1));
    throw new Error(`Invalid frequency: ${frequency}`);
};
exports.calculateNearestDeliveryDate = calculateNearestDeliveryDate;
// Determine if purchase is eligible for nearest delivery cycle
const isEligibleForNearestDelivery = (currentDate, deliveryDate, bufferDays) => {
    const bufferThreshold = (0, date_fns_1.addDays)(deliveryDate, -bufferDays);
    return (0, date_fns_1.isBefore)(currentDate, bufferThreshold);
};
exports.isEligibleForNearestDelivery = isEligibleForNearestDelivery;
// Generate subscription schedule
const getNextDeliveryDate = (currentDate, frequency) => {
    const bufferDays = { ...defaultBufferConfig }[frequency];
    const nearestDeliveryDate = (0, exports.calculateNearestDeliveryDate)(currentDate, frequency);
    const eligibleForCurrentCycle = (0, exports.isEligibleForNearestDelivery)(currentDate, nearestDeliveryDate, bufferDays);
    const deliveryDate = eligibleForCurrentCycle
        ? nearestDeliveryDate
        : (0, exports.calculateNearestDeliveryDate)((0, date_fns_1.addDays)(currentDate, 7), frequency);
    return deliveryDate;
};
exports.getNextDeliveryDate = getNextDeliveryDate;
const upcomingDelivery = async (tx, subscriptionId) => {
    const today = new Date();
    const upcomingDelivery = await tx.subscriptionDelivery.findFirst({
        where: { subscriptionId, deliveryDate: { gte: today } },
        orderBy: { deliveryDate: "asc" },
    });
    return upcomingDelivery;
};
exports.upcomingDelivery = upcomingDelivery;
const hasInsufficientStock = (product, quantity = 1) => {
    return product.packageSize * quantity > product.stockQuantity;
};
exports.hasInsufficientStock = hasInsufficientStock;
const hasInsufficientWalletBalance = (wallet, price) => {
    return (wallet.balance.toNumber() - wallet.lockedBalance.toNumber() <
        price.toNumber());
};
exports.hasInsufficientWalletBalance = hasInsufficientWalletBalance;
const canLockNextPayment = (wallet, price) => {
    return (wallet.balance.toNumber() - wallet.lockedBalance.toNumber() >=
        price.toNumber());
};
exports.canLockNextPayment = canLockNextPayment;
// Notification helper functions
const pauseAndNotifyInsufficientStock = async (subscription, customer, tx) => {
    await pauseSubscription(subscription.subscriptionId, tx);
    // Notify the customer
    const notificationMessage = `আপনার সাবস্ক্রিপশন সাময়িকভাবে বন্ধ হয়েছে কারণ পণ্যটি স্টকে নেই।`;
    await (0, sendNotification_1.sendNotification)(notificationMessage, "SUBSCRIPTION", "CUSTOMER", customer.userId, tx);
    logger_1.default.warn(`Subscription ${subscription.subscriptionId} paused due to insufficient stock.`);
};
const pauseSubscription = async (subscriptionId, tx) => {
    await tx.subscription.update({
        where: { subscriptionId },
        data: { status: "PAUSED", isProcessing: false, nextDeliveryDate: null },
    });
};
const updateProductStock = async (product, tx, orderId) => {
    const quantity = product.packageSize;
    await tx.product.update({
        where: { productId: product.productId },
        data: {
            stockQuantity: { decrement: quantity },
        },
    });
    await tx.stockTransaction.create({
        data: {
            quantity,
            transactionType: "OUT",
            productId: product.productId,
            orderId,
            description: `Stock reduced for Order #${orderId}`,
        },
    });
};
exports.updateProductStock = updateProductStock;
const updateSubscriptionProcessing = async (subscriptionId, isProcessing) => {
    await prismaClient_1.default.subscription.update({
        where: { subscriptionId },
        data: { isProcessing },
    });
};
exports.updateSubscriptionProcessing = updateSubscriptionProcessing;
const createOrderWithItems = async (subscription, customer, product, price, paymentMethod, tx) => {
    const order = await tx.order.create({
        data: {
            status: "CONFIRMED",
            paymentStatus: paymentMethod === "WALLET" ? "LOCKED" : "PENDING",
            paymentMethod,
            totalAmount: price,
            isSubscription: true,
            customerId: Number(customer.customerId),
            shippingAddress: subscription.shippingAddress,
        },
    });
    // Create order items
    await tx.orderItem.create({
        data: {
            quantity: 1,
            unitPrice: Number(product.unitPrice),
            unitType: product.unitType,
            packageSize: product.packageSize,
            subtotal: Number(product.unitPrice) * Number(product.packageSize),
            orderId: order.orderId,
            productId: product.productId,
        },
    });
    await tx.orderTracking.createMany({
        data: [
            {
                orderId: order.orderId,
                status: "PENDING", // Created a pending tracking record for consistency
                description: "Order created and waiting for confirmation",
            },
            {
                orderId: order.orderId,
                status: "CONFIRMED",
                description: paymentMethod === "WALLET"
                    ? "Order confirmed and payment locked in wallet"
                    : "Order confirmed. Payment pending for Cash on Delivery",
            },
        ],
    });
    // Emit all connected Support/Admin
    if (order) {
        const orderData = await orderService.getOrderById(order.orderId);
        const sockets = (0, socket_1.getOnlineAdminSupportSockets)();
        sockets.forEach((socketId) => {
            socket_1.io.to(socketId).emit("newOrder", orderData);
        });
    }
    // Notify the admin/support
    const message = `নতুন সাবস্ক্রিপশন অর্ডার তৈরি হয়েছে। অর্ডার আইডি: #${order.orderId}`;
    await (0, sendNotification_1.sendNotification)(message, "ORDER", "ADMIN_SUPPORT", null, tx);
    return order;
};
exports.createOrderWithItems = createOrderWithItems;
const createSubscriptionDelivery = async (subscription, order, today, customer, paymentMethod, tx) => {
    const frequency = subscription.subscriptionPlan.frequency;
    const nextDeliveryDate = (0, exports.getNextDeliveryDate)(today, frequency);
    await tx.subscriptionDelivery.create({
        data: {
            deliveryDate: nextDeliveryDate,
            status: "CONFIRMED",
            subscriptionId: subscription.subscriptionId,
            orderId: order.orderId,
        },
    });
    // Notify the customer
    let message = ``;
    if (paymentMethod === "WALLET") {
        message = `আপনার সাবস্ক্রিপশন ডেলিভারি নির্ধারিত হয়েছে।`;
    }
    else if (paymentMethod === "COD") {
        message = `আপনার সাবস্ক্রিপশন ডেলিভারি নির্ধারিত হয়েছে। দয়া করে পণ্য গ্রহণের সময় পেমেন্ট করুন।`;
    }
    await (0, sendNotification_1.sendNotification)(message, "SUBSCRIPTION", "CUSTOMER", customer.userId, tx);
};
exports.createSubscriptionDelivery = createSubscriptionDelivery;
const getProduct = async (subscription, tx) => {
    const product = await tx.product.findUnique({
        where: { productId: subscription.subscriptionPlan.productId },
    });
    if (!product) {
        throw new Error(`Product not found for subscription ${subscription.subscriptionId}`);
    }
    return product;
};
const handleRenewalWalletPayment = async (subscription, customer, price, today, tx) => {
    const wallet = customer.wallet;
    const frequency = subscription.subscriptionPlan.frequency;
    const nextRenewal = (0, exports.getNextRenewalDate)(today, frequency);
    const delivery = await (0, exports.upcomingDelivery)(tx, subscription.subscriptionId);
    let nextDeliveryDate;
    if (delivery) {
        nextDeliveryDate = delivery.deliveryDate;
    }
    else {
        nextDeliveryDate = (0, exports.getNextDeliveryDate)(today, frequency);
    }
    const product = await getProduct(subscription, tx);
    if ((0, exports.hasInsufficientStock)(product)) {
        await pauseAndNotifyInsufficientStock(subscription, customer, tx);
        return;
    }
    if ((0, exports.canLockNextPayment)(wallet, price)) {
        await tx.wallet.update({
            where: { walletId: Number(wallet.walletId) },
            data: { lockedBalance: { increment: price } },
        });
        await tx.subscription.update({
            where: { subscriptionId: subscription.subscriptionId },
            data: {
                renewalDate: nextRenewal,
                planPrice: price, // update plan price with latest plan price
                isProcessing: false,
                nextDeliveryDate,
            },
        });
        // Create order and related records
        const order = await (0, exports.createOrderWithItems)(subscription, customer, product, price, "WALLET", tx);
        // Create wallet transaction
        const walletTransaction = await tx.walletTransaction.create({
            data: {
                amount: price,
                transactionType: "PURCHASE",
                transactionStatus: "LOCKED",
                description: `LOCK_FUNDS_FOR_SUBSCRIPTION:#${subscription.subscriptionId}_PLAN:#${subscription.subscriptionPlan.planId}_ORDER:#${order.orderId}`, // Required description for further processing
                walletId: wallet.walletId,
                orderId: order.orderId,
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
        await (0, exports.updateProductStock)(product, tx, order.orderId);
        // Create subscription delivery
        await (0, exports.createSubscriptionDelivery)(subscription, order, today, customer, "WALLET", tx);
        // Notify the customer
        const message = `আপনার সাবস্ক্রিপশন সফলভাবে রিনিউ হয়েছে।`;
        await (0, sendNotification_1.sendNotification)(message, "SUBSCRIPTION", "CUSTOMER", customer.userId, tx);
        logger_1.default.info(`Renewed subscription ${subscription.subscriptionId} with WALLET.`);
    }
    else {
        await pauseSubscription(subscription.subscriptionId, tx);
        // Notify the customer
        const notificationMessage = "পরবর্তী সাবস্ক্রিপশন পরিশোধের জন্য পর্যাপ্ত ব্যালেন্স নেই, অনুগ্রহ করে ওয়ালেট রিচার্জ করুন।";
        await (0, sendNotification_1.sendNotification)(notificationMessage, "SUBSCRIPTION", "CUSTOMER", customer.userId, tx);
        logger_1.default.warn(`Subscription ${subscription.subscriptionId} paused due to insufficient funds for next cycle.`);
    }
};
// Main function to handle wallet payment
const handleWalletPayment = async (subscription, today) => {
    const { customer, subscriptionPlan } = subscription;
    try {
        // Handle next renewal payment cycle
        await prismaClient_1.default.$transaction(async (tx) => {
            await handleRenewalWalletPayment(subscription, customer, subscriptionPlan.price, today, tx);
        });
    }
    catch (err) {
        await (0, exports.updateSubscriptionProcessing)(subscription.subscriptionId, false);
        console.error(err);
        logger_1.default.error("Error during wallet payment:", err);
        throw err;
    }
};
exports.handleWalletPayment = handleWalletPayment;
// Main function to handle COD payment
const handleCODPayment = async (subscription, today) => {
    const { customer, subscriptionPlan, planPrice: price } = subscription;
    await prismaClient_1.default.$transaction(async (tx) => {
        const product = await getProduct(subscription, tx);
        if ((0, exports.hasInsufficientStock)(product)) {
            await pauseAndNotifyInsufficientStock(subscription, customer, tx);
            return;
        }
        const order = await (0, exports.createOrderWithItems)(subscription, customer, product, price, "COD", tx);
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
        await (0, exports.createSubscriptionDelivery)(subscription, order, today, customer, "COD", tx);
        // Update subscription for next delivery
        const frequency = subscription.subscriptionPlan.frequency;
        const nextRenewal = (0, exports.getNextRenewalDate)(today, frequency);
        const delivery = await (0, exports.upcomingDelivery)(tx, subscription.subscriptionId);
        let nextDeliveryDate;
        if (delivery) {
            nextDeliveryDate = delivery.deliveryDate;
        }
        else {
            nextDeliveryDate = (0, exports.getNextDeliveryDate)(today, frequency);
        }
        await tx.subscription.update({
            where: { subscriptionId: subscription.subscriptionId },
            data: {
                renewalDate: nextRenewal,
                planPrice: subscriptionPlan.price, // update plan price with latest plan price
                isProcessing: false,
                nextDeliveryDate,
            },
        });
        logger_1.default.info(`Renewed subscription ${subscription.subscriptionId} with COD.`);
    });
};
exports.handleCODPayment = handleCODPayment;
