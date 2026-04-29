"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const jobs_1 = require("@/jobs");
const http_status_1 = __importDefault(require("http-status"));
const compression_1 = __importDefault(require("compression"));
const sendResponse_1 = __importDefault(require("@/utils/sendResponse"));
const deal_routes_1 = __importDefault(require("@/modules/deals/deal.routes"));
const rateLimiter_1 = require("@/middlewares/rateLimiter");
// import routes
const admins_routes_1 = __importDefault(require("@/modules/admins/admins.routes"));
const orders_routes_1 = __importDefault(require("@/modules/orders/orders.routes"));
const wallet_routes_1 = __importDefault(require("@/modules/wallets/wallet.routes"));
const farmers_routes_1 = __importDefault(require("@/modules/farmers/farmers.routes"));
const message_routes_1 = __importDefault(require("@/modules/messages/message.routes"));
const payment_routes_1 = __importDefault(require("@/modules/payments/payment.routes"));
const product_routes_1 = __importDefault(require("@/modules/products/product.routes"));
const errorHandler_1 = require("@/middlewares/errorHandler");
const admin_routes_1 = __importDefault(require("@/modules/auth/admin/admin.routes"));
const customer_routes_1 = __importDefault(require("@/modules/customers/customer.routes"));
const category_routes_1 = __importDefault(require("@/modules/categories/category.routes"));
const dashboard_route_1 = __importDefault(require("@/modules/dashboard/dashboard.route"));
const express_1 = __importDefault(require("express"));
const promotion_routes_1 = __importDefault(require("@/modules/promotions/promotion.routes"));
const order_item_route_1 = __importDefault(require("@/modules/order_items/order-item.route"));
const customer_routes_2 = __importDefault(require("@/modules/auth/customer/customer.routes"));
const subscription_routes_1 = __importDefault(require("@/modules/subscriptions/subscription.routes"));
const notification_routes_1 = __importDefault(require("@/modules/notifications/notification.routes"));
const order_tracking_routes_1 = __importDefault(require("@/modules/order_tracking/order-tracking.routes"));
const farmer_payment_routes_1 = __importDefault(require("@/modules/farmer_payments/farmer_payment.routes"));
const stock_transaction_routes_1 = __importDefault(require("@/modules/stock_transactions/stock_transaction.routes"));
const subscription_plan_routes_1 = __importDefault(require("@/modules/subscription_plans/subscription_plan.routes"));
const inventory_purchase_routes_1 = __importDefault(require("@/modules/inventory_purchases/inventory_purchase.routes"));
const wallet_transaction_routes_1 = __importDefault(require("@/modules/wallet_transactions/wallet_transaction.routes"));
const farmer_transactions_routes_1 = __importDefault(require("@/modules/farmer_transactions/farmer_transactions.routes"));
const subscription_delivery_routes_1 = __importDefault(require("@/modules/subscription_deliveries/subscription-delivery.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// Core Middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)("dev"));
app.use((0, compression_1.default)());
app.use((0, rateLimiter_1.rateLimiter)(1000, 15 * 60 * 1000)); // 1000 requests per 15 minutes for dev
app.set("trust proxy", 1);
const corsOptions = {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
};
app.use((0, cors_1.default)(corsOptions));
// Initialize cron jobs
(0, jobs_1.initJobs)();
// Global BigInt Serializer
BigInt.prototype.toJSON = function () {
    return this.toString();
};
app.use("/api/admins", admins_routes_1.default);
app.use("/api/auth/customer", customer_routes_2.default);
app.use("/api/auth/admin", admin_routes_1.default);
app.use("/api/farmers", farmers_routes_1.default);
app.use("/api/categories", category_routes_1.default);
app.use("/api/products", product_routes_1.default);
app.use("/api/inventory-purchases", inventory_purchase_routes_1.default);
app.use("/api/farmer-transactions", farmer_transactions_routes_1.default);
app.use("/api/farmer-payments", farmer_payment_routes_1.default);
app.use("/api/stock-transactions", stock_transaction_routes_1.default);
app.use("/api/orders", orders_routes_1.default);
app.use("/api/order-items", order_item_route_1.default);
app.use("/api/order-trackings", order_tracking_routes_1.default);
app.use("/order-trackings", order_tracking_routes_1.default); // Fallback route without /api prefix
app.use("/api/payments", payment_routes_1.default);
app.use("/api/wallets", wallet_routes_1.default);
app.use("/api/wallet-transactions", wallet_transaction_routes_1.default);
app.use("/api/subscriptions", subscription_routes_1.default);
app.use("/api/subscription-plans", subscription_plan_routes_1.default);
app.use("/api/subscription-deliveries", subscription_delivery_routes_1.default);
app.use("/api/messages", message_routes_1.default);
app.use("/api/customers", customer_routes_1.default);
app.use("/api/notifications", notification_routes_1.default);
app.use("/api/promotions", promotion_routes_1.default);
app.use("/api/deals", deal_routes_1.default);
app.use("/api/dashboard", dashboard_route_1.default);
// Health check route
app.get("/health", (_req, res) => {
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Server is running",
    });
});
// API route not found
app.use((_req, res) => {
    (0, sendResponse_1.default)(res, {
        success: false,
        statusCode: http_status_1.default.NOT_FOUND,
        message: "API route not found",
    });
});
// Global error handler
app.use(errorHandler_1.globalErrorHandler);
exports.default = app;
