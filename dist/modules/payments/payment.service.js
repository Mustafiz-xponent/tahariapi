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
exports.createPayment = createPayment;
exports.handleSSLCommerzSuccess = handleSSLCommerzSuccess;
exports.getOrderPaymentStatus = getOrderPaymentStatus;
exports.handleSSLCommerzFailure = handleSSLCommerzFailure;
exports.getAllPayments = getAllPayments;
exports.getPaymentById = getPaymentById;
exports.updatePayment = updatePayment;
exports.deletePayment = deletePayment;
/**
 * Service layer for Payment entity operations.
 * Contains business logic and database interactions for payments.
 */
const prismaClient_1 = __importDefault(require("../../prisma-client/prismaClient"));
const errorHandler_1 = require("../../utils/errorHandler");
const sendNotification_1 = require("../../utils/sendNotification");
const orderService = __importStar(require("../../modules/orders/orders.service"));
const socket_1 = require("../../utils/socket");
const client_1 = require("../../generated/prisma/client");
const getOrderStatusMessage_1 = require("../../utils/getOrderStatusMessage");
const processPayment_1 = require("../../utils/processPayment");
async function createPayment(data) {
    try {
        // Validate order exists and is pending payment
        const order = await prismaClient_1.default.order.findUnique({
            where: { orderId: Number(data.orderId) },
            include: {
                customer: {
                    include: {
                        wallet: true,
                        user: true,
                    },
                },
                orderItems: true,
            },
        });
        if (!order) {
            throw new Error("Order not found");
        }
        if (!["PENDING", "FAILED"].includes(order.paymentStatus)) {
            throw new Error(`Order is not payable. Current status: ${order.paymentStatus}`);
        }
        if (order.paymentMethod.toUpperCase() === "WALLET") {
            return await (0, processPayment_1.processWalletPayment)(data, order);
        }
        else if (order.paymentMethod.toUpperCase() === "SSLCOMMERZ") {
            return await (0, processPayment_1.processSSLCommerzPayment)(data, order);
        }
        else if (order.paymentMethod.toUpperCase() === "COD") {
            return await (0, processPayment_1.processCodPayment)(data, order);
        }
        else {
            throw new Error("Invalid payment method");
        }
    }
    catch (error) {
        throw new Error(`Failed to create payment: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
async function handleSSLCommerzSuccess(validationData) {
    try {
        // Validate payment with SSLCommerz  implementation
        const validation = await (0, processPayment_1.validateSSLCommerzPayment)(validationData);
        if (["VALID", "VALIDATED"].includes(validation.status)) {
            // Extract order ID from transaction ID
            const tranId = validationData.tran_id;
            const orderIdMatch = tranId.match(/ORDER_(\d+)_/);
            if (!orderIdMatch) {
                throw new Error("Invalid transaction ID format");
            }
            const orderId = BigInt(orderIdMatch[1]);
            // Update payment and order in transaction
            const paymentResult = await prismaClient_1.default.$transaction(async (tx) => {
                // Check payment status
                const payment = await tx.payment.findUnique({
                    where: {
                        orderId: Number(orderId),
                        transactionId: tranId,
                    },
                });
                if (!payment)
                    throw new Error("Payment record not found");
                if (payment.paymentStatus === "COMPLETED") {
                    return {
                        success: false,
                        message: "Payment was already completed successfully",
                    };
                }
                if (payment.paymentStatus !== "PENDING") {
                    throw new Error(`Cannot complete payment with status: ${payment.paymentStatus}`);
                }
                // Mark payment as COMPLETED
                await tx.payment.update({
                    where: { paymentId: payment.paymentId },
                    data: {
                        paymentStatus: "COMPLETED",
                        transactionId: tranId,
                    },
                });
                // Fetch the order
                const order = await tx.order.findUnique({
                    where: { orderId },
                    include: {
                        orderItems: true,
                        customer: {
                            include: {
                                user: true,
                            },
                        },
                    },
                });
                if (!order)
                    throw new Error("Order not found");
                //  Update order
                const updatedOrder = await tx.order.update({
                    where: { orderId },
                    data: {
                        paymentStatus: "COMPLETED",
                        status: "CONFIRMED",
                    },
                });
                //  Track status change
                await tx.orderTracking.create({
                    data: {
                        orderId,
                        status: "CONFIRMED",
                        description: "Order confirmed and payment completed via SSLCommerz",
                    },
                });
                // Reduce stock and log transaction
                for (const item of order.orderItems) {
                    await tx.product.update({
                        where: { productId: item.productId },
                        data: {
                            stockQuantity: {
                                decrement: item.quantity * item.packageSize,
                            },
                        },
                    });
                    await tx.stockTransaction.create({
                        data: {
                            quantity: item.quantity * item.packageSize,
                            transactionType: "OUT",
                            productId: item.productId,
                            orderId,
                            description: `Stock reduced for Order #${orderId} - SSLCommerz payment`,
                        },
                    });
                }
                // Notify the customer
                const message = (0, getOrderStatusMessage_1.getOrderStatusMessage)(updatedOrder.status, updatedOrder.orderId);
                await (0, sendNotification_1.sendNotification)(message, "ORDER", "CUSTOMER", order.customer.userId, tx);
                // Notify the admin/support
                const adminNotificationMessage = `একজন গ্রাহক একটি নতুন অর্ডার ক্রয় করেছেন। 
        অর্ডার আইডি: #${orderId} এবং গ্রাহকের আইডি: #${order.customer.customerId}`;
                await (0, sendNotification_1.sendNotification)(adminNotificationMessage, "ORDER", "ADMIN_SUPPORT", null, tx);
                return {
                    success: true,
                    message: "SSLCommerz payment completed successfully",
                };
            });
            // Emit to all connected support/admin sockets
            if (paymentResult.success) {
                const orderData = await orderService.getOrderById(orderId);
                const sockets = (0, socket_1.getOnlineAdminSupportSockets)();
                sockets.forEach((socketId) => {
                    socket_1.io.to(socketId).emit("newOrder", orderData);
                });
            }
            return paymentResult;
        }
        else {
            throw new Error(`Payment validation failed: ${validation.failedreason || "Unknown validation error"}`);
        }
    }
    catch (error) {
        throw new Error(`SSLCommerz success handling failed: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Get order payment status for user callbacks
 */
async function getOrderPaymentStatus(tranId) {
    try {
        const orderIdMatch = tranId.match(/ORDER_(\d+)_/);
        if (!orderIdMatch) {
            throw new Error("Invalid transaction ID format");
        }
        const orderId = Number(orderIdMatch[1]);
        const payment = await prismaClient_1.default.payment.findUnique({
            where: {
                orderId,
                transactionId: tranId,
            },
            include: {
                order: {
                    select: {
                        status: true,
                        paymentStatus: true,
                    },
                },
            },
        });
        if (!payment) {
            throw new Error("Payment not found");
        }
        return {
            orderId,
            paymentStatus: payment.paymentStatus,
            orderStatus: payment.order.status,
        };
    }
    catch (error) {
        throw new Error(`Failed to get payment status: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Handle SSLCommerz payment failure
 */
async function handleSSLCommerzFailure(failureData) {
    try {
        // Extract order ID and update payment status
        const tranId = failureData.tran_id;
        const orderIdMatch = tranId.match(/ORDER_(\d+)_/);
        if (!orderIdMatch) {
            throw new Error("Invalid transaction ID format");
        }
        const orderId = Number(orderIdMatch[1]);
        await prismaClient_1.default.$transaction(async (tx) => {
            // Find the specific payment record
            const payment = await tx.payment.findFirst({
                where: {
                    orderId,
                    transactionId: tranId,
                },
            });
            if (!payment) {
                throw new Error(`No matching payment found for orderId ${orderId}`);
            }
            if (payment.paymentStatus === "FAILED") {
                return; // Already failed, nothing to do
            }
            if (payment.paymentStatus !== "PENDING") {
                throw new Error(`Cannot mark payment as FAILED — current status is ${payment.paymentStatus}`);
            }
            // Mark payment as FAILED
            await tx.payment.update({
                where: { paymentId: payment.paymentId },
                data: { paymentStatus: "FAILED" },
            });
            // Update order status if still pending
            const order = await tx.order.findUnique({
                where: { orderId },
                include: { customer: true },
            });
            if (!order)
                throw new Error("Order not found");
            if (order && order.paymentStatus === "PENDING") {
                await tx.order.update({
                    where: { orderId },
                    data: { paymentStatus: "FAILED" },
                });
            }
            // Notify the customer
            const message = `দুঃখিত! আপনার অর্ডারটি সম্পন্ন করা যায়নি কারণ পেমেন্ট সফল হয়নি। অনুগ্রহ করে আবার চেষ্টা করুন। (অর্ডার আইডিঃ #${order.orderId})`;
            await (0, sendNotification_1.sendNotification)(message, "ORDER", "CUSTOMER", order.customer.userId, tx);
        });
    }
    catch (error) {
        console.error("handleSSLCommerzFailure error:", error);
        throw new Error(`Failed to handle SSLCommerz payment: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Retrieve all payments
 */
// export async function getAllPayments(): Promise<Payment[]> {
//   try {
//     const payments = await prisma.payment.findMany();
//     return payments;
//   } catch (error) {
//     throw new Error(`Failed to fetch payments: ${getErrorMessage(error)}`);
//   }
// }
// Refactor must be done-------------------------------------------------------------------------->
async function getAllPayments(paymentStatus) {
    try {
        // Only include paymentStatus if it's a valid enum value
        const validStatuses = Object.values(client_1.PaymentStatus);
        const whereClause = paymentStatus && validStatuses.includes(paymentStatus)
            ? { paymentStatus: paymentStatus }
            : {};
        const payments = await prismaClient_1.default.payment.findMany({
            where: whereClause,
        });
        return payments;
    }
    catch (error) {
        throw new Error(`Failed to fetch payments: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Retrieve a payment by its ID
 */
async function getPaymentById(paymentId) {
    try {
        const payment = await prismaClient_1.default.payment.findUnique({
            where: { paymentId: Number(paymentId) },
        });
        return payment;
    }
    catch (error) {
        throw new Error(`Failed to fetch payment: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Update a payment by its ID
 */
async function updatePayment(paymentId, data) {
    try {
        if (data.orderId) {
            const order = await prismaClient_1.default.order.findUnique({
                where: { orderId: Number(data.orderId) },
            });
            if (!order) {
                throw new Error("Order not found");
            }
        }
        if (data.walletTransactionId) {
            const walletTransaction = await prismaClient_1.default.walletTransaction.findUnique({
                where: { transactionId: Number(data.walletTransactionId) },
            });
            if (!walletTransaction) {
                throw new Error("Wallet transaction not found");
            }
        }
        const payment = await prismaClient_1.default.payment.update({
            where: { paymentId: Number(paymentId) },
            data: {
                amount: data.amount,
                paymentMethod: data.paymentMethod,
                paymentStatus: data.paymentStatus,
                transactionId: data.transactionId,
                orderId: data.orderId,
                walletTransactionId: data.walletTransactionId,
            },
        });
        return payment;
    }
    catch (error) {
        throw new Error(`Failed to update payment: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Delete a payment by its ID
 */
async function deletePayment(paymentId) {
    try {
        await prismaClient_1.default.payment.delete({
            where: { paymentId: Number(paymentId) },
        });
    }
    catch (error) {
        throw new Error(`Failed to delete payment: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
