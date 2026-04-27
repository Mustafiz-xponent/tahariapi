import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgran from "morgan";
import { initJobs } from "@/jobs";
import httpStatus from "http-status";
import compression from "compression";
import sendResponse from "@/utils/sendResponse";
import dealRoutes from "@/modules/deals/deal.routes";
import { rateLimiter } from "@/middlewares/rateLimiter";
// import routes
import adminRoutes from "@/modules/admins/admins.routes";
import orderRoutes from "@/modules/orders/orders.routes";
import walletRoutes from "@/modules/wallets/wallet.routes";
import farmerRoutes from "@/modules/farmers/farmers.routes";
import messageRoutes from "@/modules/messages/message.routes";
import paymentRoutes from "@/modules/payments/payment.routes";
import productRoutes from "@/modules/products/product.routes";
import { globalErrorHandler } from "@/middlewares/errorHandler";
import adminUserRoutes from "@/modules/auth/admin/admin.routes";
import customerRoutes from "@/modules/customers/customer.routes";
import categoryRoutes from "@/modules/categories/category.routes";
import dashboardRoutes from "@/modules/dashboard/dashboard.route";
import express, { Request, Response, Application } from "express";
import promotionRoutes from "@/modules/promotions/promotion.routes";
import orderItemRoutes from "@/modules/order_items/order-item.route";
import customerUserRoutes from "@/modules/auth/customer/customer.routes";
import subscriptionRoutes from "@/modules/subscriptions/subscription.routes";
import notificationsRoutes from "@/modules/notifications/notification.routes";
import orderTrackingRoutes from "@/modules/order_tracking/order-tracking.routes";
import farmerPaymentRoutes from "@/modules/farmer_payments/farmer_payment.routes";
import stockTransactionRoutes from "@/modules/stock_transactions/stock_transaction.routes";
import subscriptionPlanRoutes from "@/modules/subscription_plans/subscription_plan.routes";
import inventoryPurchaseRoutes from "@/modules/inventory_purchases/inventory_purchase.routes";
import walletTransactionRoutes from "@/modules/wallet_transactions/wallet_transaction.routes";
import farmerTransactionRoutes from "@/modules/farmer_transactions/farmer_transactions.routes";
import subscriptionDeliveryRoutes from "@/modules/subscription_deliveries/subscription-delivery.routes";

dotenv.config();

const app: Application = express();
// Core Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(morgran("dev"));
app.use(compression());
app.use(rateLimiter(1000, 15 * 60 * 1000)); // 1000 requests per 15 minutes for dev
app.set("trust proxy", 1);
const corsOptions = {
  origin: process.env.CLIENT_URL,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
};
app.use(cors(corsOptions));
// Initialize cron jobs
initJobs();

// Global BigInt Serializer
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

app.use("/api/admins", adminRoutes);
app.use("/api/auth/customer", customerUserRoutes);
app.use("/api/auth/admin", adminUserRoutes);
app.use("/api/farmers", farmerRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/inventory-purchases", inventoryPurchaseRoutes);
app.use("/api/farmer-transactions", farmerTransactionRoutes);
app.use("/api/farmer-payments", farmerPaymentRoutes);
app.use("/api/stock-transactions", stockTransactionRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/order-items", orderItemRoutes);
app.use("/api/order-trackings", orderTrackingRoutes);
app.use("/order-trackings", orderTrackingRoutes); // Fallback route without /api prefix
app.use("/api/payments", paymentRoutes);
app.use("/api/wallets", walletRoutes);
app.use("/api/wallet-transactions", walletTransactionRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/subscription-plans", subscriptionPlanRoutes);
app.use("/api/subscription-deliveries", subscriptionDeliveryRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/promotions", promotionRoutes);
app.use("/api/deals", dealRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Health check route
app.get("/health", (_req: Request, res: Response) => {
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Server is running",
  });
});
// API route not found
app.use((_req: Request, res: Response) => {
  sendResponse(res, {
    success: false,
    statusCode: httpStatus.NOT_FOUND,
    message: "API route not found",
  });
});
// Global error handler
app.use(globalErrorHandler);

export default app;
