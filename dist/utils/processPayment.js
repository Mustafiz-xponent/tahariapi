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
exports.processWalletPayment = processWalletPayment;
exports.processCodPayment = processCodPayment;
exports.processSSLCommerzPayment = processSSLCommerzPayment;
exports.validateSSLCommerzPayment = validateSSLCommerzPayment;
const axios_1 = __importDefault(require("axios"));
const prismaClient_1 = __importDefault(require("@/prisma-client/prismaClient"));
const errorHandler_1 = require("@/utils/errorHandler");
const sendNotification_1 = require("@/utils/sendNotification");
const orderService = __importStar(require("@/modules/orders/orders.service"));
const socket_1 = require("@/utils/socket");
const getOrderStatusMessage_1 = require("@/utils/getOrderStatusMessage");
/**
 * Process payment through customer wallet
 */
async function processWalletPayment(data, order) {
    const paymentResult = await prismaClient_1.default.$transaction(async (tx) => {
        // Check if customer has wallet
        if (!order.customer.wallet) {
            throw new Error("Customer wallet not found");
        }
        // Check wallet balance
        const { balance, lockedAmount } = order.customer.wallet;
        const availableBalance = Number(balance) - Number(lockedAmount);
        const orderAmount = Number(order.totalAmount);
        if (availableBalance < orderAmount) {
            throw new Error("Insufficient available wallet balance to place this order.");
        }
        // Deduct amount from wallet
        await tx.wallet.update({
            where: { customerId: Number(order.customerId) },
            data: {
                balance: {
                    decrement: order.totalAmount,
                },
            },
        });
        // Create wallet transaction record
        const walletTransaction = await tx.walletTransaction.create({
            data: {
                amount: order.totalAmount,
                transactionType: "PURCHASE",
                transactionStatus: "COMPLETED",
                description: `Payment for Order #${data.orderId}`,
                walletId: order.customer.wallet.walletId,
                orderId: Number(data.orderId),
            },
        });
        // Create payment record
        const payment = await tx.payment.create({
            data: {
                amount: order.totalAmount,
                paymentMethod: "WALLET",
                paymentStatus: "COMPLETED",
                orderId: Number(data.orderId),
                transactionId: `ORDER_${data.orderId}_${Date.now()}`,
                walletTransactionId: walletTransaction.transactionId,
            },
        });
        // Update order payment status
        const updatedOrder = await tx.order.update({
            where: { orderId: Number(data.orderId) },
            data: {
                paymentStatus: "COMPLETED",
                status: "CONFIRMED",
            },
        });
        // Track the order update
        await tx.orderTracking.create({
            data: {
                orderId: Number(data.orderId),
                status: "CONFIRMED",
                description: "Order confirmed and payment completed via wallet",
            },
        });
        for (const item of order.orderItems) {
            // Decrement product stock
            await tx.product.update({
                where: { productId: item.productId },
                data: {
                    stockQuantity: {
                        decrement: item.quantity * item.packageSize,
                    },
                },
            });
            // Create stock transaction record
            await tx.stockTransaction.create({
                data: {
                    quantity: item.quantity * item.packageSize,
                    transactionType: "OUT",
                    productId: item.productId,
                    orderId: Number(data.orderId),
                    description: `Stock reduced for Order #${data.orderId}`,
                },
            });
        }
        // Notify the customer
        const customerMessage = (0, getOrderStatusMessage_1.getOrderStatusMessage)(updatedOrder.status, data.orderId);
        await (0, sendNotification_1.sendNotification)(customerMessage, "ORDER", "CUSTOMER", order.customer.userId, tx);
        // Notify the admin/support
        const adminNotificationMessage = `একজন ব্যবহারকারী একটি নতুন অর্ডার ক্রয় করেছেন। 
    অর্ডার আইডি: #${data.orderId} এবং গ্রাহকের আইডি: #${order.customer.customerId}`;
        await (0, sendNotification_1.sendNotification)(adminNotificationMessage, "ORDER", "ADMIN_SUPPORT", null, tx);
        return payment;
    });
    // Emit to all connected support/admin sockets
    if (paymentResult) {
        const orderData = await orderService.getOrderById(order.orderId);
        const sockets = (0, socket_1.getOnlineAdminSupportSockets)();
        sockets.forEach((socketId) => {
            socket_1.io.to(socketId).emit("newOrder", orderData);
        });
    }
    return { payment: paymentResult };
}
/**
 * Process COD payment
 */
async function processCodPayment(data, order) {
    const paymentResult = await prismaClient_1.default.$transaction(async (tx) => {
        const existingPayment = await tx.payment.findFirst({
            where: { orderId: Number(data.orderId) },
        });
        if (existingPayment) {
            throw new Error(`Payment record already exists for order #${data.orderId}`);
        }
        // Create a pending payment record
        const payment = await tx.payment.create({
            data: {
                amount: order.totalAmount,
                paymentMethod: "COD",
                paymentStatus: "PENDING",
                orderId: Number(data.orderId),
                transactionId: `ORDER_${data.orderId}_${Date.now()}`,
            },
        });
        // Update order status "AWAITING_CONFIRMATION"
        await tx.order.update({
            where: { orderId: Number(data.orderId) },
            data: {
                paymentStatus: "PENDING",
                status: "CONFIRMED",
            },
        });
        // Track the order update
        await tx.orderTracking.create({
            data: {
                orderId: Number(data.orderId),
                status: "CONFIRMED",
                description: "Order created and confirmed. payment pending for Cash on Delivery",
            },
        });
        // Notify the customer
        const message = `ধন্যবাদ! আপনার অর্ডারটি নিশ্চিত হয়েছে। দয়া করে পণ্য গ্রহণের সময় পেমেন্ট করুন। (অর্ডার আইডিঃ #${data.orderId})`;
        await (0, sendNotification_1.sendNotification)(message, "ORDER", "CUSTOMER", order.customer.userId, tx);
        // Notify the admin/support
        const adminNotificationMessage = `একজন গ্রাহক একটি নতুন অর্ডার ক্রয় করেছেন। 
    অর্ডার আইডি: #${data.orderId} এবং গ্রাহকের আইডি: #${order.customer.customerId}`;
        await (0, sendNotification_1.sendNotification)(adminNotificationMessage, "ORDER", "ADMIN_SUPPORT", null, tx);
        return payment;
    });
    // Emit to all connected support/admin sockets
    if (paymentResult) {
        const orderData = await orderService.getOrderById(order.orderId);
        const sockets = (0, socket_1.getOnlineAdminSupportSockets)();
        sockets.forEach((socketId) => {
            socket_1.io.to(socketId).emit("newOrder", orderData);
        });
    }
    return { payment: paymentResult };
}
/**
 * Process payment through SSLCommerz
 */
async function processSSLCommerzPayment(data, order) {
    try {
        // Check if there's any existing COMPLETED or REFUNDED payment for this order
        const completedOrRefunded = await prismaClient_1.default.payment.findFirst({
            where: {
                orderId: Number(data.orderId),
                paymentMethod: "SSLCOMMERZ",
                paymentStatus: {
                    in: ["COMPLETED", "REFUNDED"],
                },
            },
        });
        if (completedOrRefunded) {
            throw new Error(`This order has already been ${completedOrRefunded.paymentStatus}. Payment not allowed.`);
        }
        // Check if SSLCommerz payment already PENDING or FAILED for this order
        const existingPayment = await prismaClient_1.default.payment.findFirst({
            where: {
                orderId: Number(data.orderId),
                paymentMethod: "SSLCOMMERZ",
                paymentStatus: {
                    in: ["PENDING", "FAILED"],
                },
            },
        });
        // Initialize SSLCommerz payment
        const sslcommerzResponse = await initializeSSLCommerzPayment({
            orderId: data.orderId,
            amount: order.totalAmount,
            customerEmail: order.customer.user.email,
            customerPhone: order.customer.user.phone,
            customerName: order.customer.user.name,
        });
        // Validate SSLCommerz response
        if (!sslcommerzResponse || sslcommerzResponse.status !== "SUCCESS") {
            throw new Error(`SSLCommerz initialization failed: ${sslcommerzResponse?.failedreason || "Unknown error"}`);
        }
        let payment;
        if (existingPayment) {
            // Update the failed or pending payment
            payment = await prismaClient_1.default.payment.update({
                where: { paymentId: existingPayment.paymentId },
                data: {
                    transactionId: sslcommerzResponse.transactionId,
                    paymentStatus: "PENDING",
                },
            });
        }
        else {
            // Create new payment
            payment = await prismaClient_1.default.payment.create({
                data: {
                    amount: order.totalAmount,
                    paymentMethod: "SSLCOMMERZ",
                    paymentStatus: "PENDING",
                    transactionId: sslcommerzResponse.transactionId,
                    orderId: Number(data.orderId),
                },
            });
        }
        return {
            payment,
            redirectUrl: sslcommerzResponse.redirectGatewayURL,
        };
    }
    catch (error) {
        console.error("SSLCommerz payment processing error:", error);
        throw new Error(`SSLCommerz payment failed: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 *  SSLCommerz payment gateway initialization using direct API calls
 */
async function initializeSSLCommerzPayment(data) {
    try {
        // Validate environment variables
        if (!process.env.SSLCOMMERZ_STORE_ID ||
            !process.env.SSLCOMMERZ_STORE_PASSWD) {
            throw new Error("SSLCommerz credentials not configured");
        }
        // Determine the base URL based on environment
        const isLive = process.env.NODE_ENV === "production";
        const baseUrl = isLive
            ? "https://securepay.sslcommerz.com"
            : "https://sandbox.sslcommerz.com";
        const transactionId = `ORDER_${data.orderId}_${Date.now()}`;
        // Prepare payment data for SSLCommerz API
        const paymentData = {
            store_id: process.env.SSLCOMMERZ_STORE_ID,
            store_passwd: process.env.SSLCOMMERZ_STORE_PASSWD,
            total_amount: Number(data.amount).toFixed(2),
            currency: "BDT",
            tran_id: transactionId,
            success_url: `${process.env.SERVER_URL}/api/payments/sslcommerz/success`,
            fail_url: `${process.env.SERVER_URL}/api/payments/sslcommerz/fail`,
            cancel_url: `${process.env.SERVER_URL}/api/payments/sslcommerz/cancel`,
            ipn_url: `${process.env.SERVER_URL}/api/payments/sslcommerz/ipn`,
            shipping_method: "Courier",
            product_name: `Order Payment #${data.orderId}`,
            product_category: "Food",
            product_profile: "general",
            cus_name: data.customerName || "Customer",
            cus_email: data.customerEmail || "customer@example.com",
            cus_add1: "N/A",
            cus_city: "Chittagong",
            cus_state: "Chittagong",
            cus_postcode: "1000",
            cus_country: "Bangladesh",
            cus_phone: data.customerPhone,
            ship_name: data.customerName || "Customer",
            ship_add1: "N/A",
            ship_city: "Chittagong",
            ship_state: "Chittagong",
            ship_postcode: "1000",
            ship_country: "Bangladesh",
        };
        // Make the API call to SSLCommerz
        const response = await axios_1.default.post(`${baseUrl}/gwprocess/v4/api.php`, new URLSearchParams(paymentData).toString(), {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Accept: "application/json",
            },
            timeout: 30000, // 30 seconds timeout
        });
        // Check if the response is successful
        if (response.data.status === "SUCCESS") {
            return {
                status: "SUCCESS",
                sessionkey: response.data.sessionkey,
                redirectGatewayURL: response.data.GatewayPageURL,
                failedreason: null,
                transactionId,
            };
        }
        else {
            return {
                status: "FAILED",
                sessionkey: null,
                redirectGatewayURL: null,
                failedreason: response.data.failedreason || "Unknown error from SSLCommerz",
            };
        }
    }
    catch (error) {
        if (axios_1.default.isAxiosError(error)) {
            // Handle specific HTTP errors
            if (error.response?.status === 400) {
                throw new Error(`SSLCommerz API Bad Request: ${error.response.data?.failedreason || "Invalid request parameters"}`);
            }
            else if (error.response?.status === 401) {
                throw new Error("SSLCommerz API Authentication failed: Invalid store credentials");
            }
            else if (error.response?.status >= 500) {
                throw new Error("SSLCommerz API server error: Please try again later");
            }
            else {
                throw new Error(`SSLCommerz API request failed: ${error.message}`);
            }
        }
        const code = error.code;
        // Handle network errors
        if (code === "ECONNABORTED") {
            throw new Error("SSLCommerz API timeout: Request took too long");
        }
        else if (code === "ENOTFOUND" || code === "ECONNREFUSED") {
            throw new Error("SSLCommerz API connection failed: Network error");
        }
        throw error;
    }
}
/**
 * Validate SSLCommerz payment
 */
async function validateSSLCommerzPayment(validationData) {
    try {
        const isLive = process.env.NODE_ENV === "production";
        const baseUrl = isLive
            ? "https://securepay.sslcommerz.com"
            : "https://sandbox.sslcommerz.com";
        const validationParams = {
            val_id: validationData.val_id,
            store_id: process.env.SSLCOMMERZ_STORE_ID,
            store_passwd: process.env.SSLCOMMERZ_STORE_PASSWD,
            v: 1, // optional
            format: "json", // optional: for JSON response instead of XML
        };
        const response = await axios_1.default.get(`${baseUrl}/validator/api/validationserverAPI.php`, {
            params: validationParams,
            timeout: 30000,
        });
        return response.data;
    }
    catch (error) {
        throw error;
    }
}
